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
import { customElement, state } from "lit/decorators.js";

import "./card-editor";
import "./grid-picker";
import "./remote-grid";
import { EditController, type EditHost } from "./canvas/edit-controller";
import { ensureHaForm, ensureYamlEditor } from "./canvas/ha-loader";
import { computeTransform, type CanvasTransform } from "./canvas/scaling";
import type { CanvasLayout, WidgetConfig } from "./canvas/types";
import { deepClone } from "./canvas/util";
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
  type ButtonModel,
  type GridLayout,
} from "./model";
import { inferName } from "./naming";
import type { SlotView } from "./remote-grid";

const CARD_TAG = "remote-mapper-card";
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
  states?: Record<string, { attributes?: Record<string, unknown> }>;
  areas?: Record<string, { name?: string }>;
  devices?: Record<string, { name?: string | null; name_by_user?: string | null }>;
  floors?: Record<string, { name?: string }>;
}

interface SlotRecord {
  sequence: unknown[];
  name?: string | null;
  scene_id: string | null;
  materialized: boolean;
  automation_id: string | null;
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
}

type QuickMode = "scene" | "toggle" | "script" | "wled_preset" | "custom";

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
  @state() private _gridEditing = false;
  @state() private _gridDraft?: GridLayout;
  @state() private _pickerOpen = false;
  @state() private _buttonSheet?: string;

  // long-press tooltip for header icons on touch (PC gets the native title)
  @state() private _tip?: string;
  private _tipTimer?: ReturnType<typeof setTimeout>;
  private _tipShown = false;

  // Modals opened from pointerup get a synthetic click ~immediately after
  // (touch); the backdrop must not treat that ghost click as "close".
  private _modalOpenedAt = 0;
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
    this._hass = hass;
    if (!this._fetchStarted && this._config) {
      this._fetchStarted = true;
      void this._initialize();
    }
  }

  public setConfig(config: RemoteMapperCardConfig): void {
    this._config = config;
    this._entryId = config.entry_id;
    this._fetchStarted = false;
    this._cancelGridEdit();
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
    return { layout: "grid", display: "normal" };
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
      await this._subscribe();
    } catch (err) {
      this._error = String(err);
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
      this._error = String(err);
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
          archived: !!slot?.archived,
          summary: this._slotSummary(slot),
          error: slot?.last_error ?? null,
          stale: stale.has(a.action_id),
        };
      }
    }
    return out;
  }

  private _enterGridEdit = (): void => {
    if (!this._remote) return;
    this._gridDraft = normalizeGrid(
      this._remote.grid_layout,
      this._remote.buttons ?? []
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
          this._gridDraft = normalizeGrid(this._gridDraft, this._remote.buttons ?? []);
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
    this._pickerOpen = false;
    this._buttonSheet = undefined;
  };

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
        grid_layout: draft,
      });
      this._cancelGridEdit();
    } catch (err) {
      this.notify(`Layout save failed: ${String(err)}`);
    }
  }

  private _onGridPicked = (e: CustomEvent<{ rows: number; cols: number }>): void => {
    const draft = this._gridDraft;
    if (!draft || !this._remote) return;
    this._gridDraft = resizeGrid(
      draft,
      e.detail.rows,
      e.detail.cols,
      this._remote.buttons ?? []
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
      this._error = String(err);
    }
  }

  /** User name if set, else a name inferred from the sequence (naming.ts). */
  private _slotSummary(slot: SlotRecord | undefined): string {
    if (!slot) return "unassigned";
    if (slot.name) return slot.name;
    if (slot.materialized) return "automation";
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
    this._quickOption = quick.option;
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
          this._editorTab = "yaml";
        }
      });
    }
  }

  private _closeEditor(): void {
    this._editingAction = undefined;
    this._draftError = undefined;
    this._editingLive = undefined;
    this._clearArtifacts = undefined;
  }

  private async _saveDraft(): Promise<void> {
    const msg: Record<string, unknown> = {
      type: "remote_mapper/save_slot",
      entry_id: this._entryId,
      action_id: this._editingAction,
      materialized: this._draftMaterialized,
      name: this._draftName.trim() || null,
    };
    if (this._editorTab === "quick") {
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
    try {
      await this._hass!.callWS(msg);
      this._closeEditor();
    } catch (err) {
      this._draftError = (err as { message?: string }).message ?? String(err);
    }
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
    await this._hass!.callWS({
      type: "remote_mapper/archive_slot",
      entry_id: this._entryId,
      action_id: this._editingAction,
      archived: !slot.archived,
    });
    this._closeEditor();
  }

  // ── import wizard ──────────────────────────────────────────────────

  private async _openImport(): Promise<void> {
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
      this._error = String(err);
    }
  }

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
            ? html`<p>
                No remotes configured yet — add one in Settings → Devices &amp;
                services.
              </p>`
            : html`<p>
                  Several remotes exist — set <code>entry_id</code> in the card
                  config:
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

    const editing = this._edit.active;
    return html`
      <ha-card>
        <div class="header">
          ${this._renderTitle()}
          <span class="header-buttons">
            ${editing
              ? html`
                  ${this._iconButton("mdi:refresh", "Look for new actions (press the buttons first)", () => void this._refreshActions())}
                  ${this._iconButton("mdi:import", "Import existing automations", this._openImport)}
                  ${this._iconButton("mdi:undo", "Undo", () => this._edit.undo(), {
                    disabled: !this._edit.canUndo,
                  })}
                  ${this._iconButton("mdi:close", "Cancel (Esc)", () => this._edit.cancel())}
                  ${this._iconButton("mdi:check", "Done — save layout", () => void this._edit.done(), {
                    active: true,
                  })}
                `
              : this._iconButton("mdi:pencil", "Edit layout & slots", this._enterEdit)}
          </span>
        </div>
        ${this._renderTip()}
        ${this._renderCanvas(editing)}
        ${this._editingAction !== undefined ? this._renderEditor() : nothing}
        ${this._importScan ? this._renderImport() : nothing}
      </ha-card>
    `;
  }

  private _renderGridCard(): TemplateResult {
    const remote = this._remote!;
    const editing = this._gridEditing;
    const layout = this._gridLayout()!;
    const buttons = remote.buttons ?? [];
    return html`
      <ha-card>
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
                  ${this._iconButton("mdi:close", "Cancel", this._cancelGridEdit)}
                  ${this._iconButton("mdi:check", "Done — save layout", () => void this._saveGridEdit(), {
                    active: true,
                  })}
                `
              : this._iconButton("mdi:pencil", "Edit layout & slots", this._enterGridEdit)}
          </span>
        </div>
        ${this._renderTip()}
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
          ? html`<p class="hint grid-hint">
              Drag a button onto another cell to swap · tap a button to
              rename it or edit its events
            </p>`
          : nothing}
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
          @edit-action=${(e: CustomEvent<{ actionId: string }>) =>
            void this._openEditor(e.detail.actionId)}
          @open-button=${(e: CustomEvent<{ buttonId: string }>) => {
            this._buttonSheet = e.detail.buttonId;
            this._modalOpenedAt = Date.now();
          }}
          @layout-changed=${(e: CustomEvent<{ layout: GridLayout }>) => {
            this._gridDraft = e.detail.layout;
          }}
        ></remote-mapper-grid>
        ${buttons.length === 0
          ? html`<p class="hint grid-hint">
              No actions known yet — press each button on the remote once.
            </p>`
          : nothing}
        ${this._buttonSheet !== undefined ? this._renderButtonSheet() : nothing}
        ${this._editingAction !== undefined ? this._renderEditor() : nothing}
        ${this._importScan ? this._renderImport() : nothing}
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
    return html`<ha-icon-button
      class=${opts.active ? "active" : ""}
      .label=${title}
      title=${title}
      ?disabled=${opts.disabled}
      @pointerdown=${(e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        clearTimer();
        this._tipShown = false;
        this._tipTimer = setTimeout(() => {
          this._tipTimer = undefined;
          this._tipShown = true;
          this._tip = title;
        }, 450);
      }}
      @pointerup=${clearTimer}
      @pointercancel=${clearTimer}
      @pointerleave=${clearTimer}
      @contextmenu=${(e: Event) => {
        if (this._tipShown) e.preventDefault();
      }}
      @click=${(e: Event) => {
        if (this._tipShown) {
          // the long press was a "what is this?" — not a command
          e.stopPropagation();
          this._tipShown = false;
          setTimeout(() => {
            this._tip = undefined;
          }, 1200);
          return;
        }
        onClick(e);
      }}
    >
      <ha-icon icon=${icon}></ha-icon>
    </ha-icon-button>`;
  }

  private _renderTip(): TemplateResult | typeof nothing {
    return this._tip ? html`<div class="tip">${this._tip}</div>` : nothing;
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
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
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
                      this._gridDraft = setButtonLabel(
                        this._gridDraft,
                        button.id,
                        (e.target as HTMLInputElement).value
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
                  <span class="ev-icon" title=${KIND_TITLE[a.kind]}
                    >${KIND_ICON[a.kind]}</span
                  >
                  <span class="ev-name">${a.event}</span>
                  <span class="ev-summary">${view?.summary ?? "unassigned"}</span>
                  ${this._iconButton("mdi:play", "Run now", () => void this._runSlot(a.action_id), {
                    disabled: !view?.assigned || !!view.archived,
                  })}
                  ${this._iconButton("mdi:pencil", "Edit", () => void this._openEditor(a.action_id))}
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
        ${editing ? this._renderEditChrome() : nothing}
      </div>
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
          ? html`<span class="tile-badge">archived</span>`
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

  private _renderEditChrome(): TemplateResult {
    const sel = this._edit.selected;
    const t = this._transform()!;
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
      ${sel ? this._renderChipbar(sel, t) : nothing}
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
    return html`
      <div class="modal-backdrop" @click=${this._backdropClick(this._closeEditor)}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive
            ? html`<p class="hint">
                Linked to <b>${this._editingLive.alias}</b> —
                <a href=${this._editingLive.edit_url}>Edit in HA</a>. Unticking
                "automation" below deletes it on Save and moves its actions into
                this card. Cancel keeps things as they are.
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
          <label class="hint row">
            <input
              type="checkbox"
              .checked=${this._draftMaterialized}
              @change=${(e: Event) => {
                this._draftMaterialized = (e.target as HTMLInputElement).checked;
              }}
            />
            Create as automation (editable/traceable in HA)
          </label>
          ${this._draftError
            ? html`<p class="error">${this._draftError}</p>`
            : nothing}
          <div class="buttons">
            <button @click=${this._saveDraft}>Save</button>
            <button @click=${this._closeEditor}>Cancel</button>
            <button
              title="Capture the current room state as a scene on this button"
              @click=${() => this._snapshot(false)}
            >
              📸 Snapshot
            </button>
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
                  <button class="danger" @click=${() => this._clearSlot()}>
                    Clear
                  </button>
                  <button @click=${this._toggleArchived}>
                    ${slot.archived ? "Unarchive" : "Archive"}
                  </button>
                `
              : nothing}
          </div>
          ${this._clearArtifacts ? this._renderClearDialog() : nothing}
        </div>
      </div>
    `;
  }

  /** What the name will be if left empty — inferred from the current draft. */
  private _autoNamePlaceholder(): string {
    let sequence: unknown[] = [];
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
    const schema: Array<Record<string, unknown>> = [
      {
        name: "mode",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "scene", label: "Activate scene" },
              { value: "toggle", label: "Toggle entity" },
              { value: "script", label: "Run script" },
              { value: "wled_preset", label: "Set WLED preset" },
            ],
          },
        },
      },
    ];
    if (this._quickMode === "wled_preset") {
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
    } else {
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
    return html`
      <ha-form
        .hass=${this._hass}
        .data=${{
          mode: this._quickMode,
          entity: this._quickEntity,
          option: this._quickOption,
        }}
        .schema=${schema}
        .computeLabel=${(s: { name: string }) =>
          s.name === "mode"
            ? "Action"
            : s.name === "option"
              ? "Preset"
              : "Entity"}
        @value-changed=${(e: CustomEvent) => {
          const value = e.detail.value as {
            mode: QuickMode;
            entity: string;
            option?: string;
          };
          if (value.mode !== this._quickMode) {
            this._quickMode = value.mode;
            this._quickEntity = "";
            this._quickOption = "";
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
                  Selected slots take over; source automations are
                  <b>disabled</b>, not deleted.
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
                          ${p.conflict
                            ? html`<span class="warn">(overwrites slot)</span>`
                            : nothing}
                          ${p.mixed
                            ? html`<span class="warn"
                                >(mixed remotes — source stays enabled)</span
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
            ? html`<label class="hint">
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
    .tip {
      margin: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border-radius: var(--ha-border-radius-md, 8px);
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.2));
      color: var(--primary-text-color);
      font-size: var(--ha-font-size-m, 14px);
      text-align: right;
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
      position: absolute;
      right: 8px;
      bottom: 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      z-index: 20;
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
      padding: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
      margin: 0;
    }
    .event-list {
      list-style: none;
      margin: var(--ha-space-2, 8px) 0;
      padding: 0;
    }
    .event-list li {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-1, 4px) 0;
      border-bottom: 1px solid var(--divider-color, #444);
      opacity: 0.6;
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
    .import-list {
      margin: 4px 0 8px;
      padding-left: 18px;
      font-size: 0.85em;
    }
    .import-list li {
      margin: 2px 0;
    }
    .warn {
      color: var(--warning-color, #ffa600);
      font-size: 0.85em;
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
    .modal h3 {
      margin: 0 0 var(--ha-space-2, 8px);
      font-size: var(--ha-font-size-xl, 20px);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    textarea {
      width: 100%;
      min-height: 160px;
      font-family: var(--code-font-family, monospace);
      font-size: 0.85em;
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
  `%c REMOTE-MAPPER-CARD %c grid `,
  "color: white; background: #3f51b5; font-weight: 700;",
  "color: #3f51b5; background: white; font-weight: 700;"
);
