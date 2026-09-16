# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
"""Playwright template for the card in the dev HA (see ai/local-ha-testing.md).

Phone viewport, dark scheme, token injected before navigation so there is
no login form. Copy, keep the helpers, replace `scenario()`.

Run: HA_TOKEN=... python3 scripts/ui_local.py [out_dir]
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import urllib.request

from playwright.async_api import Page, async_playwright

URL = os.environ.get("HA_URL", "http://localhost:8123")
TOKEN = os.environ["HA_TOKEN"]
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
DASHBOARD = "/dashboard-test/0"


def api(path: str, body: dict | None = None):
    """REST call with the bearer token."""
    req = urllib.request.Request(
        URL + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "Authorization": "Bearer " + TOKEN,
            "Content-Type": "application/json",
        },
    )
    return json.load(urllib.request.urlopen(req))


async def wait_ready() -> None:
    """After `docker compose restart homeassistant`."""
    for _ in range(120):
        try:
            api("/api/config")
            return
        except Exception:
            await asyncio.sleep(1)
    raise SystemExit("HA did not come up")


async def tap(page: Page, locator) -> None:
    box = await locator.bounding_box()
    await page.touchscreen.tap(
        box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    )


async def long_press(page: Page, cdp, locator, ms: int = 700) -> None:
    """Real touch long press (pointerType touch) — what the card's tooltip keys on."""
    box = await locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    await cdp.send(
        "Input.dispatchTouchEvent",
        {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]},
    )
    await page.wait_for_timeout(ms)
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


async def pick_dropdown(page: Page, card, label_text: str) -> None:
    """Open the slot editor's Action dropdown (ha-form select) and pick by text."""
    select = card.locator("ha-form ha-selector-select").first
    await select.wait_for(timeout=10000)
    await tap(page, select)
    await page.wait_for_timeout(800)
    item = page.get_by_text(label_text).first
    await item.wait_for(timeout=5000)
    box = await item.bounding_box()
    await page.touchscreen.tap(box["x"] + 20, box["y"] + box["height"] / 2)
    await page.wait_for_timeout(800)


async def scenario(page: Page, card, cdp) -> None:
    """Replace me. Example: enter edit mode, open button 1, screenshot."""
    await tap(
        page,
        card.locator(".header ha-icon-button:has(ha-icon[icon='mdi:pencil'])").first,
    )
    await page.wait_for_timeout(600)
    await tap(page, card.locator(".cell").first)
    await page.wait_for_timeout(800)
    await page.screenshot(path=f"{OUT}/sheet.png")
    rows = await card.locator(".event-list li").all_inner_texts()
    print("rows:", [r.replace("\n", " ") for r in rows])


async def main() -> None:
    await wait_ready()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": 412, "height": 915},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            color_scheme="dark",
        )
        page = await ctx.new_page()
        page.on(
            "console",
            lambda m: (
                print("console:", m.type, m.text[:160]) if m.type == "error" else None
            ),
        )
        # HA frontend reads its session from localStorage.hassTokens
        await page.add_init_script(
            "localStorage.setItem('hassTokens', JSON.stringify({"
            f"access_token: '{TOKEN}', token_type: 'Bearer', expires_in: 1800, "
            "expires: Date.now() + 10*365*864e5, hassUrl: location.origin, "
            "clientId: location.origin + '/', refresh_token: 'x'}))"
        )
        await page.goto(URL + DASHBOARD)
        card = page.locator("remote-mapper-card").first  # locators pierce shadow DOM
        await card.wait_for(timeout=60000)
        await page.wait_for_timeout(3000)  # lazy HA components
        cdp = await ctx.new_cdp_session(page)
        await scenario(page, card, cdp)
        await browser.close()


asyncio.run(main())
