# SPDX-License-Identifier: AGPL-3.0-only
"""Live E2E smoke test against a running HA instance (M0-M4 surface).

Prerequisites: the integration installed with a configured "E2E Remote"
device-trigger entry (see ai/local-ha-testing.md), an MQTT broker the
HA instance listens to, and env vars:

    HA_TOKEN   long-lived access token (required)
    HA_URL     default http://localhost:8123
    MQTT_HOST  broker host reachable from the docker-mosquitto-1
               container (default localhost)

Observability channel: slot sequences fire custom HA events; we listen
on the WS bus. (persistent_notification stopped being an entity long
ago — states-based assertions don't work.)

Run: HA_TOKEN=... MQTT_HOST=... uv run python scripts/e2e_live.py
"""

import asyncio
import json
import os
import subprocess
import sys

import aiohttp

BASE = os.environ.get("HA_URL", "http://localhost:8123")
BROKER = os.environ.get("MQTT_HOST", "localhost")
TOKEN = os.environ["HA_TOKEN"]


class WS:
    def __init__(self, session):
        self.session = session
        self.ws = None
        self.msg_id = 0
        self.events = asyncio.Queue()
        self._reader_task = None

    async def connect(self):
        self.ws = await self.session.ws_connect(f"{BASE}/api/websocket")
        await self.ws.receive_json()
        await self.ws.send_json({"type": "auth", "access_token": TOKEN})
        msg = await self.ws.receive_json()
        assert msg["type"] == "auth_ok", msg
        self.pending = {}
        self._reader_task = asyncio.create_task(self._reader())

    async def _reader(self):
        async for raw in self.ws:
            msg = json.loads(raw.data)
            if msg["type"] == "result":
                fut = self.pending.pop(msg["id"], None)
                if fut:
                    fut.set_result(msg)
            elif msg["type"] == "event":
                await self.events.put(msg["event"])

    async def cmd(self, payload):
        self.msg_id += 1
        fut = asyncio.get_event_loop().create_future()
        self.pending[self.msg_id] = fut
        await self.ws.send_json({"id": self.msg_id, **payload})
        return await asyncio.wait_for(fut, 10)

    async def wait_event(self, event_type, timeout=6.0):
        deadline = asyncio.get_event_loop().time() + timeout
        while True:
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                raise TimeoutError(f"event {event_type} not seen")
            event = await asyncio.wait_for(self.events.get(), remaining)
            if event.get("event_type") == event_type:
                return event


def mqtt_pub(topic, payload, retain=False):
    args = [
        "docker",
        "exec",
        "docker-mosquitto-1",
        "mosquitto_pub",
        "-h",
        BROKER,
        "-t",
        topic,
    ]
    args += ["-r"] if retain else []
    args += ["-m", payload] if payload is not None else ["-n", "-r"]
    subprocess.run(args, check=True)


def read_container_yaml():
    return subprocess.run(
        ["docker", "exec", "docker-homeassistant-1", "cat", "/config/automations.yaml"],
        capture_output=True,
        text=True,
    ).stdout


async def main():
    ok = []
    async with aiohttp.ClientSession(
        headers={"Authorization": f"Bearer {TOKEN}"}
    ) as session:
        ws = WS(session)
        await ws.connect()
        for etype in ("rm_e2e_slot", "rm_e2e_mat"):
            await ws.cmd({"type": "subscribe_events", "event_type": etype})

        res = await ws.cmd({"type": "config_entries/get"})
        entry_id = next(
            e["entry_id"] for e in res["result"] if e["domain"] == "remote_mapper"
        )
        ok.append(f"entry loaded: {entry_id}")

        res = await ws.cmd({"type": "remote_mapper/ping"})
        ok.append(f"ping: v{res['result']['version']}")

        # 1. store-path dispatch
        res = await ws.cmd(
            {
                "type": "remote_mapper/save_slot",
                "entry_id": entry_id,
                "action_id": "1_single",
                "sequence": [{"event": "rm_e2e_slot"}],
            }
        )
        assert res["success"], res
        mqtt_pub("zigbee2mqtt/e2e_remote/action", "1_single")
        await ws.wait_event("rm_e2e_slot")
        ok.append("physical event → dispatcher → sequence fired")

        # 2. run_slot (couch test)
        await ws.cmd(
            {
                "type": "remote_mapper/run_slot",
                "entry_id": entry_id,
                "action_id": "1_single",
            }
        )
        await ws.wait_event("rm_e2e_slot")
        ok.append("run_slot fired the sequence")

        # 3. materialize
        res = await ws.cmd(
            {
                "type": "remote_mapper/save_slot",
                "entry_id": entry_id,
                "action_id": "1_single",
                "sequence": [{"event": "rm_e2e_mat"}],
                "materialized": True,
            }
        )
        assert res["success"], res
        auto_id = res["result"]["slot"]["automation_id"]
        yaml_txt = read_container_yaml()
        assert auto_id in yaml_txt and "triggers:" in yaml_txt
        ok.append(f"materialized: {auto_id} in automations.yaml (plural keys)")

        res = await ws.cmd(
            {
                "type": "remote_mapper/get_slot",
                "entry_id": entry_id,
                "action_id": "1_single",
            }
        )
        live = res["result"]["live"]
        assert live and live["entity_id"], res["result"]
        ok.append(f"live view: {live['entity_id']} ({live['edit_url']})")

        mqtt_pub("zigbee2mqtt/e2e_remote/action", "1_single")
        await ws.wait_event("rm_e2e_mat")
        ok.append("materialized automation fired on physical event")

        # 4. dematerialize pulling live actions
        res = await ws.cmd(
            {
                "type": "remote_mapper/save_slot",
                "entry_id": entry_id,
                "action_id": "1_single",
                "materialized": False,
            }
        )
        assert res["success"], res
        slot = res["result"]["slot"]
        assert slot["materialized"] is False
        assert slot["sequence"] == [{"event": "rm_e2e_mat"}], slot
        assert auto_id not in read_container_yaml()
        ok.append("dematerialized: live actions folded back, yaml entry gone")

        mqtt_pub("zigbee2mqtt/e2e_remote/action", "1_single")
        await ws.wait_event("rm_e2e_mat")
        ok.append("dispatcher took over after dematerialize")

        # cleanup
        await ws.cmd(
            {
                "type": "remote_mapper/clear_slot",
                "entry_id": entry_id,
                "action_id": "1_single",
            }
        )
        ok.append("slot cleared")

    print("\n".join(f"✓ {line}" for line in ok))
    print("E2E PASS")


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
