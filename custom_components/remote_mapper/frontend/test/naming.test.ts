// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { describe, expect, it } from "vitest";

import { inferName, stepName, type HassNames } from "../src/naming";

const hass: HassNames = {
  states: {
    "scene.lekkie": { attributes: { friendly_name: "Lekkie światło nad biurkiem" } },
    "light.gx53": { attributes: { friendly_name: "GX53 gabinet" } },
    "script.lights_off_soft": { attributes: { friendly_name: "Lights off (soft)" } },
    "select.wled_preset": { attributes: { friendly_name: "WLED sypialnia" } },
  },
  areas: { kuchnia: { name: "Kuchnia" } },
  devices: { dev1: { name: "Tuya thing", name_by_user: "Desk lamp" } },
};

describe("stepName", () => {
  it("uses alias verbatim when present", () => {
    expect(stepName({ alias: " Any light on ", if: [], then: [] }, hass)).toBe("Any light on");
  });
  it("names scenes and scripts by friendly name", () => {
    expect(stepName({ action: "scene.turn_on", target: { entity_id: "scene.lekkie" } }, hass)).toBe(
      "Lekkie światło nad biurkiem"
    );
    expect(stepName({ scene: "scene.lekkie" }, hass)).toBe("Lekkie światło nad biurkiem");
    expect(
      stepName({ action: "script.turn_on", target: { entity_id: "script.lights_off_soft" } }, hass)
    ).toBe("Lights off (soft)");
    expect(stepName({ action: "script.lights_off_soft" }, hass)).toBe("Lights off (soft)");
  });
  it("verb + target from entity, area, device (user name wins)", () => {
    expect(stepName({ action: "light.toggle", target: { area_id: "kuchnia" } }, hass)).toBe(
      "Toggle Kuchnia"
    );
    expect(stepName({ action: "light.turn_off", target: { entity_id: "light.gx53" } }, hass)).toBe(
      "Turn off GX53 gabinet"
    );
    expect(stepName({ service: "light.turn_on", entity_id: "light.gx53" }, hass)).toBe(
      "Turn on GX53 gabinet"
    );
    expect(stepName({ action: "switch.toggle", target: { device_id: "dev1" } }, hass)).toBe(
      "Toggle Desk lamp"
    );
  });
  it("select option shows the option and the entity", () => {
    expect(
      stepName(
        { action: "select.select_option", target: { entity_id: "select.wled_preset" }, data: { option: "Noc" } },
        hass
      )
    ).toBe("Noc · WLED sypialnia");
  });
  it("control flow and unknown shapes never come out blank", () => {
    expect(stepName({ if: [], then: [] }, hass)).toBe("Conditional");
    expect(stepName({ choose: [] }, hass)).toBe("Choose");
    expect(stepName({ delay: "00:00:05" }, hass)).toBe("Delay");
    expect(stepName({ action: "vacuum.return_to_base" }, hass)).toBe("Dock");
    expect(stepName({ action: "foo.do_the_thing" }, hass)).toBe("Do the thing foo");
    expect(stepName({ action: "persistent_notification.create", data: { message: "x" } }, hass)).toBe(
      "Create persistent notification"
    );
    expect(stepName({ action: "notify.mobile_app_pixel" }, hass)).toBe("Notify mobile app pixel");
    expect(stepName({ action: "light.toggle", target: { entity_id: "light.unknown" } }, {})).toBe(
      "Toggle light.unknown"
    );
  });
  it("multiple targets collapse to first +N", () => {
    expect(
      stepName({ action: "light.toggle", target: { entity_id: ["light.gx53", "light.x", "light.y"] } }, hass)
    ).toBe("Toggle GX53 gabinet +2");
  });
});

describe("inferName", () => {
  it("first step, +N for the rest, empty for nothing", () => {
    expect(inferName([], hass)).toBe("");
    expect(inferName([{ action: "light.toggle", target: { area_id: "kuchnia" } }, { delay: 1 }, { delay: 1 }], hass)).toBe(
      "Toggle Kuchnia +2"
    );
  });
});
