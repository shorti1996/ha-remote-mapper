// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Infer a human name for a slot from its sequence — no model, just a
 * lookup: verb from the service, target from HA's registries (friendly
 * names the user already sees everywhere), `alias:` wins when present
 * (HA's own way of naming action steps). Unknown shapes fall back to the
 * raw action so nothing is ever blank.
 */

export interface HassNames {
  states?: Record<string, { attributes?: Record<string, unknown> }>;
  areas?: Record<string, { name?: string }>;
  devices?: Record<string, { name?: string | null; name_by_user?: string | null }>;
  floors?: Record<string, { name?: string }>;
}

const VERBS: Record<string, string> = {
  turn_on: "Turn on",
  turn_off: "Turn off",
  toggle: "Toggle",
  open_cover: "Open",
  close_cover: "Close",
  stop_cover: "Stop",
  open_cover_tilt: "Tilt open",
  close_cover_tilt: "Tilt close",
  lock: "Lock",
  unlock: "Unlock",
  press: "Press",
  start: "Start",
  pause: "Pause",
  stop: "Stop",
  return_to_base: "Dock",
  media_play: "Play",
  media_pause: "Pause",
  media_play_pause: "Play / pause",
  media_stop: "Stop",
  media_next_track: "Next track",
  media_previous_track: "Previous track",
  volume_up: "Volume up",
  volume_down: "Volume down",
  volume_mute: "Mute",
  increment: "Increment",
  decrement: "Decrement",
  set_value: "Set",
  set_temperature: "Set temperature",
  set_hvac_mode: "Set mode",
  set_preset_mode: "Set preset",
  trigger: "Trigger",
  reload: "Reload",
  notify: "Notify",
  send_message: "Send message",
};

const CONTROL_FLOW: Array<[string, string]> = [
  ["if", "Conditional"],
  ["choose", "Choose"],
  ["repeat", "Repeat"],
  ["parallel", "Parallel"],
  ["sequence", "Sequence"],
  ["wait_template", "Wait"],
  ["wait_for_trigger", "Wait"],
  ["delay", "Delay"],
  ["event", "Fire event"],
  ["variables", "Variables"],
  ["stop", "Stop"],
];

const humanize = (s: string): string =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : typeof v === "string" ? [v] : [];

function friendly(entityId: string, hass?: HassNames): string {
  const name = hass?.states?.[entityId]?.attributes?.friendly_name;
  return typeof name === "string" && name ? name : entityId;
}

function targetLabel(step: Record<string, any>, hass?: HassNames): string {
  const target = (step.target ?? {}) as Record<string, unknown>;
  const names = [
    ...list(target.entity_id ?? step.entity_id ?? step.data?.entity_id).map((e) =>
      friendly(e, hass)
    ),
    ...list(target.area_id).map((a) => hass?.areas?.[a]?.name || a),
    ...list(target.floor_id).map((f) => hass?.floors?.[f]?.name || f),
    ...list(target.device_id).map(
      (d) => hass?.devices?.[d]?.name_by_user || hass?.devices?.[d]?.name || d
    ),
  ];
  if (!names.length) return "";
  return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
}

/** Name for one action step. */
export function stepName(raw: unknown, hass?: HassNames): string {
  if (!raw || typeof raw !== "object") return "";
  const step = raw as Record<string, any>;
  if (typeof step.alias === "string" && step.alias.trim()) return step.alias.trim();
  if (typeof step.scene === "string") return friendly(step.scene, hass);
  for (const [key, label] of CONTROL_FLOW) {
    if (key in step) return label;
  }
  const action = step.action ?? step.service;
  if (typeof action !== "string") return humanize(Object.keys(step)[0] ?? "");
  const [domain, service = ""] = action.split(".");
  const target = targetLabel(step, hass);

  if (domain === "scene" && service === "turn_on") return target || "Scene";
  if (domain === "script") {
    if (service === "turn_on") return target || "Script";
    return friendly(action, hass); // script.my_script called directly
  }
  if (service === "select_option") {
    const option = step.data?.option ?? step.option;
    if (typeof option === "string" && option) return target ? `${option} · ${target}` : option;
    return target ? `Select · ${target}` : "Select option";
  }
  const verb = VERBS[service] ?? humanize(service);
  return target ? `${verb} ${target}` : verb;
}

/** Name for a whole sequence: first step, "+N" for the rest. */
export function inferName(sequence: unknown[], hass?: HassNames): string {
  if (!sequence.length) return "";
  const first = stepName(sequence[0], hass);
  return sequence.length > 1 ? `${first} +${sequence.length - 1}` : first;
}
