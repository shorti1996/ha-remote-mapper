// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Remote Mapper Card.
 *
 * Canvas layout (engine vendored from widget-canvas-ha, see canvas/):
 * slot tiles are dragged once into an arrangement mirroring the physical
 * device; layout persists server-side via remote_mapper/save_layout.
 * Slot editor tiers: quick chips (ha-form + selectors), YAML
 * (ha-yaml-editor, textarea fallback) — the materialize toggle is the
 * blessed path to HA's full action editor.
 *
 * Gesture namespace note: an on-screen tap is a DASHBOARD gesture that
 * runs the bound sequence — it is not the physical remote event.
 */
import { css, html, LitElement, nothing, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "./card-editor";
import "./grid-picker";
import "./remote-grid";
import { clearGridDraft, getGridDraft, setGridDraft } from "./grid-drafts";
import { advanceTip, nextTip, skipTips, TIPS } from "./onboarding";
import {
  absorbsOnSave,
  disableConfirm,
  linkedSaveBlocker,
  type WholeAutomation,
  wholeAbsorbConfirm,
} from "./slot-save";
import { bundleStatus, CARD_VERSION } from "./version";

/** The reload dialog is offered once per page load, whichever card notices first. */
let reloadPrompted = false;

/**
 * Full reload that also empties the service-worker Cache Storage, which
 * is where HA keeps the module after a plain reload would still serve it.
 */
async function reloadWithClearedCache(): Promise<void> {
  try {
    const keys = await window.caches?.keys();
    await Promise.all((keys ?? []).map((k) => window.caches.delete(k)));
  } catch {
    /* no Cache Storage (private window, http) — a reload is still right */
  }
  window.location.reload();
}
import { EditController, type EditHost } from "./canvas/edit-controller";
import { ensureHaForm, ensureYamlEditor, loadHelpers } from "./canvas/ha-loader";
import { computeTransform, type CanvasTransform } from "./canvas/scaling";
import type { CanvasLayout, WidgetConfig } from "./canvas/types";
import { deepClone } from "./canvas/util";
import { tipAnchor, type TipAnchor } from "./gestures";
import {
  assistedTriggerOf,
  chipsLayoutOf,
  displayOf,
  layoutOf,
  styleVarsOf,
  type RemoteMapperCardConfig,
} from "./config";
import {
  buttonLabel,
  KIND_ICON,
  KIND_TITLE,
  normalizeGrid,
  resizeGrid,
  setButtonLabel,
  trimLabels,
  type ButtonModel,
  type GridLayout,
} from "./model";
import { errorText } from "./errors";
import { inferName } from "./naming";
import type { SlotView } from "./remote-grid";

const CARD_TAG = "remote-mapper-card";
/** HA's own "start a config flow" route — opens Add integration → Remote Mapper. */
const ADD_REMOTE_PATH = "/_my_redirect/config_flow_start?domain=remote_mapper";
const UPDATED_EVENT = "remote_mapper_updated";
const ACTION_EVENT = "remote_mapper_action";

const LAYOUT_SCHEMA_VERSION = 1;
const TILE_W = 100;
const TILE_H = 60;
const TILE_GAP = 20;
const DESIGN_WIDTH = 380;

interface HassConnection {
  subscribeEvents<T>(
    callback: (event: T) => void,
    eventType: string
  ): Promise<() => void>;
}

interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: HassConnection;
  /** False while HA's websocket is down (restart); flips back on reconnect. */
  connected?: boolean;
  states?: Record<string, { state?: string; attributes?: Record<string, unknown> }>;
  areas?: Record<string, { name?: string }>;
  devices?: Record<string, { name?: string | null; name_by_user?: string | null }>;
  floors?: Record<string, { name?: string }>;
}

interface ImportedSource {
  entity_id: string | null;
  config_id: string | null;
}

interface SlotRecord {
  sequence: unknown[];
  name?: string | null;
  /** Set by the import assistant; originals are disabled, not deleted. */
  imported_from?: ImportedSource & { sources?: ImportedSource[] };
  scene_id: string | null;
  materialized: boolean;
  automation_id: string | null;
  /** false = linked to a native automation we did not create. */
  owned?: boolean;
  /** true = one branch of the remote's shared automation (plan 06). */
  shared_automation?: boolean;
  /** Set by get_remote for materialized/linked slots. */
  automation_entity_id?: string | null;
  /** What actually runs: the automation's actions, or this event's branch. */
  live_actions?: unknown[];
  /** Shared/imported "Shape A" automation has no branch for this event. */
  branch_missing?: boolean;
  /** live_actions are this event's branch of a per-remote automation. */
  branch?: boolean;
  /** That branch's own name (HA's "Rename" on a choose option). */
  branch_alias?: string | null;
  archived: boolean;
  last_run: string | null;
  last_error: string | null;
}

interface RemoteData {
  entry_id: string;
  title: string;
  layout: { actions?: string[] };
  buttons?: ButtonModel[];
  card_layout: CanvasLayout | null;
  grid_layout?: GridLayout | null;
  slots: Record<string, SlotRecord>;
  stale_actions?: string[];
  /** The remote's shared automation, once created. */
  remote_automation?: { config_id: string; entity_id: string | null; edit_url: string } | null;
  /** Default entity set for snapshots (remote options). */
  snapshot_entities?: string[];
  /** Integration version; newer than CARD_VERSION = this tab runs a stale bundle. */
  version?: string;
}

interface RemoteListItem {
  entry_id: string;
  title: string;
}

interface ImportProposal {
  action_id: string;
  sequence: unknown[];
  source_entity_id: string;
  source_config_id: string | null;
  alias: string;
  disable_source: boolean;
  mixed: boolean;
  conflict: boolean;
  /** Several automations shared this trigger — sequences concatenated. */
  merged?: boolean;
  sources?: Array<{ entity_id: string; alias: string }>;
  /** link = keep native (default); absorb = copy in, disable original. */
  linkable?: boolean;
  mode?: "link" | "absorb";
}

interface ImportScan {
  proposals: ImportProposal[];
  skipped: Array<{ entity_id: string; alias: string; reason: string }>;
}

interface LiveAutomation {
  config_id: string;
  entity_id: string | null;
  alias: string | null;
  actions: unknown[];
  edit_url: string;
  owned?: boolean;
  /** actions are this event's branch of a single-choose automation */
  branch?: boolean;
  branch_missing?: boolean;
  state?: string | null;
  /** Linked per-remote automation: goes off as a whole (get_slot only). */
  whole?: WholeAutomation;
}

type QuickMode =
  | "scene"
  | "toggle"
  | "script"
  | "wled_preset"
  | "link"
  | "custom"
  // "Create new" group (plan 06): nothing to bind yet, Save creates it
  | "new_scene"
  | "new_automation"
  | "new_remote_automation";

const CREATE_MODES: ReadonlySet<QuickMode> = new Set([
  "new_scene",
  "new_automation",
  "new_remote_automation",
]);

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

/** Auto-grid fallback layout from the probed action list (design §10). */
function defaultLayout(actions: string[]): CanvasLayout {
  const n = Math.max(1, actions.length);
  const cols = Math.max(2, Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const width = Math.max(DESIGN_WIDTH, cols * (TILE_W + TILE_GAP) + TILE_GAP);
  const height = rows * (TILE_H + TILE_GAP) + TILE_GAP;
  return {
    schema_version: LAYOUT_SCHEMA_VERSION,
    design_size: { width, height },
    grid: { cell: 10, snap_position: false },
    widgets: actions.map((id, i) => ({
      id,
      kind: "slot",
      x: TILE_GAP + (i % cols) * (TILE_W + TILE_GAP),
      y: TILE_GAP + Math.floor(i / cols) * (TILE_H + TILE_GAP),
      w: TILE_W,
      h: TILE_H,
      z: i + 1,
    })),
  };
}

/** Recognize the quick-chip shapes inside an existing sequence. */
function inferQuick(sequence: unknown[]): {
  mode: QuickMode;
  entity: string;
  option: string;
} {
  if (sequence.length === 1 && typeof sequence[0] === "object" && sequence[0]) {
    const step = sequence[0] as Record<string, any>;
    const action = step.action ?? step.service;
    const entity = step.target?.entity_id ?? step.entity_id;
    if (typeof entity === "string") {
      if (action === "scene.turn_on") return { mode: "scene", entity, option: "" };
      if (action === "homeassistant.toggle")
        return { mode: "toggle", entity, option: "" };
      if (action === "script.turn_on")
        return { mode: "script", entity, option: "" };
      if (action === "select.select_option") {
        const option = step.data?.option ?? step.option;
        return { mode: "wled_preset", entity, option: option ?? "" };
      }
    }
  }
  return { mode: "custom", entity: "", option: "" };
}

function quickSequence(mode: QuickMode, entity: string, option: string): unknown[] {
  const call = (action: string) => [
    { action, target: { entity_id: entity } },
  ];
  if (mode === "scene") return call("scene.turn_on");
  if (mode === "toggle") return call("homeassistant.toggle");
  if (mode === "wled_preset")
    return [
      {
        action: "select.select_option",
        target: { entity_id: entity },
        data: { option },
      },
    ];
  return call("script.turn_on");
}

@customElement(CARD_TAG)
export class RemoteMapperCard extends LitElement implements EditHost {
  @state() private _remote?: RemoteData;
  @state() private _remoteChoices?: RemoteListItem[];
  @state() private _error?: string;
  @state() private _flash?: string;
  @state() private _hostWidth = 0;

  // grid layout (plan 04): draft-then-commit, like the canvas session
  /** Set by HA inside the card-config dialog: the card is a preview there. */
  @property({ type: Boolean }) public preview = false;
  /** Bumped when an onboarding tip is dismissed so the banner re-renders. */
  @state() private _tipsRev = 0;
  @state() private _gridEditing = false;
  @state() private _gridDraft?: GridLayout;
  @state() private _pickerOpen = false;
  @state() private _buttonSheet?: string;

  // long-press tooltip for header icons on touch (PC gets the native title).
  // Anchored under the pressed button like a native tooltip, fixed so no
  // dock/sheet/modal can cover it.
  @state() private _tip?: TipAnchor;
  private _tipTimer?: ReturnType<typeof setTimeout>;
  private _tipShown = false;
  // A long press on touch ends in contextmenu/pointercancel, not click, so
  // the bubble can't wait for a click to go away: it hides on a timer.
  private _tipHideTimer?: ReturnType<typeof setTimeout>;

  // Modals opened from pointerup get a synthetic click ~immediately after
  // (touch); the backdrop must not treat that ghost click as "close".
  private _modalOpenedAt = 0;
  /** Capture-phase: swallow the ghost click anywhere inside a just-opened modal. */
  private _ghostGuard = {
    handleEvent: (e: Event) => {
      if (Date.now() - this._modalOpenedAt < 350) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    capture: true,
  };
  private _backdropClick(close: () => void): (e: Event) => void {
    return (e: Event) => {
      if (e.target !== e.currentTarget) return;
      if (Date.now() - this._modalOpenedAt < 350) return;
      close();
    };
  }

  // slot editor modal
  @state() private _editingAction?: string;
  @state() private _editorTab: "quick" | "yaml" = "quick";
  @state() private _quickMode: QuickMode = "scene";
  @state() private _quickEntity = "";
  @state() private _quickOption = "";
  // "new scene" mode: entities to capture + save them as the remote default
  @state() private _snapEntities: string[] = [];
  @state() private _snapRemember = false;
  @state() private _draft = "";
  @state() private _draftName = "";
  @state() private _yamlValue?: unknown[];
  @state() private _yamlValid = true;
  @state() private _draftError?: string;
  @state() private _draftMaterialized = false;
  @state() private _editingLive?: LiveAutomation;
  @state() private _haFormOk = false;
  @state() private _yamlEditorOk = false;

  // clear-policy dialog
  @state() private _clearArtifacts?: Record<string, unknown>;
  @state() private _clearRemember = false;

  // hand back to HA (release)
  @state() private _releaseOpen = false;
  @state() private _releaseConvert = true;
  @state() private _releaseBusy = false;

  // import wizard
  @state() private _importScan?: ImportScan;
  @state() private _importSelected: Set<number> = new Set();
  @state() private _importOverwrite = false;
  @state() private _importBusy = false;
  @state() private _importError?: string;

  private _hass?: HomeAssistant;
  private _config?: RemoteMapperCardConfig;
  private _entryId?: string;
  private _unsubEvents?: () => void;
  private _unsubActions?: () => void;
  private _flashTimer?: ReturnType<typeof setTimeout>;
  private _fetchStarted = false;
  private _edit = new EditController(this);
  private _resizeObserver?: ResizeObserver;

  // ── HA plumbing ────────────────────────────────────────────────────

  public set hass(hass: HomeAssistant) {
    // Back from an HA restart: the backend may be newer (version banner)
    // and the store may have moved on — refresh instead of trusting the
    // pre-restart fetch.
    const reconnected = this._hass?.connected === false && hass.connected === true;
    this._hass = hass;
    if (reconnected && this._fetchStarted && this._remote) void this._fetchRemote();
    // the button sheet shows live automation state — keep it current
    if (this._buttonSheet !== undefined) this.requestUpdate();
    if (!this._fetchStarted && this._config) {
      this._fetchStarted = true;
      void this._initialize();
    }
  }

  public setConfig(config: RemoteMapperCardConfig): void {
    // Only a different remote invalidates an in-progress grid edit
    if (this._config && config.entry_id !== this._config.entry_id) {
      this._cancelGridEdit();
    }
    this._config = config;
    this._entryId = config.entry_id;
    this._fetchStarted = false;
    if (this._hass) {
      this._fetchStarted = true;
      void this._initialize();
    }
  }

  public getCardSize(): number {
    if (this._isGrid()) {
      const grid = this._gridLayout();
      const perRow = displayOf(this._config) === "all" ? 2 : 1;
      return grid ? 1 + grid.rows * perRow : 3;
    }
    const layout = this._currentLayout();
    return layout ? 1 + Math.ceil(layout.design_size.height / 100) : 3;
  }

  public getGridOptions(): Record<string, unknown> {
    return { columns: 12, min_columns: 6 };
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement("remote-mapper-card-editor");
  }

  public static getStubConfig(): Record<string, unknown> {
    return { layout: "grid", display: "assisted" };
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width && Math.abs(width - this._hostWidth) > 0.5) {
        this._hostWidth = width;
      }
    });
    this._resizeObserver.observe(this);
    if (this._edit.tryResume()) this.requestUpdate();
    if (this._fetchStarted && !this._unsubEvents) void this._subscribe();
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._unsubEvents?.();
    this._unsubEvents = undefined;
    this._unsubActions?.();
    this._unsubActions = undefined;
    this._edit.detach();
    clearTimeout(this._tipTimer);
    clearTimeout(this._tipHideTimer);
    this._tip = undefined;
  }

  private async _initialize(): Promise<void> {
    try {
      if (!this._entryId) {
        const res = await this._hass!.callWS<{ remotes: RemoteListItem[] }>({
          type: "remote_mapper/list_remotes",
        });
        if (res.remotes.length === 1) {
          this._entryId = res.remotes[0].entry_id;
        } else {
          this._remoteChoices = res.remotes;
          return;
        }
      }
      await this._fetchRemote();
      this._resumeGridEdit();
      await this._subscribe();
    } catch (err) {
      this._error = errorText(err);
    }
  }

  private async _subscribe(): Promise<void> {
    if (this._unsubEvents) return;
    this._unsubEvents = await this._hass!.connection.subscribeEvents<{
      data: { entry_id: string };
    }>((event) => {
      if (event.data.entry_id === this._entryId) void this._fetchRemote();
    }, UPDATED_EVENT);
    // physical presses light up the same way dashboard taps do
    this._unsubActions = await this._hass!.connection.subscribeEvents<{
      data: { entry_id: string; action_id: string };
    }>((event) => {
      if (event.data.entry_id === this._entryId) this._flashAction(event.data.action_id);
    }, ACTION_EVENT);
  }

  private _flashAction(actionId: string): void {
    this._flash = actionId;
    if (this._flashTimer !== undefined) clearTimeout(this._flashTimer);
    this._flashTimer = setTimeout(() => {
      this._flashTimer = undefined;
      this._flash = undefined;
    }, 400);
  }

  private async _fetchRemote(): Promise<void> {
    try {
      this._remote = await this._hass!.callWS<RemoteData>({
        type: "remote_mapper/get_remote",
        entry_id: this._entryId,
      });
      this._error = undefined;
    } catch (err) {
      this._error = errorText(err);
    }
  }

  // ── EditHost ───────────────────────────────────────────────────────

  public config(): CanvasLayout | undefined {
    return this._currentLayout();
  }

  public scale(): number {
    return this._transform()?.scale ?? 1;
  }

  public slotEl(id: string): HTMLElement | null {
    return this.shadowRoot?.querySelector(`[data-slot-id="${CSS.escape(id)}"]`) ?? null;
  }

  public badgeEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector(".badge") ?? null;
  }

  public async saveWorking(widgets: WidgetConfig[]): Promise<boolean> {
    const layout = this._currentLayout();
    if (!layout) return false;
    try {
      await this._hass!.callWS({
        type: "remote_mapper/save_layout",
        entry_id: this._entryId,
        card_layout: { ...deepClone(layout), widgets },
      });
      return true;
    } catch (err) {
      this.notify(`Layout save failed: ${String(err)}`);
      return false;
    }
  }

  public openSettings(id: string): void {
    void this._openEditor(id);
  }

  /** In-app navigation (what HA's own navigate() does — no page reload). */
  private _navigate(path: string): void {
    window.history.pushState(null, "", path);
    window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
  }

  private _automationEditPath(slot: SlotRecord | undefined): string | undefined {
    return slot?.materialized && slot.automation_id
      ? `/config/automation/edit/${slot.automation_id}`
      : undefined;
  }

  /**
   * Editor for the sequence's target when it's a scene or script — HA
   * keeps both editable at /config/{scene,script}/edit/{id}. Scenes are
   * addressed by their config id (state attribute), scripts by object id.
   */
  private _targetEditor(
    slot: SlotRecord | undefined
  ): { icon: string; title: string; path: string } | undefined {
    // a materialized/shared slot's sequence is empty — read what runs
    const steps = slot?.sequence?.length ? slot.sequence : (slot?.live_actions ?? []);
    const first = steps[0] as Record<string, any> | undefined;
    if (!first) return undefined;
    const action = first.action ?? first.service;
    let entity = first.target?.entity_id ?? first.entity_id ?? first.scene;
    if (Array.isArray(entity)) entity = entity[0];
    if (typeof entity !== "string") return undefined;
    const name = this._hass?.states?.[entity]?.attributes?.friendly_name ?? entity;
    if (entity.startsWith("scene.") && (action === "scene.turn_on" || first.scene)) {
      const id = this._hass?.states?.[entity]?.attributes?.id;
      if (typeof id !== "string") return undefined; // yaml scene without id
      return { icon: "mdi:palette", title: `Edit scene: ${name}`, path: `/config/scene/edit/${id}` };
    }
    if (entity.startsWith("script.") && (action === "script.turn_on" || action === entity)) {
      return {
        icon: "mdi:script-text",
        title: `Edit script: ${name}`,
        path: `/config/script/edit/${entity.slice("script.".length)}`,
      };
    }
    if (typeof action === "string" && action.startsWith("script.") && action !== "script.turn_on") {
      const objectId = action.slice("script.".length);
      const scriptName = this._hass?.states?.[action]?.attributes?.friendly_name ?? objectId;
      return {
        icon: "mdi:script-text",
        title: `Edit script: ${scriptName}`,
        path: `/config/script/edit/${objectId}`,
      };
    }
    return undefined;
  }

  /** Originals an imported slot came from (still in HA, disabled). */
  private _importedSources(slot: SlotRecord | undefined): ImportedSource[] {
    const from = slot?.imported_from;
    if (!from) return [];
    const list = from.sources?.length ? from.sources : [from];
    return list.filter((s) => !!s.config_id);
  }

  /** HA's own confirm dialog, falling back to window.confirm. */
  private async _confirm(opts: {
    title: string;
    text: string;
    confirmText: string;
    destructive?: boolean;
  }): Promise<boolean> {
    try {
      const helpers = await loadHelpers();
      if (helpers?.showConfirmationDialog) {
        return !!(await helpers.showConfirmationDialog(this, {
          title: opts.title,
          text: opts.text,
          confirmText: opts.confirmText,
          dismissText: "Cancel",
          destructive: opts.destructive,
        }));
      }
    } catch {
      /* fall through */
    }
    return window.confirm(`${opts.title}\n\n${opts.text}`);
  }

  public notify(message: string): void {
    // native HA toast (DDC layout-persistence pattern)
    window.dispatchEvent(
      new CustomEvent("hass-notification", { detail: { message } })
    );
  }

  // ── layout helpers ─────────────────────────────────────────────────

  private _currentLayout(): CanvasLayout | undefined {
    if (!this._remote) return undefined;
    const actions = this._remote.layout?.actions ?? [];
    const stored = this._remote.card_layout;
    const base =
      stored && Array.isArray(stored.widgets) && stored.design_size
        ? stored
        : defaultLayout(actions);
    // tiles for actions probed after the layout was saved
    const have = new Set(base.widgets.map((w) => w.id));
    const missing = actions.filter((a) => !have.has(a));
    if (!missing.length) return { ...base, canvas_id: this._entryId };
    const extra = defaultLayout(missing).widgets.map((w, i) => ({
      ...w,
      y: base.design_size.height + TILE_GAP + Math.floor(i / 3) * (TILE_H + TILE_GAP),
    }));
    return {
      ...base,
      canvas_id: this._entryId,
      design_size: {
        width: base.design_size.width,
        height:
          base.design_size.height +
          (Math.floor((extra.length - 1) / 3) + 1) * (TILE_H + TILE_GAP) +
          TILE_GAP,
      },
      widgets: [...base.widgets, ...extra],
    };
  }

  private _transform(): CanvasTransform | undefined {
    const layout = this._currentLayout();
    if (!layout) return undefined;
    const width = this._hostWidth || this.getBoundingClientRect().width || 300;
    return computeTransform(layout.design_size, width, null);
  }

  private _renderTitle(): TemplateResult {
    if (this._config?.show_title === false) return html`<span class="title"></span>`;
    return html`<span class="title">${this._config?.title || this._remote?.title}</span>`;
  }

  // ── grid layout (plan 04) ──────────────────────────────────────────

  private _isGrid(): boolean {
    return layoutOf(this._config) === "grid";
  }

  /** Draft while editing, else the stored layout normalized to the buttons. */
  private _gridLayout(): GridLayout | undefined {
    if (!this._remote) return undefined;
    if (this._gridEditing && this._gridDraft) return this._gridDraft;
    return normalizeGrid(this._remote.grid_layout, this._remote.buttons ?? []);
  }

  private _slotViews(): Record<string, SlotView> {
    const out: Record<string, SlotView> = {};
    if (!this._remote) return out;
    const stale = new Set(this._remote.stale_actions ?? []);
    for (const button of this._remote.buttons ?? []) {
      for (const a of button.actions) {
        const slot = this._remote.slots[a.action_id];
        out[a.action_id] = {
          assigned: !!slot,
          archived: !!slot?.archived || this._automationState(slot) === "off",
          summary: this._slotSummary(slot),
          error: slot?.branch_missing
            ? "The automation has no branch for this event any more — edit the slot to re-add it"
            : (slot?.last_error ?? null),
          stale: stale.has(a.action_id),
        };
      }
    }
    return out;
  }

  private _enterGridEdit = (): void => {
    if (!this._remote) return;
    this._setGridDraft(
      normalizeGrid(this._remote.grid_layout, this._remote.buttons ?? [])
    );
    this._gridEditing = true;
    // Z2M discovers actions lazily — pick up anything pressed since setup
    void this._refreshActions(true);
  };

  /** Re-probe the source; quiet=true only toasts when something changed. */
  private async _refreshActions(quiet = false): Promise<void> {
    try {
      const res = await this._hass!.callWS<{
        added: string[];
        stale: string[];
        probed: boolean;
      }>({ type: "remote_mapper/refresh_actions", entry_id: this._entryId });
      if (res.added.length) {
        this.notify(`Found new actions: ${res.added.join(", ")}`);
        if (this._gridEditing && this._remote) {
          // fold them into the draft so they show up in this edit session
          await this._fetchRemote();
          this._setGridDraft(normalizeGrid(this._gridDraft, this._remote.buttons ?? []));
        }
      } else if (!quiet) {
        this.notify(
          res.probed
            ? "No new actions — press each button once (all press types), then refresh again"
            : "This source can't enumerate actions"
        );
      }
    } catch (err) {
      this.notify(`Refresh failed: ${String(err)}`);
    }
  }

  private _cancelGridEdit = (): void => {
    this._gridEditing = false;
    this._gridDraft = undefined;
    clearGridDraft(this._entryId);
    this._pickerOpen = false;
    this._buttonSheet = undefined;
  };

  /** Every draft change lands in the registry so a rebuilt card can resume. */
  private _setGridDraft(draft: GridLayout): void {
    this._gridDraft = draft;
    setGridDraft(this._entryId, draft);
  }

  /** Pick up a draft an earlier instance of this card left unticked. */
  private _resumeGridEdit(): void {
    const draft = getGridDraft(this._entryId);
    if (!draft || !this._remote || this._gridEditing) return;
    this._gridDraft = normalizeGrid(draft, this._remote.buttons ?? []);
    this._gridEditing = true;
  }

  /** X in grid edit mode: ask only when the layout draft differs from what is saved. */
  private async _discardGridEdit(): Promise<void> {
    const saved = this._remote
      ? normalizeGrid(this._remote.grid_layout, this._remote.buttons ?? [])
      : undefined;
    const dirty =
      !!this._gridDraft && JSON.stringify(this._gridDraft) !== JSON.stringify(saved);
    if (dirty && !(await this._confirmDiscardLayout())) return;
    this._cancelGridEdit();
  }

  private async _discardCanvasEdit(): Promise<void> {
    if (this._edit.dirty && !(await this._confirmDiscardLayout())) return;
    this._edit.cancel(true);
  }

  private _confirmDiscardLayout(): Promise<boolean> {
    return this._confirm({
      title: "Discard layout changes?",
      text:
        "Button names, positions and grid size go back to the last saved layout. " +
        "Event edits made in this session are already saved and stay.",
      confirmText: "Discard",
      destructive: true,
    });
  }

  private async _saveGridEdit(): Promise<void> {
    const draft = this._gridDraft;
    if (!draft) {
      this._cancelGridEdit();
      return;
    }
    try {
      await this._hass!.callWS({
        type: "remote_mapper/save_layout",
        entry_id: this._entryId,
        grid_layout: trimLabels(draft),
      });
      this._cancelGridEdit();
    } catch (err) {
      this.notify(`Layout save failed: ${String(err)}`);
    }
  }

  private _onGridPicked = (e: CustomEvent<{ rows: number; cols: number }>): void => {
    const draft = this._gridDraft;
    if (!draft || !this._remote) return;
    this._setGridDraft(
      resizeGrid(draft, e.detail.rows, e.detail.cols, this._remote.buttons ?? [])
    );
    this._pickerOpen = false;
  };

  // ── slot interactions ──────────────────────────────────────────────

  private async _runSlot(actionId: string): Promise<void> {
    const slot = this._remote?.slots[actionId];
    if (!slot || slot.archived) return;
    this._flashAction(actionId);
    try {
      await this._hass!.callWS({
        type: "remote_mapper/run_slot",
        entry_id: this._entryId,
        action_id: actionId,
      });
    } catch (err) {
      this._error = errorText(err);
    }
  }

  private _isLinked(slot: SlotRecord | undefined): boolean {
    return !!slot?.materialized && !!slot.automation_id && slot.owned === false;
  }

  /** Live state of a materialized/linked slot's automation ("on"/"off"). */
  private _automationState(slot: SlotRecord | undefined): string | undefined {
    const entity = slot?.automation_entity_id;
    return entity ? this._hass?.states?.[entity]?.state : undefined;
  }

  /**
   * User name if set; a linked automation's own name; else inferred from
   * what runs (naming.ts). Automations the card created carry a
   * "<remote> · <event> [remote_mapper]" alias, which says less than the
   * actions do.
   */
  private _slotSummary(slot: SlotRecord | undefined): string {
    if (!slot) return "not set";
    if (slot.name) return slot.name;
    if (slot.materialized && slot.branch_missing) return "no branch";
    if (slot.materialized && slot.shared_automation) {
      return inferName(slot.live_actions ?? [], this._hass) || "empty branch";
    }
    if (slot.materialized) {
      const entity = slot.automation_entity_id;
      const friendly = entity
        ? this._hass?.states?.[entity]?.attributes?.friendly_name
        : undefined;
      const alias = typeof friendly === "string" && friendly ? friendly : "";
      if (slot.branch && slot.branch_alias) return slot.branch_alias;
      // a per-remote automation's alias names every event the same
      if (this._isLinked(slot) && alias && !slot.branch) return alias;
      return inferName(slot.live_actions ?? [], this._hass) || alias || "automation";
    }
    return inferName(slot.sequence ?? [], this._hass) || "empty";
  }

  // ── slot editor modal ──────────────────────────────────────────────

  private async _openEditor(actionId: string): Promise<void> {
    const slot = this._remote?.slots[actionId];
    const sequence = (slot?.sequence ?? []) as unknown[];
    const quick = inferQuick(sequence);
    this._editingAction = actionId;
    this._modalOpenedAt = Date.now();
    this._quickMode = quick.mode === "custom" ? "scene" : quick.mode;
    this._quickEntity = quick.entity;
    if (this._isLinked(slot)) {
      this._quickMode = "link";
      this._quickEntity = slot?.automation_entity_id ?? "";
    }
    this._quickOption = quick.option;
    this._snapEntities = [...(this._remote?.snapshot_entities ?? [])];
    this._snapRemember = false;
    this._editorTab = quick.mode === "custom" && sequence.length ? "yaml" : "quick";
    this._draft = JSON.stringify(sequence, null, 2);
    this._draftName = slot?.name ?? "";
    this._yamlValue = sequence;
    this._yamlValid = true;
    this._draftError = undefined;
    this._draftMaterialized = slot?.materialized ?? false;
    this._editingLive = undefined;

    void ensureHaForm().then((ok) => {
      this._haFormOk = ok;
    });
    void ensureYamlEditor().then((ok) => {
      this._yamlEditorOk = ok;
    });

    if (slot?.materialized) {
      // Automation is canonical — fetch its current actions so a
      // dematerialize save folds the live version back in.
      void this._hass!.callWS<{ slot: SlotRecord; live: LiveAutomation | null }>({
        type: "remote_mapper/get_slot",
        entry_id: this._entryId,
        action_id: actionId,
      }).then((res) => {
        if (this._editingAction === actionId && res.live) {
          this._editingLive = res.live;
          this._yamlValue = res.live.actions ?? [];
          this._draft = JSON.stringify(res.live.actions ?? [], null, 2);
          // Linked slots open on the Quick tab's "Link existing" chip so a
          // plain Save keeps the link; owned/shared ones edit the live YAML.
          if (!this._isLinked(slot)) this._editorTab = "yaml";
        }
      });
    }
  }

  /** Textarea fallback: JSON parse of the draft, null when it isn't JSON. */
  private _parseDraftOrNull(): unknown[] | null {
    try {
      const parsed: unknown = JSON.parse(this._draft);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private _closeEditor(): void {
    this._editingAction = undefined;
    this._draftError = undefined;
    this._editingLive = undefined;
    this._clearArtifacts = undefined;
  }

  /** "Create new" modes: make the thing, bind it, and (automations) go edit it. */
  private async _createNew(): Promise<void> {
    const name = this._draftName.trim() || null;
    try {
      if (this._quickMode === "new_scene") {
        if (!this._snapEntities.length) {
          this._draftError = "Pick at least one entity to capture";
          return;
        }
        await this._hass!.callWS({
          type: "remote_mapper/create_snapshot",
          entry_id: this._entryId,
          action_id: this._editingAction,
          entities: this._snapEntities,
          remember_entities: this._snapRemember,
          ...(name ? { name } : {}),
        });
        this._closeEditor();
        return;
      }
      const res = await this._hass!.callWS<{ edit_url: string }>({
        type: "remote_mapper/create_automation",
        entry_id: this._entryId,
        action_id: this._editingAction,
        scope: this._quickMode === "new_automation" ? "button" : "remote",
        name,
      });
      this._closeEditor();
      // the body is theirs to write — hand them HA's editor right away
      this._navigate(res.edit_url);
    } catch (err) {
      this._draftError = (err as { message?: string }).message ?? String(err);
    }
  }

  private async _saveDraft(): Promise<void> {
    if (this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)) {
      await this._createNew();
      return;
    }
    const msg: Record<string, unknown> = {
      type: "remote_mapper/save_slot",
      entry_id: this._entryId,
      action_id: this._editingAction,
      materialized: this._draftMaterialized,
      name: this._draftName.trim() || null,
    };
    const linkedNow = this._isLinked(this._remote?.slots[this._editingAction ?? ""]);
    if (
      this._editorTab === "quick" &&
      this._quickMode === "link" &&
      absorbsOnSave({ linked: linkedNow, keepLinked: this._draftMaterialized })
    ) {
      // Untick "Keep linked": materialized:false alone tells the backend to
      // absorb the automation's live actions and disable the original.
    } else if (this._editorTab === "quick" && this._quickMode === "link") {
      if (!this._quickEntity) {
        this._draftError = "Pick an automation first";
        return;
      }
      // Link: no sequence, no materialize toggle — the automation is canonical
      delete msg.materialized;
      msg.link_entity_id = this._quickEntity;
    } else if (
      this._isLinked(this._remote?.slots[this._editingAction ?? ""]) &&
      this._draftMaterialized
    ) {
      // Linked + "keep linked" ticked: only a name change may go through
      const blocked = linkedSaveBlocker({
        linked: true,
        keepLinked: true,
        tab: this._editorTab,
        quickMode: this._quickMode,
        draft: this._yamlEditorOk ? (this._yamlValue ?? []) : this._parseDraftOrNull(),
        live: this._editingLive?.actions ?? [],
      });
      if (blocked) {
        this._draftError = blocked;
        return;
      }
    } else if (this._editorTab === "quick") {
      if (!this._quickEntity) {
        this._draftError = "Pick an entity first";
        return;
      }
      if (this._quickMode === "wled_preset" && !this._quickOption) {
        this._draftError = "Pick a preset first";
        return;
      }
      msg.sequence = quickSequence(
        this._quickMode,
        this._quickEntity,
        this._quickOption,
      );
    } else if (this._yamlEditorOk) {
      if (!this._yamlValid) {
        this._draftError = "YAML is not valid";
        return;
      }
      msg.sequence = this._yamlValue ?? [];
    } else {
      msg.sequence_yaml = this._draft;
    }
    if (msg.materialized && Array.isArray(msg.sequence)) {
      // names the created automation when the Name field is empty
      msg.auto_name = inferName(msg.sequence, this._hass) || null;
    }
    const live = this._editingLive;
    if (linkedNow && !this._draftMaterialized && live?.whole) {
      // one branch can't be switched off alone: every event it runs moves
      const dialog = wholeAbsorbConfirm(
        live.alias ?? live.entity_id ?? "This automation",
        live.whole.events.map((a) => this._eventName(a))
      );
      if (dialog && !(await this._confirm(dialog))) return;
    }
    try {
      const res = await this._hass!.callWS<{ absorbed?: string[] }>(msg);
      if ((res?.absorbed?.length ?? 0) > 1) {
        this.notify(
          `Moved ${res.absorbed!.length} events into the card; "${live?.alias}" is turned off.`
        );
      }
      this._closeEditor();
    } catch (err) {
      this._draftError = (err as { message?: string }).message ?? String(err);
    }
  }

  /** Clear button: explain the blast radius before the first server call. */
  private async _confirmClear(): Promise<void> {
    const slot = this._remote?.slots[this._editingAction ?? ""];
    const name = this._draftName.trim() || this._editingAction || "this event";
    const linked = this._isLinked(slot);
    const imported = this._importedSources(slot).length > 0;
    const text = linked
      ? `The link from "${name}" to its automation is removed. The automation itself ` +
        "stays in HA, enabled, and keeps firing on its own trigger."
      : imported
        ? `"${name}" is emptied in this card. The original automation it was imported ` +
          "from stays in HA, still disabled. Importing it again as a link switches it " +
          "back on, and so does Hand back."
        : `"${name}" is emptied in this card. Automations and scenes that existed before ` +
          "this integration are not touched; if the card created any, you are asked next.";
    const ok = await this._confirm({
      title: "Clear this event?",
      text,
      confirmText: "Clear",
      destructive: true,
    });
    if (ok) await this._clearSlot();
  }

  private async _confirmArchive(): Promise<void> {
    const slot = this._remote?.slots[this._editingAction!];
    if (!slot) return;
    if (slot.archived) {
      await this._toggleArchived();
      return;
    }
    const name = this._draftName.trim() || this._editingAction || "this event";
    const live = this._editingLive;
    const linked = this._isLinked(slot) ? (live?.whole?.linked ?? []) : [];
    const ok = await this._confirm(
      disableConfirm(name, {
        automation: slot.materialized,
        alias: live?.alias ?? undefined,
        linked: linked.map((a) => this._eventName(a)),
      })
    );
    if (ok) await this._toggleArchived();
  }

  /** "<button label> <event>" for an action id, as the pads show it. */
  private _eventName(actionId: string): string {
    const layout = this._gridLayout();
    for (const button of this._remote?.buttons ?? []) {
      const action = button.actions.find((a) => a.action_id === actionId);
      if (action && layout) return `${buttonLabel(button, layout)} ${action.event}`;
    }
    return actionId;
  }

  private async _clearSlot(decision?: string): Promise<void> {
    const res = await this._hass!.callWS<{
      needs_decision?: boolean;
      artifacts?: Record<string, unknown>;
    }>({
      type: "remote_mapper/clear_slot",
      entry_id: this._entryId,
      action_id: this._editingAction,
      ...(decision ? { decision, remember: this._clearRemember } : {}),
    });
    if (res.needs_decision) {
      this._clearRemember = false;
      this._clearArtifacts = res.artifacts;
      return;
    }
    this._clearArtifacts = undefined;
    this._closeEditor();
  }

  private async _snapshot(reSnapshot: boolean): Promise<void> {
    try {
      await this._hass!.callWS({
        type: "remote_mapper/create_snapshot",
        entry_id: this._entryId,
        action_id: this._editingAction,
        re_snapshot: reSnapshot,
      });
      this._closeEditor();
    } catch (err) {
      this._draftError = (err as { message?: string }).message ?? String(err);
    }
  }

  private async _toggleArchived(): Promise<void> {
    const slot = this._remote?.slots[this._editingAction!];
    if (!slot) return;
    try {
      await this._hass!.callWS({
        type: "remote_mapper/archive_slot",
        entry_id: this._entryId,
        action_id: this._editingAction,
        archived: !slot.archived,
      });
      this._closeEditor();
    } catch (err) {
      this._draftError = (err as { message?: string }).message ?? String(err);
    }
  }

  // ── hand back to HA ────────────────────────────────────────────────

  /** What the release will do, counted from the current slots. */
  private _releasePlan(): {
    imported: number;
    linked: number;
    materialized: number;
    built: number;
  } {
    let imported = 0;
    let linked = 0;
    let materialized = 0;
    let built = 0;
    for (const slot of Object.values(this._remote?.slots ?? {})) {
      if (slot.imported_from) imported++;
      else if (this._isLinked(slot)) linked++;
      else if (slot.materialized) materialized++;
      else if (slot.sequence?.length && !slot.archived) built++;
    }
    return { imported, linked, materialized, built };
  }

  private async _release(): Promise<void> {
    this._releaseBusy = true;
    try {
      const res = await this._hass!.callWS<{
        reenabled: string[];
        converted: string[];
        kept: string[];
        dropped: string[];
      }>({
        type: "remote_mapper/release_remote",
        entry_id: this._entryId,
        convert_remaining: this._releaseConvert,
      });
      this._releaseOpen = false;
      this._cancelGridEdit();
      this._edit.cancel();
      this.notify(
        `Handed back: ${res.reenabled.length} original(s) re-enabled, ` +
          `${res.converted.length} converted, ${res.kept.length} kept, ` +
          `${res.dropped.length} dropped.`
      );
      this._unsubEvents?.();
      this._unsubEvents = undefined;
      this._unsubActions?.();
      this._unsubActions = undefined;
      this._remote = undefined;
      this._error =
        "This remote was handed back to Home Assistant and removed from Remote " +
        "Mapper. Delete this card, or pick another remote in the card editor.";
    } catch (err) {
      this.notify(`Hand back failed: ${(err as { message?: string }).message ?? String(err)}`);
    } finally {
      this._releaseBusy = false;
    }
  }

  private _renderRelease(): TemplateResult {
    const plan = this._releasePlan();
    const close = () => {
      this._releaseOpen = false;
    };
    return html`
      <div class="modal-backdrop" @click=${this._backdropClick(close)}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>Hand "${this._remote?.title}" back to Home Assistant</h3>
          <p class="hint">
            Removes this remote from Remote Mapper and leaves Home Assistant the
            way it would have been without it — nothing is deleted.
          </p>
          <ul class="release-list">
            <li>
              <b>${plan.imported}</b> imported event(s): the original
              automation(s) are <b>re-enabled</b>, the mapping goes away.
            </li>
            <li>
              <b>${plan.linked}</b> linked event(s): the native automation is
              <b>left untouched</b>.
            </li>
            <li>
              <b>${plan.materialized}</b> automation-backed event(s): the
              automation is <b>kept</b>, renamed to a plain alias.
            </li>
            <li>
              <label>
                <input
                  type="checkbox"
                  .checked=${this._releaseConvert}
                  @change=${(e: Event) => {
                    this._releaseConvert = (e.target as HTMLInputElement).checked;
                  }}
                />
                <b>${plan.built}</b> event(s) built in the card: <b>convert</b> to
                plain automations so the buttons keep working (unticked: dropped).
              </label>
            </li>
            <li>Snapshot scenes are kept as ordinary scenes.</li>
            <li>The grid layout and this card's mapping are removed.</li>
          </ul>
          <div class="buttons">
            <button class="danger" ?disabled=${this._releaseBusy} @click=${this._release}>
              Hand back
            </button>
            <button @click=${close}>Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── import wizard ──────────────────────────────────────────────────

  private _openImport = async (): Promise<void> => {
    this._importError = undefined;
    this._importOverwrite = false;
    this._importBusy = false;
    try {
      const scan = await this._hass!.callWS<ImportScan>({
        type: "remote_mapper/scan_import",
        entry_id: this._entryId,
      });
      this._importSelected = new Set(
        scan.proposals.flatMap((p, i) => (p.conflict ? [] : [i]))
      );
      this._importScan = scan;
    } catch (err) {
      this._error = errorText(err);
    }
  };

  private _closeImport(): void {
    this._importScan = undefined;
  }

  private async _applyImport(): Promise<void> {
    const scan = this._importScan!;
    const proposals = scan.proposals.filter((_, i) => this._importSelected.has(i));
    if (!proposals.length) {
      this._closeImport();
      return;
    }
    this._importBusy = true;
    try {
      await this._hass!.callWS({
        type: "remote_mapper/apply_import",
        entry_id: this._entryId,
        proposals,
        overwrite: this._importOverwrite,
      });
      this._closeImport();
    } catch (err) {
      this._importError = (err as { message?: string }).message ?? String(err);
    } finally {
      this._importBusy = false;
    }
  }

  // ── render ─────────────────────────────────────────────────────────

  protected override render() {
    if (this._error) {
      return html`<ha-card header="Remote Mapper">
        <div class="content error">${this._error}</div>
      </ha-card>`;
    }
    if (this._remoteChoices) {
      return html`<ha-card header="Remote Mapper">
        <div class="content">
          ${this._remoteChoices.length === 0
            ? html`<p class="hint">
                  No remote is set up yet. Add one — pick the device (Zigbee2MQTT,
                  ZHA, Matter, MQTT…), press its buttons once — and this card
                  fills in by itself.
                </p>
                <div class="buttons">
                  <button @click=${() => this._navigate(ADD_REMOTE_PATH)}>
                    Add a remote
                  </button>
                </div>`
            : html`<p class="hint">
                  Several remotes exist — pick one in the card editor (the
                  <b>Remote</b> dropdown), or set <code>entry_id</code> in YAML:
                </p>
                <ul>
                  ${this._remoteChoices.map(
                    (r) => html`<li>${r.title}: <code>${r.entry_id}</code></li>`
                  )}
                </ul>`}
        </div>
      </ha-card>`;
    }
    if (!this._remote) {
      return html`<ha-card header="Remote Mapper">
        <div class="content">Loading…</div>
      </ha-card>`;
    }

    if (this._isGrid()) return this._renderGridCard();

    const editing = !this.preview && this._edit.active;
    return html`
      <ha-card>
        ${this._renderStaleBundle()}
        ${this._renderOnboarding()}
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${editing
              ? html`
                  ${this._iconButton("mdi:refresh", "Look for new actions (press the buttons first)", () => void this._refreshActions())}
                  ${this._iconButton("mdi:import", "Import existing automations", this._openImport)}
                  ${this._iconButton("mdi:export", "Hand this remote back to HA…", () => {
                    this._releaseOpen = true;
                  })}
                  ${this._iconButton("mdi:undo", "Undo", () => this._edit.undo(), {
                    disabled: !this._edit.canUndo,
                  })}
                  ${this._iconButton("mdi:close", "Discard layout changes (Esc)", () => void this._discardCanvasEdit())}
                  ${this._iconButton("mdi:check", "Save layout", () => void this._edit.done(), {
                    active: true,
                  })}
                `
              : this.preview
                ? nothing
                : this._iconButton("mdi:pencil", "Edit layout & slots", this._enterEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${this._renderCanvas(editing)}
        ${this._editingAction !== undefined ? this._renderEditor() : nothing}
        ${this._importScan ? this._renderImport() : nothing}
        ${this._releaseOpen ? this._renderRelease() : nothing}
      </ha-card>
    `;
  }

  private _renderGridCard(): TemplateResult {
    const remote = this._remote!;
    const editing = !this.preview && this._gridEditing;
    const layout = this._gridLayout()!;
    const buttons = remote.buttons ?? [];
    return html`
      <ha-card>
        ${this._renderStaleBundle()}
        ${this._renderOnboarding()}
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${editing
              ? html`
                  ${this._iconButton(
                    "mdi:view-grid-plus-outline",
                    "Grid shape (rows × columns)",
                    () => {
                      this._pickerOpen = !this._pickerOpen;
                    },
                    { active: this._pickerOpen }
                  )}
                  ${this._iconButton("mdi:refresh", "Look for new actions (press the buttons first)", () => void this._refreshActions())}
                  ${this._iconButton("mdi:import", "Import existing automations", this._openImport)}
                  ${this._iconButton("mdi:export", "Hand this remote back to HA…", () => {
                    this._releaseOpen = true;
                  })}
                  ${this._iconButton("mdi:close", "Discard layout changes", () => void this._discardGridEdit())}
                  ${this._iconButton("mdi:check", "Save layout", () => void this._saveGridEdit(), {
                    active: true,
                  })}
                `
              : this.preview
                ? nothing
                : this._iconButton("mdi:pencil", "Edit layout & slots", this._enterGridEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${this.preview
          ? html`<p class="hint grid-hint">· Edit buttons and events from the dashboard; this preview only shows the card</p>`
          : nothing}
        ${editing && this._pickerOpen
          ? html`<div class="picker-dock">
              <remote-mapper-grid-picker
                .rows=${layout.rows}
                .cols=${layout.cols}
                .minCells=${buttons.length}
                @grid-picked=${this._onGridPicked}
              ></remote-mapper-grid-picker>
            </div>`
          : nothing}
        ${editing
          ? html`<p class="hint grid-hint">· Tap a button to rename it or edit its events</p>
            <p class="hint grid-hint">· Drag a button onto another cell to swap</p>
            <p class="hint grid-hint">· Event edits save right away; ✓ saves the layout, ✕ discards it</p>`
          : nothing}
        ${buttons.length === 0
          ? nothing // an empty grid is just blank space; the hint below says what to do
          : html`
          <remote-mapper-grid
            style=${styleVarsOf(this._config)}
            .buttons=${buttons}
            .layout=${layout}
            .slots=${this._slotViews()}
            .display=${displayOf(this._config)}
            .assistedTrigger=${assistedTriggerOf(this._config)}
            .chipsLayout=${chipsLayoutOf(this._config)}
            .editing=${editing}
            .flash=${this._flash}
            @run-action=${(e: CustomEvent<{ actionId: string }>) =>
              void this._runSlot(e.detail.actionId)}
            @open-button=${(e: CustomEvent<{ buttonId: string }>) => {
              this._buttonSheet = e.detail.buttonId;
              this._modalOpenedAt = Date.now();
            }}
            @layout-changed=${(e: CustomEvent<{ layout: GridLayout }>) => {
              this._setGridDraft(e.detail.layout);
            }}
          ></remote-mapper-grid>
            `}
        ${buttons.length === 0
          ? html`<div class="grid-hint">
              <p class="hint">
                No buttons known yet. Press each button on the remote once (every
                gesture you want: single, double, hold), then look again — the
                card also checks on every Home Assistant start and whenever you
                open edit mode.
              </p>
              <div class="buttons">
                <button @click=${() => void this._refreshActions()}>Look for buttons now</button>
              </div>
            </div>`
          : nothing}
        ${this._buttonSheet !== undefined ? this._renderButtonSheet() : nothing}
        ${this._editingAction !== undefined ? this._renderEditor() : nothing}
        ${this._importScan ? this._renderImport() : nothing}
        ${this._releaseOpen ? this._renderRelease() : nothing}
      </ha-card>
    `;
  }

  /**
   * HA-native 48px icon button (mdi icon name) — same control HA's own
   * cards use. Hover shows the native title; a long press (touch) shows
   * the same text in a bubble and swallows the tap.
   */
  private _iconButton(
    icon: string,
    title: string,
    onClick: (e: Event) => void,
    opts: { active?: boolean; disabled?: boolean } = {}
  ): TemplateResult {
    const clearTimer = () => {
      if (this._tipTimer !== undefined) {
        clearTimeout(this._tipTimer);
        this._tipTimer = undefined;
      }
    };
    // finger lifted (or the browser took the gesture): linger, then go
    const release = () => {
      clearTimer();
      if (this._tip) this._hideTipIn(1500);
    };
    return html`<ha-icon-button
      class=${opts.active ? "active" : ""}
      .label=${title}
      title=${title}
      ?disabled=${opts.disabled}
      @pointerdown=${(e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        clearTimer();
        this._hideTipIn(0);
        this._tipShown = false;
        const anchor = e.currentTarget as HTMLElement;
        this._tipTimer = setTimeout(() => {
          this._tipTimer = undefined;
          this._tipShown = true;
          this._tip = tipAnchor(title, anchor.getBoundingClientRect(), window.innerWidth);
          // backstop in case no pointerup/cancel ever reaches us
          this._hideTipIn(4000);
        }, 450);
      }}
      @pointerup=${release}
      @pointercancel=${release}
      @pointerleave=${release}
      @contextmenu=${(e: Event) => {
        if (this._tipShown) e.preventDefault();
      }}
      @click=${(e: Event) => {
        if (this._tipShown) {
          // the long press was a "what is this?" — not a command
          e.stopPropagation();
          this._tipShown = false;
          return;
        }
        // handlers may be plain methods — keep `this` bound to the card
        onClick.call(this, e);
      }}
    >
      <ha-icon icon=${icon}></ha-icon>
    </ha-icon-button>`;
  }

  /** (Re)schedule the long-press bubble to disappear; 0 hides it now. */
  private _hideTipIn(ms: number): void {
    clearTimeout(this._tipHideTimer);
    this._tipHideTimer = undefined;
    if (ms <= 0) {
      this._tip = undefined;
      return;
    }
    this._tipHideTimer = setTimeout(() => {
      this._tipHideTimer = undefined;
      this._tip = undefined;
    }, ms);
  }

  private _renderTip(): TemplateResult | typeof nothing {
    const tip = this._tip;
    if (!tip) return nothing;
    const side = tip.right !== undefined ? `right:${tip.right}px` : `left:${tip.left}px`;
    return html`<div class="tip" role="tooltip" style="top:${tip.top}px;${side}">${tip.text}</div>`;
  }

  /** One button's events: rename (edit mode), run, or open the slot editor. */
  private _renderButtonSheet(): TemplateResult {
    const remote = this._remote!;
    const layout = this._gridLayout()!;
    const button = (remote.buttons ?? []).find((b) => b.id === this._buttonSheet);
    if (!button) return html``;
    const views = this._slotViews();
    const close = () => {
      this._buttonSheet = undefined;
    };
    return html`
      <div class="modal-backdrop" @click=${this._backdropClick(close)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>
            ${buttonLabel(button, layout)}
            <span class="hint">(${button.id})</span>
          </h3>
          ${this._gridEditing
            ? html`<label class="hint row">
                Label
                <input
                  class="label-input"
                  type="text"
                  .value=${layout.buttons[button.id]?.label ?? ""}
                  placeholder=${button.id}
                  @input=${(e: Event) => {
                    if (this._gridDraft) {
                      this._setGridDraft(
                        setButtonLabel(
                          this._gridDraft,
                          button.id,
                          (e.target as HTMLInputElement).value
                        )
                      );
                    }
                  }}
                />
              </label>`
            : nothing}
          <ul class="event-list">
            ${button.actions.map((a) => {
              const view = views[a.action_id];
              return html`
                <li class=${view?.assigned ? "on" : ""}>
                  <span class="ev-main">
                    <span class="ev-icon" title=${KIND_TITLE[a.kind]}
                      >${KIND_ICON[a.kind]}</span
                    >
                    <span class="ev-name">${a.event}</span>
                    <span class="ev-summary">${view?.summary ?? "not set"}</span>
                  </span>
                  <span class="ev-actions">
                  ${this._iconButton("mdi:play", "Run now", () => void this._runSlot(a.action_id), {
                    disabled: !view?.assigned || !!view.archived,
                  })}
                  ${(() => {
                    const target = this._targetEditor(remote.slots[a.action_id]);
                    return target
                      ? this._iconButton(target.icon, target.title, () => this._navigate(target.path))
                      : nothing;
                  })()}
                  ${(() => {
                    // chips, fixed order: the slot's own automation (own,
                    // shared or linked), then every imported original —
                    // all at once, so a multi-source event keeps its trail
                    const slot = remote.slots[a.action_id];
                    const path = this._automationEditPath(slot);
                    const chips: TemplateResult[] = [];
                    if (path) {
                      const off = this._automationState(slot) === "off";
                      const linked = this._isLinked(slot);
                      const kind = slot?.shared_automation
                        ? "Remote automation (this event's branch)"
                        : linked
                          ? "Linked automation"
                          : "Automation";
                      chips.push(
                        this._iconButton(
                          off ? "mdi:robot-off" : "mdi:robot",
                          `${kind}${off ? " (DISABLED)" : ""} — open in HA's editor`,
                          () => this._navigate(path),
                          { active: !off && (linked || !!slot?.shared_automation) }
                        )
                      );
                    }
                    chips.push(...this._importedSources(slot).map((src) => {
                      // live state: an original that got re-enabled fires in
                      // parallel with this slot on every press — say so
                      const enabled =
                        !!src.entity_id && this._hass?.states?.[src.entity_id]?.state === "on";
                      const label = src.entity_id ?? src.config_id;
                      return this._iconButton(
                        enabled ? "mdi:robot" : "mdi:robot-off",
                        enabled
                          ? `Imported original is ENABLED — it also runs on this press: ${label}`
                          : `Open the imported original (disabled): ${label}`,
                        () => this._navigate(`/config/automation/edit/${src.config_id}`),
                        { active: enabled }
                      );
                    }));
                    return chips;
                  })()}
                  ${this._iconButton("mdi:pencil", "Edit", () => void this._openEditor(a.action_id))}
                  </span>
                </li>
              `;
            })}
          </ul>
          <div class="buttons">
            <button @click=${close}>Close</button>
          </div>
        </div>
      </div>
    `;
  }

  private _enterEdit = (): void => {
    this._edit.enter();
    const actions = this._remote?.layout?.actions ?? [];
    const layout = this._currentLayout();
    if (layout) {
      const byId = new Map(layout.widgets.map((w) => [w.id, w]));
      this._edit.ensureTiles(
        (id) => byId.get(id) ?? defaultLayout([id]).widgets[0],
        actions
      );
    }
  };

  private _renderCanvas(editing: boolean): TemplateResult {
    const layout = this._currentLayout()!;
    const t = this._transform()!;
    const widgets = editing ? this._edit.working : layout.widgets;
    const selected = this._edit.selectedId;
    return html`
      <div
        class="viewport ${editing ? "editing" : ""}"
        style="height:${t.viewportHeight}px"
        @pointerdown=${(e: PointerEvent) => {
          if (!editing) this._edit.onViewPointerDown(e);
          else this._edit.select(null);
        }}
        @pointermove=${(e: PointerEvent) => this._edit.onViewPointerMove(e)}
        @pointerup=${() => this._edit.cancelLongPress()}
      >
        <div
          class="canvas"
          style="width:${layout.design_size.width}px;height:${layout.design_size
            .height}px;transform:translate(${t.offsetX}px, ${t.offsetY}px) scale(${t.scale})"
        >
          ${widgets.map((w) => this._renderTile(w, editing, w.id === selected))}
        </div>
        ${editing && this._edit.selected ? this._renderChipbar(this._edit.selected, t) : nothing}
      </div>
      ${editing ? this._renderDpad() : nothing}
    `;
  }

  private _renderTile(
    w: WidgetConfig,
    editing: boolean,
    selected: boolean
  ): TemplateResult {
    const slot = this._remote!.slots[w.id];
    const classes = [
      "widget-slot",
      "tile",
      slot ? "assigned" : "empty",
      slot?.archived ? "archived" : "",
      this._flash === w.id ? "flash" : "",
      selected ? "selected" : "",
    ].join(" ");
    return html`
      <div
        class=${classes}
        data-slot-id=${w.id}
        style="transform:translate3d(${w.x}px, ${w.y}px, 0);width:${w.w}px;height:${w.h}px;z-index:${w.z ?? 1}"
        @pointerdown=${(e: PointerEvent) => {
          if (editing) this._edit.onSlotPointerDown(e, w.id);
        }}
        @click=${() => {
          if (!editing) void this._runSlot(w.id);
        }}
        @dblclick=${() => {
          if (editing) this.openSettings(w.id);
        }}
      >
        <span class="action">${w.id}</span>
        <span class="summary">${this._slotSummary(slot)}</span>
        ${slot?.last_error
          ? html`<span class="tile-badge error-badge" title=${slot.last_error}
              >!</span
            >`
          : nothing}
        ${slot?.archived
          ? html`<span class="tile-badge">disabled</span>`
          : nothing}
        ${this._remote!.stale_actions?.includes(w.id)
          ? html`<span
              class="tile-badge warn"
              title="The source no longer reports this action (renamed upstream?)"
              >stale</span
            >`
          : nothing}
        ${editing && selected
          ? html`${(["nw", "ne", "sw", "se"] as const).map(
              (corner) => html`
                <span
                  class="handle ${corner}"
                  @pointerdown=${(e: PointerEvent) =>
                    this._edit.onHandlePointerDown(e, w.id, corner)}
                ></span>
              `
            )}`
          : nothing}
      </div>
    `;
  }

  /** Below the viewport, not over it: in a narrow card it hid the tiles. */
  private _renderDpad(): TemplateResult {
    const sel = this._edit.selected;
    const steps = this._edit.dpadSteps;
    const stepLabel =
      this._edit.dpadMode === "fine"
        ? "1"
        : steps.x === steps.y
          ? `${steps.x}`
          : `${steps.x}·${steps.y}`;
    const press = (dx: number, dy: number) => (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      this._edit.dpadPress(dx, dy);
    };
    const release = () => this._edit.dpadRelease();
    return html`
      <div class="dpad-dock" @pointerdown=${(e: Event) => e.stopPropagation()}>
        ${sel ? html`<div class="badge"></div>` : nothing}
        <div class="dpad">
          <span></span>
          <button ?disabled=${!sel} @pointerdown=${press(0, -1)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>▲</button>
          <span></span>
          <button ?disabled=${!sel} @pointerdown=${press(-1, 0)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>◀</button>
          <button class="step" title="Toggle nudge step (1 unit ↔ grid cell)"
            @click=${() => this._edit.toggleDpadStep()}>${stepLabel}</button>
          <button ?disabled=${!sel} @pointerdown=${press(1, 0)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>▶</button>
          <span></span>
          <button ?disabled=${!sel} @pointerdown=${press(0, 1)}
            @pointerup=${release} @pointercancel=${release}
            @lostpointercapture=${release}>▼</button>
          <span></span>
        </div>
      </div>
    `;
  }

  private _renderChipbar(sel: WidgetConfig, t: CanvasTransform): TemplateResult {
    const vw = this._hostWidth || 300;
    const cx = t.offsetX + (sel.x + sel.w / 2) * t.scale;
    const topPx = t.offsetY + sel.y * t.scale;
    const flip = topPx < 46;
    const top = flip ? t.offsetY + (sel.y + sel.h) * t.scale + 6 : topPx - 6;
    const left = Math.min(Math.max(cx, 110), Math.max(110, vw - 110));
    return html`
      <div
        class="chipbar"
        style="left:${left}px;top:${top}px;transform:translate(-50%, ${flip
          ? "0"
          : "-100%"})"
        @pointerdown=${(e: Event) => e.stopPropagation()}
      >
        <button title="Slot settings" @click=${() => this.openSettings(sel.id)}>
          ⚙
        </button>
        <button title="Send backward" @click=${() => this._edit.zOp("backward")}>
          ↓
        </button>
        <button title="Bring forward" @click=${() => this._edit.zOp("forward")}>
          ↑
        </button>
      </div>
    `;
  }

  private _renderEditor(): TemplateResult {
    const slot = this._remote!.slots[this._editingAction!];
    const whole = this._editingLive?.whole;
    const runs = whole && whole.events.length > 1 ? whole.events : undefined;
    return html`
      <div class="modal-backdrop" @click=${this._backdropClick(this._closeEditor)}>
        <div class="modal" @click=${this._ghostGuard}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive
            ? html`<p class="hint">
                ${this._editingLive.owned === false ? "Linked to" : "Backed by"}
                <b>${this._editingLive.alias}</b>
                ${this._editingLive.state === "off" ? html`<span class="warn">(disabled)</span>` : nothing}
                —
                <button
                  class="link"
                  @click=${() => this._navigate(this._editingLive!.edit_url)}
                >
                  open in HA's automation editor
                </button>.
                ${this._editingLive.branch_missing
                  ? html`<span class="warn">It has no branch for this event any more.</span>
                      Pick "Add this button to the remote automation" below to re-add one.`
                  : this._editingLive.owned === false && runs
                    ? `It runs ${runs.length} events on this remote (${runs.map((a) => this._eventName(a)).join(", ")}) and stays native; edit it there.` +
                      (whole?.blocked
                        ? ""
                        : " Unticking the box below moves all of them into this card and turns it off (hand-back turns it on again).")
                    : this._editingLive.owned === false
                      ? "It stays native and enabled; edit it there. Unticking the box below copies its actions into this card and disables it (hand-back re-enables it)."
                      : this._editingLive.branch
                        ? 'This event is one branch of it. Unticking "automation" below moves the branch\'s actions into this card and removes the branch; the other buttons keep theirs.'
                        : 'Unticking "automation" below deletes it on Save and moves its actions into this card. Cancel keeps things as they are.'}
              </p>`
            : nothing}
          <div class="tabs">
            <button
              class=${this._editorTab === "quick" ? "on" : ""}
              @click=${() => {
                this._editorTab = "quick";
              }}
            >
              Quick
            </button>
            <button
              class=${this._editorTab === "yaml" ? "on" : ""}
              @click=${() => {
                this._editorTab = "yaml";
              }}
            >
              YAML
            </button>
          </div>
          ${this._editorTab === "quick"
            ? this._renderQuickTab()
            : this._renderYamlTab()}
          <label class="hint row">
            Name
            <input
              class="label-input"
              type="text"
              .value=${this._draftName}
              placeholder=${this._autoNamePlaceholder()}
              @input=${(e: Event) => {
                this._draftName = (e.target as HTMLInputElement).value;
              }}
            />
          </label>
          ${this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)
            ? nothing
            : html`<label class="hint row">
                <input
                  type="checkbox"
                  .checked=${this._draftMaterialized}
                  ?disabled=${!!whole?.blocked && this._draftMaterialized}
                  @change=${(e: Event) => {
                    this._draftMaterialized = (e.target as HTMLInputElement).checked;
                  }}
                />
                ${this._editingLive?.owned === false
                  ? whole?.blocked
                    ? "Keep linked to the automation"
                    : (whole?.events.length ?? 0) > 1
                      ? "Keep linked to the automation (untick to move the whole automation into the card)"
                      : "Keep linked to the automation (untick to absorb into the card)"
                  : this._editingLive?.branch
                    ? "Keep as a branch of the remote automation (untick to move it into the card)"
                    : "Create as automation (editable/traceable in HA)"}
              </label>`}
          ${whole?.blocked
            ? html`<p class="hint">
                ${whole.foreign
                  ? "It can't move into the card or be disabled here: " +
                    `${whole.blocked}, which would stop too.`
                  : `It can't move into the card: ${whole.blocked}.`}
                Edit it in HA.
              </p>`
            : nothing}
          ${this._draftError
            ? html`<p class="error">${this._draftError}</p>`
            : nothing}
          <div class="buttons">
            <button @click=${this._saveDraft}>
              ${this._editorTab === "quick" && this._quickMode === "new_scene"
                ? "📸 Capture"
                : this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)
                  ? "Create & open in HA"
                  : "Save"}
            </button>
            <button @click=${this._closeEditor}>Cancel</button>
            ${slot?.scene_id
              ? html`<button
                  title="Same scene, same entities, new states"
                  @click=${() => this._snapshot(true)}
                >
                  Re-snapshot
                </button>`
              : nothing}
            ${slot
              ? html`
                  <button class="danger" @click=${() => void this._confirmClear()}>
                    Clear
                  </button>
                  <button
                    ?disabled=${!!whole?.foreign && !slot.archived}
                    @click=${() => void this._confirmArchive()}
                  >
                    ${slot.archived ? "Enable" : "Disable"}
                  </button>
                `
              : nothing}
          </div>
          ${this._clearArtifacts ? this._renderClearDialog() : nothing}
        </div>
      </div>
    `;
  }

  /**
   * HA caches custom resources until a full reload, so after an update the
   * backend can be newer than the card running in this tab. Same purpose
   * as HACS's "reload your browser" prompt, shown where it matters.
   */
  private _renderStaleBundle(): TemplateResult | typeof nothing {
    const backend = this._remote?.version;
    const status = bundleStatus(CARD_VERSION, backend);
    if (status === "current" || !backend) return nothing;
    if (status === "ahead") {
      // Files on disk are newer than the running backend: HA was not
      // restarted after the update. A reload can't fix that.
      return html`
        <div class="stale">
          This tab runs the v${CARD_VERSION} card but Home Assistant still runs
          Remote Mapper v${backend}. Restart Home Assistant to finish the update.
        </div>
      `;
    }
    void this._offerReloadDialog(backend);
    return html`
      <div class="stale">
        Remote Mapper was updated to v${backend}; this tab still runs the
        v${CARD_VERSION} card.
        <button @click=${() => void reloadWithClearedCache()}>Reload</button>
      </div>
    `;
  }

  /** First-run tips, one at a time, in the same strip as the update banner. */
  private _renderOnboarding(): TemplateResult | typeof nothing {
    if (this.preview) return nothing;
    void this._tipsRev; // re-render after a tap
    const tip = nextTip();
    if (!tip) return nothing;
    return html`
      <div class="tipbar">
        <span class="tipbar-text"
          ><b>Tip ${tip.index + 1}/${TIPS.length}</b> ${tip.text}</span
        >
        <span class="tipbar-buttons">
          <button
            @click=${() => {
              advanceTip();
              this._tipsRev++;
            }}
          >
            ${tip.index + 1 < TIPS.length ? "Next" : "Got it"}
          </button>
          ${tip.index + 1 < TIPS.length
            ? html`<button
                class="quiet"
                @click=${() => {
                  skipTips();
                  this._tipsRev++;
                }}
              >
                Skip
              </button>`
            : nothing}
        </span>
      </div>
    `;
  }

  /** HA's own confirm dialog (the one HACS shows), once per page load. */
  private async _offerReloadDialog(backend: string): Promise<void> {
    if (reloadPrompted) return;
    reloadPrompted = true;
    try {
      const helpers = await loadHelpers();
      const ok = await helpers?.showConfirmationDialog?.(this, {
        title: "Reload",
        text:
          `Remote Mapper was updated to v${backend}, but this page still runs ` +
          `the v${CARD_VERSION} card. Reload the page to use the new version?`,
        confirmText: "Reload",
        dismissText: "Later",
      });
      if (ok) await reloadWithClearedCache();
    } catch {
      /* helpers unavailable — the banner stays as the fallback */
    }
  }

  /** What the name will be if left empty — inferred from the current draft. */
  private _autoNamePlaceholder(): string {
    let sequence: unknown[] = [];
    if (this._editorTab === "quick" && CREATE_MODES.has(this._quickMode)) {
      return this._quickMode === "new_scene"
        ? `Auto: ${this._remote?.title ?? "Remote"} ${this._editingAction ?? ""}`
        : "Auto (from the automation)";
    }
    if (this._editorTab === "quick" && this._quickMode === "link") {
      const friendly = this._quickEntity
        ? this._hass?.states?.[this._quickEntity]?.attributes?.friendly_name
        : undefined;
      return typeof friendly === "string" && friendly
        ? `Auto: ${friendly}`
        : "Auto (the automation's name)";
    }
    if (this._editorTab === "quick" && this._quickEntity) {
      sequence = quickSequence(this._quickMode, this._quickEntity, this._quickOption);
    } else if (this._yamlEditorOk) {
      sequence = this._yamlValue ?? [];
    } else {
      try {
        sequence = JSON.parse(this._draft || "[]") as unknown[];
      } catch {
        sequence = [];
      }
    }
    const auto = inferName(sequence, this._hass);
    return auto ? `Auto: ${auto}` : "Auto (from the action)";
  }

  private _renderQuickTab(): TemplateResult {
    if (!this._haFormOk) {
      return html`<p class="hint">
        Loading HA editor components… If this persists, use the YAML tab.
      </p>`;
    }
    const slot = this._remote?.slots[this._editingAction ?? ""];
    const hasShared = !!this._remote?.remote_automation;
    // "Create new" first: an empty button is usually a new thing, not a bind.
    // The whole-remote option turns into "add this button" once it exists,
    // and disappears for a slot that already is a (present) branch of it.
    const createOptions: Array<{ value: QuickMode; label: string }> = [
      { value: "new_scene", label: "＋ Scene from current state" },
      { value: "new_automation", label: "＋ Automation for this button (fill in HA)" },
    ];
    if (!hasShared) {
      createOptions.push({
        value: "new_remote_automation",
        label: "＋ Automation for the whole remote (one branch per event)",
      });
    } else if (!slot?.shared_automation || slot.branch_missing) {
      createOptions.push({
        value: "new_remote_automation",
        label: "＋ Add this button to the remote automation",
      });
    }
    const schema: Array<Record<string, unknown>> = [
      {
        name: "mode",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              ...createOptions,
              { value: "scene", label: "Activate scene" },
              { value: "toggle", label: "Toggle entity" },
              { value: "script", label: "Run script" },
              { value: "wled_preset", label: "Set WLED preset" },
              { value: "link", label: "Link existing automation (stays native)" },
            ],
          },
        },
      },
    ];
    let createHint: string | undefined;
    if (this._quickMode === "new_scene") {
      schema.push({ name: "entities", selector: { entity: { multiple: true } } });
      schema.push({ name: "remember", selector: { boolean: {} } });
      createHint =
        "Set the room the way you like it first. Capture stores the current state of these entities as a scene bound to this event; Re-snapshot later updates it in place.";
    } else if (this._quickMode === "new_automation") {
      createHint =
        "Creates an automation with this event as its trigger and no actions, then opens HA's editor so you can fill it in. The card shows what you put there.";
    } else if (this._quickMode === "new_remote_automation") {
      createHint = hasShared
        ? "Appends a trigger and an empty branch for this event to the remote's automation, then opens it in HA's editor."
        : "Creates one automation for this remote: a trigger per event and a choose block with one branch per event (the blueprint look). Buttons you already built in the card move into their branch; buttons with their own automation stay as they are.";
    }
    if (this._quickMode === "link") {
      schema.push({
        name: "entity",
        selector: { entity: { domain: "automation" } },
      });
    } else if (this._quickMode === "wled_preset") {
      // WLED exposes presets as a select.*_preset entity; picking one is a
      // select.select_option call. Populate the preset list from the chosen
      // entity's `options` attribute, falling back to free text.
      schema.push({
        name: "entity",
        selector: { entity: { domain: "select", integration: "wled" } },
      });
      const stateObj = this._quickEntity
        ? this._hass?.states?.[this._quickEntity]
        : undefined;
      const options = (stateObj?.attributes?.options as string[] | undefined) ?? [];
      schema.push({
        name: "option",
        selector: options.length
          ? { select: { mode: "dropdown", custom_value: true, options } }
          : { text: {} },
      });
    } else if (!CREATE_MODES.has(this._quickMode)) {
      const domain =
        this._quickMode === "scene"
          ? "scene"
          : this._quickMode === "script"
            ? "script"
            : undefined;
      schema.push({
        name: "entity",
        selector: { entity: domain ? { domain } : {} },
      });
    }
    const labels: Record<string, string> = {
      mode: "Action",
      option: "Preset",
      entities: "Entities to capture",
      remember: "Remember these as this remote's default",
      entity: this._quickMode === "link" ? "Automation" : "Entity",
    };
    return html`
      <ha-form
        .hass=${this._hass}
        .data=${{
          mode: this._quickMode,
          entity: this._quickEntity,
          option: this._quickOption,
          entities: this._snapEntities,
          remember: this._snapRemember,
        }}
        .schema=${schema}
        .computeLabel=${(s: { name: string }) => labels[s.name] ?? s.name}
        @value-changed=${(e: CustomEvent) => {
          const value = e.detail.value as {
            mode: QuickMode;
            entity: string;
            option?: string;
            entities?: string[];
            remember?: boolean;
          };
          if (value.mode !== this._quickMode) {
            this._quickMode = value.mode;
            this._quickEntity = "";
            this._quickOption = "";
          } else if (CREATE_MODES.has(this._quickMode)) {
            this._snapEntities = value.entities ?? [];
            this._snapRemember = !!value.remember;
          } else if (value.entity !== this._quickEntity) {
            // Entity changed → its preset list differs, drop the old option.
            this._quickEntity = value.entity ?? "";
            this._quickOption = "";
          } else {
            this._quickEntity = value.entity ?? "";
            this._quickOption = value.option ?? "";
          }
        }}
      ></ha-form>
      ${createHint ? html`<p class="hint">${createHint}</p>` : nothing}
    `;
  }

  private _renderYamlTab(): TemplateResult {
    if (this._yamlEditorOk) {
      return html`
        <ha-yaml-editor
          .hass=${this._hass}
          .defaultValue=${this._yamlValue ?? []}
          @value-changed=${(e: CustomEvent) => {
            const detail = e.detail as { value: unknown; isValid?: boolean };
            this._yamlValid = detail.isValid !== false;
            if (this._yamlValid) {
              this._yamlValue = (detail.value ?? []) as unknown[];
            }
          }}
        ></ha-yaml-editor>
        ${this._yamlValid ? nothing : html`<p class="error">Invalid YAML</p>`}
      `;
    }
    return html`
      <p class="hint">Sequence (YAML or JSON) — same as automation actions.</p>
      <textarea
        .value=${this._draft}
        spellcheck="false"
        @input=${(e: Event) => {
          this._draft = (e.target as HTMLTextAreaElement).value;
        }}
      ></textarea>
    `;
  }

  private _renderClearDialog(): TemplateResult {
    const artifacts = this._clearArtifacts!;
    const parts: string[] = [];
    if (artifacts.scene) {
      parts.push(
        `scene ${(artifacts.scene as { entity_id?: string }).entity_id ?? ""}`
      );
    }
    if (artifacts.automation) parts.push("its automation");
    return html`
      <div class="decision">
        <p><b>Also delete ${parts.join(" and ")}?</b></p>
        <label class="hint">
          <input
            type="checkbox"
            .checked=${this._clearRemember}
            @change=${(e: Event) => {
              this._clearRemember = (e.target as HTMLInputElement).checked;
            }}
          />
          Remember my choice
        </label>
        <div class="buttons">
          <button class="danger" @click=${() => this._clearSlot("delete")}>
            Delete
          </button>
          <button @click=${() => this._clearSlot("keep")}>Keep</button>
          <button
            @click=${() => {
              this._clearArtifacts = undefined;
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    `;
  }

  private _renderImport(): TemplateResult {
    const scan = this._importScan!;
    return html`
      <div class="modal-backdrop" @click=${this._closeImport}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>Import automations</h3>
          ${scan.proposals.length === 0
            ? html`<p class="hint">No importable automations found.</p>`
            : html`
                <p class="hint">
                  <b>Link</b> keeps the automation native and enabled — the card
                  shows it and opens it in HA's editor. <b>Absorb</b> copies its
                  actions into the card and disables it (never deletes).
                </p>
                <ul class="import-list">
                  ${scan.proposals.map(
                    (p, i) => html`
                      <li>
                        <label>
                          <input
                            type="checkbox"
                            .checked=${this._importSelected.has(i)}
                            @change=${(e: Event) => {
                              const next = new Set(this._importSelected);
                              if ((e.target as HTMLInputElement).checked) {
                                next.add(i);
                              } else {
                                next.delete(i);
                              }
                              this._importSelected = next;
                            }}
                          />
                          <b>${p.action_id}</b> ← ${p.alias}
                          ${p.linkable
                            ? html`<select
                                class="mode"
                                .value=${p.mode ?? "link"}
                                @click=${(e: Event) => e.stopPropagation()}
                                @change=${(e: Event) => {
                                  const mode = (e.target as HTMLSelectElement).value as
                                    | "link"
                                    | "absorb";
                                  const proposals = scan.proposals.map((q, j) =>
                                    j === i ? { ...q, mode } : q
                                  );
                                  this._importScan = { ...scan, proposals };
                                }}
                              >
                                <option value="link">link (keep native)</option>
                                <option value="absorb">absorb (copy in, disable)</option>
                              </select>`
                            : html`<span class="hint-inline">absorb</span>`}
                          ${p.conflict
                            ? html`<span class="warn">(overwrites slot)</span>`
                            : nothing}
                          ${p.mixed
                            ? html`<span class="warn"
                                >(mixed remotes — source stays enabled)</span
                              >`
                            : nothing}
                          ${p.merged
                            ? html`<span class="warn"
                                title="Home Assistant ran all of them on this press; the slot runs them one after another"
                                >(merges ${p.sources?.length ?? 2} automations)</span
                              >`
                            : nothing}
                        </label>
                      </li>
                    `
                  )}
                </ul>
              `}
          ${scan.skipped.length
            ? html`
                <p class="hint">Needs manual import:</p>
                <ul class="import-list">
                  ${scan.skipped.map(
                    (s) => html`<li>${s.alias} — <code>${s.reason}</code></li>`
                  )}
                </ul>
              `
            : nothing}
          ${scan.proposals.some((p) => p.conflict)
            ? html`<label class="hint check-row">
                <input
                  type="checkbox"
                  .checked=${this._importOverwrite}
                  @change=${(e: Event) => {
                    this._importOverwrite = (e.target as HTMLInputElement).checked;
                  }}
                />
                Overwrite already-assigned slots
              </label>`
            : nothing}
          ${this._importError
            ? html`<p class="error">${this._importError}</p>`
            : nothing}
          <div class="buttons">
            <button ?disabled=${this._importBusy} @click=${this._applyImport}>
              Apply
            </button>
            <button @click=${this._closeImport}>Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  static override styles = css`
    /* Header mirrors ha-card's .card-header: 24px title, 48px icon buttons */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-1, 4px) var(--ha-space-1, 4px) 0 var(--ha-space-4, 16px);
      min-height: var(--ha-space-12, 48px);
    }
    .title {
      color: var(--ha-card-header-color, var(--primary-text-color));
      font-family: var(--ha-card-header-font-family, inherit);
      font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl, 24px));
      font-weight: var(--ha-card-header-font-weight, var(--ha-font-weight-normal, 400));
      letter-spacing: -0.012em;
      line-height: var(--ha-line-height-condensed, 1.2);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .header-buttons {
      display: flex;
      align-items: center;
      flex: none;
    }
    ha-icon-button {
      color: var(--secondary-text-color);
    }
    ha-icon-button.active {
      color: var(--primary-color);
    }
    ha-icon-button {
      -webkit-touch-callout: none;
      user-select: none;
      touch-action: manipulation;
    }
    /* Same tokens HA's ha-tooltip uses, with fallbacks for older cores. */
    .tip {
      position: fixed;
      z-index: 1000;
      max-width: min(320px, calc(100vw - 2 * var(--ha-space-2, 8px)));
      padding: var(--ha-tooltip-padding, var(--ha-space-2, 8px));
      border-radius: var(--ha-tooltip-border-radius, var(--ha-border-radius-md, 8px));
      background: var(
        --ha-tooltip-background-color,
        var(--ha-color-surface-default, var(--secondary-background-color, #333))
      );
      color: var(--ha-tooltip-text-color, var(--primary-text-color));
      font-family: var(--ha-tooltip-font-family, var(--ha-font-family-body, inherit));
      font-size: var(--ha-tooltip-font-size, var(--ha-font-size-m, 14px));
      font-weight: var(--ha-tooltip-font-weight, var(--ha-font-weight-medium, 500));
      line-height: var(--ha-tooltip-line-height, var(--ha-line-height-condensed, 1.2));
      box-shadow: var(--ha-tooltip-box-shadow, var(--ha-box-shadow-m, 0 2px 8px rgba(0, 0, 0, 0.35)));
      pointer-events: none;
      animation: rm-tip 120ms ease-out;
    }
    @keyframes rm-tip {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
    }
    .content {
      padding: 0 16px 16px;
    }
    .viewport {
      position: relative;
      overflow: hidden;
      margin: 8px 0 12px;
      touch-action: none;
    }
    .viewport.editing {
      outline: 2px dashed var(--primary-color);
      outline-offset: -2px;
    }
    .canvas {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: top left;
    }
    .tile {
      position: absolute;
      top: 0;
      left: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      box-sizing: border-box;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #444);
      background: var(--card-background-color, inherit);
      color: var(--primary-text-color);
      cursor: pointer;
      user-select: none;
    }
    .tile.empty {
      opacity: 0.45;
    }
    .tile.archived {
      opacity: 0.35;
      border-style: dashed;
    }
    .tile.assigned {
      border-color: var(--primary-color);
    }
    .tile.flash {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
    }
    .tile.selected {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }
    .viewport.editing .tile {
      cursor: move;
    }
    .action {
      font-weight: 500;
      font-size: 0.9em;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .summary {
      font-size: 0.7em;
      color: var(--secondary-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tile-badge {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.6em;
      color: var(--secondary-text-color);
    }
    .error-badge {
      color: var(--error-color, #db4437);
      font-weight: 700;
    }
    .handle {
      position: absolute;
      width: 12px;
      height: 12px;
      background: var(--primary-color);
      border-radius: 50%;
      z-index: 5;
    }
    .handle.nw {
      top: -6px;
      left: -6px;
      cursor: nwse-resize;
    }
    .handle.ne {
      top: -6px;
      right: -6px;
      cursor: nesw-resize;
    }
    .handle.sw {
      bottom: -6px;
      left: -6px;
      cursor: nesw-resize;
    }
    .handle.se {
      bottom: -6px;
      right: -6px;
      cursor: nwse-resize;
    }
    .chipbar {
      position: absolute;
      display: flex;
      gap: 2px;
      padding: 4px;
      border-radius: 10px;
      background: var(--card-background-color, #222);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
      z-index: 20;
    }
    .chipbar button {
      border: none;
      background: none;
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 1em;
      padding: 4px 8px;
    }
    .dpad-dock {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      margin: -4px 0 12px;
    }
    .badge {
      font-family: var(--code-font-family, monospace);
      font-size: 0.75em;
      background: var(--card-background-color, #222);
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px;
      padding: 2px 8px;
      min-height: 1.2em;
    }
    .dpad {
      display: grid;
      grid-template-columns: repeat(3, 34px);
      grid-auto-rows: 34px;
      gap: 2px;
      background: var(--card-background-color, #222);
      border: 1px solid var(--divider-color, #444);
      border-radius: 10px;
      padding: 4px;
    }
    .dpad button {
      border: none;
      border-radius: 6px;
      background: rgba(127, 127, 127, 0.12);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.9em;
    }
    .dpad button:disabled {
      opacity: 0.3;
    }
    .dpad .step {
      font-weight: 700;
    }
    .picker-dock {
      padding: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
    }
    .grid-hint {
      padding: 0 var(--ha-space-4, 16px);
      margin: 0 0 4px;
    }
    .grid-hint:last-child {
      margin-bottom: 0;
    }
    .event-list {
      list-style: none;
      margin: var(--ha-space-2, 8px) 0;
      padding: 0;
    }
    .event-list li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 var(--ha-space-2, 8px);
      padding: var(--ha-space-1, 4px) 0;
      border-bottom: 1px solid var(--divider-color, #444);
      opacity: 0.6;
    }
    /* name gets the line; icons drop to a second line when they don't fit */
    .ev-main {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      flex: 1 1 200px;
      min-width: 0;
      min-height: var(--ha-space-10, 40px);
    }
    .ev-actions {
      display: flex;
      align-items: center;
      margin-left: auto;
      --mdc-icon-button-size: 40px;
      --mdc-icon-size: 22px;
    }
    .event-list li.on {
      opacity: 1;
    }
    .ev-icon {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--ha-space-7, 28px);
      height: var(--ha-space-7, 28px);
      border-radius: 50%;
      border: 1px solid var(--primary-color);
      font-size: var(--ha-font-size-s, 12px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .ev-name {
      flex: none;
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-m, 14px);
    }
    .ev-summary {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .label-input {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-top: var(--ha-space-1, 4px);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px);
      background: inherit;
      color: inherit;
      font: inherit;
      font-size: var(--ha-font-size-l, 16px);
    }
    .tabs {
      display: flex;
      gap: 4px;
      margin: 4px 0 8px;
    }
    .tabs button {
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px) var(--ha-border-radius-md, 8px) 0 0;
      background: none;
      color: var(--secondary-text-color);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
    }
    .tabs button.on {
      color: var(--primary-color);
      border-color: var(--primary-color);
      font-weight: 600;
    }
    .row {
      display: block;
      margin-top: 8px;
    }
    .release-list {
      margin: 0 0 var(--ha-space-2, 8px);
      padding-left: 18px;
      font-size: var(--ha-font-size-m, 14px);
    }
    .release-list li {
      margin: var(--ha-space-1, 4px) 0;
    }
    .buttons .danger:first-child {
      background: none;
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    /* Lists inside modals: HA tokens only (em/px ignore the user's
       --ha-font-size-scale and read tiny next to HA's own dialogs). */
    .import-list {
      list-style: none;
      margin: var(--ha-space-1, 4px) 0 var(--ha-space-2, 8px);
      padding: 0;
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .import-list li {
      margin: var(--ha-space-1, 4px) 0;
    }
    .import-list label,
    .check-row {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
    }
    .import-list code {
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-s, 12px);
    }
    .modal input[type="checkbox"] {
      width: var(--ha-space-5, 20px);
      height: var(--ha-space-5, 20px);
      margin: 0;
      accent-color: var(--primary-color);
    }
    .import-list select.mode {
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      min-height: var(--ha-space-8, 32px);
      padding: 0 var(--ha-space-2, 8px);
      background: var(--card-background-color, inherit);
      color: inherit;
      border: 1px solid var(--divider-color, #444);
      border-radius: var(--ha-border-radius-md, 8px);
    }
    .hint-inline {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
    }
    .warn {
      color: var(--warning-color, #ffa600);
      font-size: var(--ha-font-size-s, 12px);
    }
    .decision {
      margin-top: 12px;
      padding: 12px;
      border: 1px solid var(--warning-color, #ffa600);
      border-radius: 8px;
    }
    .decision p {
      margin: 0 0 8px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .stale {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
      background: var(--warning-color, #ffa600);
      color: var(--text-primary-color, #fff);
    }
    .tipbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
      font-size: var(--ha-font-size-m, 14px);
      line-height: var(--ha-line-height-normal, 1.6);
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.15));
      color: var(--primary-text-color);
      border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
    }
    .tipbar-text {
      flex: 1 1 240px;
    }
    .tipbar-buttons {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }
    .tipbar button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border: 1px solid var(--primary-color);
      border-radius: var(--ha-border-radius-md, 8px);
      background: transparent;
      color: var(--primary-color);
      font: inherit;
      cursor: pointer;
    }
    .tipbar button.quiet {
      border-color: var(--divider-color, rgba(127, 127, 127, 0.3));
      color: var(--secondary-text-color);
    }
    .stale button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border: 1px solid currentColor;
      border-radius: var(--ha-border-radius-md, 8px);
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .hint {
      margin: 0 0 var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 30;
    }
    .modal {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 16px;
      width: min(560px, 94vw);
      max-height: 86vh;
      overflow: auto;
      box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.4));
    }
    button.link {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      color: var(--primary-color);
      text-decoration: underline;
      cursor: pointer;
    }
    .modal h3 {
      margin: 0 0 var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-xl, 20px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    textarea {
      width: 100%;
      min-height: 160px;
      font-family: var(--ha-font-family-code, var(--code-font-family, monospace));
      font-size: var(--ha-font-size-s, 12px);
      box-sizing: border-box;
      background: inherit;
      color: inherit;
      border: 1px solid var(--divider-color, #444);
      border-radius: 6px;
      padding: 8px;
    }
    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .buttons button {
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-4, 16px);
      border-radius: var(--ha-border-radius-md, 8px);
      border: 1px solid var(--divider-color, #444);
      background: none;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .buttons button:first-child {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color);
    }
    .buttons .danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
    .buttons button:disabled {
      opacity: 0.4;
      cursor: default;
    }
  `;
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Remote Mapper Card",
  description: "Map physical remote buttons to actions on a canvas layout.",
  preview: false,
});

console.info(
  `%c REMOTE-MAPPER-CARD %c ${CARD_VERSION} `,
  "color: white; background: #3f51b5; font-weight: 700;",
  "color: #3f51b5; background: white; font-weight: 700;"
);
