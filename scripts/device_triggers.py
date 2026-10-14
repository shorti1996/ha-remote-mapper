# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Build tests/fixtures/{deconz,zha,hue}_triggers.json: device-trigger catalogs.

HA device triggers are ``(type, subtype)`` pairs. Per device the fixture
records the pairs the platform enumerates, the action ids the device_trigger
adapter makes of them (``action_ids_from_triggers``) and the buttons
``group_buttons`` makes of those ids. tests/test_trigger_catalogs.py asserts
both still match, so an adapter or parser change shows up as a diff here.

Zigbee2MQTT is the one platform where the type is always ``action``; its
catalog is tests/fixtures/z2m_actions.json (scripts/z2m_actions.py).

Sources:

- ``deconz``: HA's own table, ``homeassistant/components/deconz/
  device_trigger.py`` (``REMOTES``, one entry per model), read with ``ast``
  because importing the module needs ``pydeconz``.
- ``zha``: zha-quirks, v1 ``CustomDevice`` classes that declare
  ``device_automation_triggers`` and v2 ``QuirkBuilder`` entries, plus the
  ``device_offline`` trigger ZHA adds to every device.
- ``hue``: written by hand in this file from ``hue/const.py`` (v2 API):
  five button events per button, ``initial_press`` only on the tap switch,
  rotary ``start``/``repeat`` x direction on the tap dial.

Refresh (zha-quirks is not a project dependency; ``--with`` layers it on):
    uv run --with zha-quirks python scripts/device_triggers.py           # all
    uv run --with zha-quirks python scripts/device_triggers.py zha hue   # some

After an intended adapter or parser change, recompute ids and buttons from
the saved pairs without touching the sources:
    uv run python scripts/device_triggers.py --regroup
"""

from __future__ import annotations

import ast
import importlib.metadata
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from custom_components.remote_mapper.adapters.device_trigger import (  # noqa: E402
    action_ids_from_triggers,
)
from custom_components.remote_mapper.buttons import group_buttons  # noqa: E402

FIXTURES = ROOT / "tests/fixtures"
PLATFORMS = ("deconz", "zha", "hue")

Pair = tuple[str, str | int]


def grouped(actions: list[str]) -> dict[str, list[str]]:
    """Button id → its events, as the card gets them."""
    return {
        button["id"]: [action["event"] for action in button["actions"]]
        for button in group_buttons("device_trigger", actions)
    }


def actions(triggers: list[Pair]) -> list[str]:
    """Action ids the adapter derives from enumerated ``(type, subtype)`` pairs."""
    return action_ids_from_triggers(
        [{"type": kind, "subtype": subtype} for kind, subtype in triggers]
    )


# --- deCONZ -----------------------------------------------------------------


def _ha_components() -> Path:
    spec = importlib.util.find_spec("homeassistant.components")
    assert spec is not None and spec.submodule_search_locations
    return Path(next(iter(spec.submodule_search_locations)))


def extract_deconz() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """One entry per model in deCONZ's ``REMOTES``; tables are literal dicts."""
    path = _ha_components() / "deconz/device_trigger.py"
    tree = ast.parse(path.read_text())
    consts: dict[str, Any] = {}
    tables: dict[str, list[Pair]] = {}
    remotes: dict[str, str] = {}

    def value(node: ast.expr) -> Any:
        if isinstance(node, ast.Constant):
            return node.value
        assert isinstance(node, ast.Name), ast.dump(node)
        return consts[node.id]

    for node in tree.body:
        if not (
            isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
        ):
            continue
        name = node.targets[0].id
        if isinstance(node.value, ast.Constant):
            consts[name] = node.value.value
        elif isinstance(node.value, ast.Dict) and name == "REMOTES":
            for key, table in zip(node.value.keys, node.value.values, strict=True):
                assert key is not None and isinstance(table, ast.Name)
                remotes[value(key)] = table.id
        elif isinstance(node.value, ast.Dict):
            keys = [k for k in node.value.keys if isinstance(k, ast.Tuple)]
            if keys:
                tables[name] = [(value(k.elts[0]), value(k.elts[1])) for k in keys]

    devices = [
        {"model": model, "table": table, "triggers": tables[table]}
        for model, table in remotes.items()
    ]
    source = {
        "platform": "deconz",
        "from": "homeassistant/components/deconz/device_trigger.py REMOTES",
        "homeassistant": importlib.metadata.version("homeassistant"),
    }
    return source, devices


# --- ZHA --------------------------------------------------------------------

# Every ZHA device gets this pair in front of its quirk's
# (zha/zigbee/device.py get_device_automation_triggers).
ZHA_DEVICE_OFFLINE: Pair = ("device_offline", "device_offline")


def extract_zha() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Every zha-quirks quirk with triggers: v1 classes and v2 builder entries."""
    import importlib as _importlib
    import inspect
    import pkgutil
    import warnings

    warnings.simplefilter("ignore", DeprecationWarning)
    import zhaquirks
    from zhaquirks.builder import QuirkBuilder
    from zhaquirks.const import MODELS_INFO
    from zhaquirks.legacy import CustomDevice

    modules = [
        _importlib.import_module(m.name)
        for m in pkgutil.walk_packages(zhaquirks.__path__, "zhaquirks.")
    ]

    devices: list[dict[str, Any]] = []
    for module in modules:
        for name, cls in inspect.getmembers(module, inspect.isclass):
            if cls.__module__ != module.__name__ or not issubclass(cls, CustomDevice):
                continue
            triggers = getattr(cls, "device_automation_triggers", None)
            if not triggers:
                continue
            # Base classes (IKEA, Tuya) carry triggers with no signature;
            # their subclasses inherit them and list their own models.
            models = (cls.signature or {}).get(MODELS_INFO, [])
            devices.append(
                {
                    "quirk": f"{module.__name__}.{name}",
                    "quirk_version": 1,
                    "models": [list(m) for m in models],
                    "triggers": [ZHA_DEVICE_OFFLINE, *map(tuple, triggers)],
                }
            )

    # v2 quirks compile into the shared registry at import time.
    registry = QuirkBuilder("probe", "probe").registry
    seen: dict[int, Any] = {}
    for entries in registry._registry.values():
        for entry in entries:
            seen.setdefault(id(entry), entry)
    for entry in seen.values():
        triggers = entry.zha_device_factory.quirk_definition.device_automation_triggers
        if not triggers:
            continue
        devices.append(
            {
                "quirk": f"{entry.source.module} {entry.source.label}",
                "quirk_version": 2,
                "models": [list(m) for m in entry.device_match.applies_to],
                "triggers": [ZHA_DEVICE_OFFLINE, *map(tuple, triggers)],
            }
        )

    devices.sort(key=lambda d: d["quirk"])
    source = {
        "platform": "zha",
        "from": "zha-quirks v1 CustomDevice.device_automation_triggers and v2 "
        "QuirkBuilder entries; device_offline from zha",
        "zha-quirks": importlib.metadata.version("zha-quirks"),
        "zha": importlib.metadata.version("zha"),
    }
    return source, devices


# --- Hue v2 -----------------------------------------------------------------

HUE_BUTTON_EVENTS = (
    "initial_press",
    "repeat",
    "short_release",
    "long_press",
    "long_release",
)
HUE_TAP_EVENTS = ("initial_press",)
HUE_ROTARY = [
    (action, direction)
    for action in ("start", "repeat")
    for direction in ("clock_wise", "counter_clock_wise")
]


def _hue_buttons(count: int, events: tuple[str, ...]) -> list[Pair]:
    # subtype is the button resource's control_id, an int (hue/v2/device_trigger.py)
    return [
        (event, control_id) for control_id in range(1, count + 1) for event in events
    ]


def extract_hue() -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Hue v2 remotes, by hand: product name → button count and event set."""
    devices = [
        {"model": "Hue dimmer switch", "triggers": _hue_buttons(4, HUE_BUTTON_EVENTS)},
        {"model": "Hue smart button", "triggers": _hue_buttons(1, HUE_BUTTON_EVENTS)},
        {
            "model": "Hue wall switch module",
            "triggers": _hue_buttons(2, HUE_BUTTON_EVENTS),
        },
        {"model": "Hue tap switch", "triggers": _hue_buttons(4, HUE_TAP_EVENTS)},
        {
            "model": "Hue tap dial switch",
            "triggers": [*_hue_buttons(4, HUE_BUTTON_EVENTS), *HUE_ROTARY],
        },
    ]
    source = {
        "platform": "hue",
        "from": "hand-written from homeassistant/components/hue/const.py and "
        "hue/v2/device_trigger.py; control_id per model from the Hue v2 API",
        "homeassistant": importlib.metadata.version("homeassistant"),
    }
    return source, devices


# --- output -----------------------------------------------------------------

EXTRACT = {"deconz": extract_deconz, "zha": extract_zha, "hue": extract_hue}


def fixture_path(platform: str) -> Path:
    return FIXTURES / f"{platform}_triggers.json"


def write(platform: str, source: dict[str, Any], devices: list[dict[str, Any]]) -> None:
    """One device per line, so a grouping change is a one-line diff."""
    for device in devices:
        triggers = [tuple(pair) for pair in device["triggers"]]
        device["triggers"] = [list(pair) for pair in triggers]
        device["actions"] = actions(triggers)
        device["buttons"] = grouped(device["actions"])
    source = {
        **source,
        "regenerate": "uv run --with zha-quirks python scripts/device_triggers.py; "
        "after an adapter or parser change: --regroup",
    }
    lines = ",\n".join(json.dumps(d, ensure_ascii=False) for d in devices)
    header = json.dumps(source, ensure_ascii=False)
    path = fixture_path(platform)
    path.parent.mkdir(exist_ok=True)
    path.write_text(f'{{"source": {header},\n"devices": [\n{lines}\n]}}\n')
    pairs = sum(len(d["triggers"]) for d in devices)
    print(f"{len(devices)} devices, {pairs} pairs → {path.relative_to(ROOT)}")


def main() -> None:
    args = sys.argv[1:]
    if args == ["--regroup"]:
        for platform in PLATFORMS:
            saved = json.loads(fixture_path(platform).read_text())
            write(platform, saved["source"], saved["devices"])
        return
    platforms = args or list(PLATFORMS)
    if unknown := set(platforms) - set(PLATFORMS):
        sys.exit(f"unknown platform(s) {sorted(unknown)}; choose from {PLATFORMS}")
    for platform in platforms:
        write(platform, *EXTRACT[platform]())


if __name__ == "__main__":
    main()
