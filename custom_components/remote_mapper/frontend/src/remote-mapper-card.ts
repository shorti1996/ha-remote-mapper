/**
 * Remote Mapper Card — v0.
 *
 * Auto-grid of slot tiles from the remote's probed layout. View-mode tap
 * fires the bound sequence (test from the couch); edit mode (pencil)
 * opens a YAML/JSON editor per slot. The canvas layout engine and the
 * ha-form editor tiers land in M6.
 *
 * Gesture namespace note: an on-screen tap is a DASHBOARD gesture that
 * runs the bound sequence — it is not the physical remote event.
 */
import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

const CARD_TAG = "remote-mapper-card";
const UPDATED_EVENT = "remote_mapper_updated";

interface HassConnection {
  subscribeEvents<T>(
    callback: (event: T) => void,
    eventType: string
  ): Promise<() => void>;
}

interface HomeAssistant {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  connection: HassConnection;
}

interface RemoteMapperCardConfig {
  type: string;
  entry_id?: string;
}

interface SlotRecord {
  sequence: unknown[];
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
  card_layout: unknown;
  slots: Record<string, SlotRecord>;
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

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

@customElement(CARD_TAG)
export class RemoteMapperCard extends LitElement {
  @state() private _remote?: RemoteData;
  @state() private _remoteChoices?: RemoteListItem[];
  @state() private _error?: string;
  @state() private _editMode = false;
  @state() private _editingAction?: string;
  @state() private _draft = "";
  @state() private _draftError?: string;
  @state() private _draftMaterialized = false;
  @state() private _editingLive?: LiveAutomation;
  @state() private _clearArtifacts?: Record<string, unknown>;
  @state() private _clearRemember = false;
  @state() private _flash?: string;
  @state() private _importScan?: ImportScan;
  @state() private _importSelected: Set<number> = new Set();
  @state() private _importOverwrite = false;
  @state() private _importBusy = false;
  @state() private _importError?: string;

  private _hass?: HomeAssistant;
  private _config?: RemoteMapperCardConfig;
  private _entryId?: string;
  private _unsubEvents?: () => void;
  private _fetchStarted = false;

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
    if (this._hass) {
      this._fetchStarted = true;
      void this._initialize();
    }
  }

  public getCardSize(): number {
    const actions = this._remote?.layout?.actions?.length ?? 4;
    return 1 + Math.ceil(actions / this._columns());
  }

  public getGridOptions(): Record<string, unknown> {
    return { columns: 12, min_columns: 6 };
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubEvents?.();
    this._unsubEvents = undefined;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    if (this._fetchStarted && !this._unsubEvents) {
      void this._subscribe();
    }
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
      if (event.data.entry_id === this._entryId) {
        void this._fetchRemote();
      }
    }, UPDATED_EVENT);
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

  private _columns(): number {
    const n = this._remote?.layout?.actions?.length ?? 4;
    return Math.max(2, Math.ceil(Math.sqrt(n)));
  }

  private _slotSummary(slot: SlotRecord | undefined): string {
    if (!slot) return "unassigned";
    if (slot.materialized) return `automation: ${slot.automation_id ?? "?"}`;
    const first = slot.sequence?.[0] as Record<string, unknown> | undefined;
    if (!first) return "empty sequence";
    const action = (first.action ?? first.service) as string | undefined;
    return action ?? Object.keys(first)[0] ?? "sequence";
  }

  private async _onTileTap(actionId: string): Promise<void> {
    if (this._editMode) {
      this._openEditor(actionId);
      return;
    }
    const slot = this._remote?.slots[actionId];
    if (!slot || slot.archived) return;
    this._flash = actionId;
    setTimeout(() => {
      this._flash = undefined;
    }, 400);
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

  private _openEditor(actionId: string): void {
    const slot = this._remote?.slots[actionId];
    this._editingAction = actionId;
    this._draft = JSON.stringify(slot?.sequence ?? [], null, 2);
    this._draftError = undefined;
    this._draftMaterialized = slot?.materialized ?? false;
    this._editingLive = undefined;
    if (slot?.materialized) {
      // The automation is canonical — fetch its current actions so a
      // dematerialize save folds the live version back in (draft-only
      // until Save; Cancel is a true no-op).
      void this._hass!.callWS<{ slot: SlotRecord; live: LiveAutomation | null }>(
        {
          type: "remote_mapper/get_slot",
          entry_id: this._entryId,
          action_id: actionId,
        }
      ).then((res) => {
        if (this._editingAction === actionId && res.live) {
          this._editingLive = res.live;
          this._draft = JSON.stringify(res.live.actions ?? [], null, 2);
        }
      });
    }
  }

  private _closeEditor(): void {
    this._editingAction = undefined;
    this._draftError = undefined;
    this._editingLive = undefined;
  }

  private async _saveDraft(): Promise<void> {
    try {
      await this._hass!.callWS({
        type: "remote_mapper/save_slot",
        entry_id: this._entryId,
        action_id: this._editingAction,
        sequence_yaml: this._draft,
        materialized: this._draftMaterialized,
      });
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
      ...(decision
        ? { decision, remember: this._clearRemember }
        : {}),
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
    const proposals = scan.proposals.filter((_, i) =>
      this._importSelected.has(i)
    );
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
            ? html`<p>No remotes configured yet — add one in Settings →
                Devices &amp; services.</p>`
            : html`<p>Several remotes exist — set <code>entry_id</code> in the
                  card config:</p>
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

    const actions = this._remote.layout?.actions ?? [];
    return html`
      <ha-card>
        <div class="header">
          <span class="title">${this._remote.title}</span>
          <span class="header-buttons">
            ${this._editMode
              ? html`<button
                  class="pencil"
                  title="Import existing automations"
                  @click=${this._openImport}
                >
                  ⇪
                </button>`
              : nothing}
            <button
              class="pencil ${this._editMode ? "active" : ""}"
              title=${this._editMode ? "Done" : "Edit slots"}
              @click=${() => {
                this._editMode = !this._editMode;
              }}
            >
              ${this._editMode ? "✓" : "✎"}
            </button>
          </span>
        </div>
        <div
          class="grid"
          style="grid-template-columns: repeat(${this._columns()}, 1fr)"
        >
          ${actions.map((actionId) => this._renderTile(actionId))}
        </div>
        ${this._editingAction !== undefined ? this._renderEditor() : nothing}
        ${this._importScan ? this._renderImport() : nothing}
      </ha-card>
    `;
  }

  private _renderImport() {
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
                    this._importOverwrite = (
                      e.target as HTMLInputElement
                    ).checked;
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

  private _renderTile(actionId: string) {
    const slot = this._remote!.slots[actionId];
    const classes = [
      "tile",
      slot ? "assigned" : "empty",
      slot?.archived ? "archived" : "",
      this._flash === actionId ? "flash" : "",
      this._editMode ? "editable" : "",
    ].join(" ");
    return html`
      <button class=${classes} @click=${() => this._onTileTap(actionId)}>
        <span class="action">${actionId}</span>
        <span class="summary">${this._slotSummary(slot)}</span>
        ${slot?.last_error
          ? html`<span class="badge error-badge" title=${slot.last_error}
              >!</span
            >`
          : nothing}
        ${slot?.archived
          ? html`<span class="badge">archived</span>`
          : nothing}
      </button>
    `;
  }

  private _renderEditor() {
    const slot = this._remote!.slots[this._editingAction!];
    return html`
      <div class="modal-backdrop" @click=${this._closeEditor}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <h3>${this._editingAction}</h3>
          ${this._editingLive
            ? html`<p class="hint">
                Linked to <b>${this._editingLive.alias}</b> —
                <a href=${this._editingLive.edit_url}>Edit in HA</a>. Unticking
                "automation" below deletes it on Save and moves its actions
                into this card. Cancel keeps things as they are.
              </p>`
            : html`<p class="hint">
                Sequence (YAML or JSON) — same format as automation actions.
              </p>`}
          <label class="hint">
            <input
              type="checkbox"
              .checked=${this._draftMaterialized}
              @change=${(e: Event) => {
                this._draftMaterialized = (
                  e.target as HTMLInputElement
                ).checked;
              }}
            />
            Create as automation (editable/traceable in HA)
          </label>
          <textarea
            .value=${this._draft}
            spellcheck="false"
            @input=${(e: Event) => {
              this._draft = (e.target as HTMLTextAreaElement).value;
            }}
          ></textarea>
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

  private _renderClearDialog() {
    const artifacts = this._clearArtifacts!;
    const parts: string[] = [];
    if (artifacts.scene) {
      parts.push(
        `scene ${(artifacts.scene as { entity_id?: string }).entity_id ?? ""}`
      );
    }
    if (artifacts.automation) {
      parts.push("its automation");
    }
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

  static override styles = css`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 0;
    }
    .title {
      font-size: 1.2em;
      font-weight: 500;
    }
    .pencil {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1em;
      color: var(--secondary-text-color);
      padding: 4px 8px;
    }
    .pencil.active {
      color: var(--primary-color);
    }
    .header-buttons {
      display: flex;
      align-items: center;
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
    .content {
      padding: 0 16px 16px;
    }
    .grid {
      display: grid;
      gap: 8px;
      padding: 12px 16px 16px;
    }
    .tile {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-height: 64px;
      padding: 8px 4px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #444);
      background: var(--card-background-color, inherit);
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
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
    .tile.editable {
      border-style: dotted;
    }
    .action {
      font-weight: 500;
      font-size: 0.95em;
    }
    .summary {
      font-size: 0.75em;
      color: var(--secondary-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.65em;
      color: var(--secondary-text-color);
    }
    .error-badge {
      color: var(--error-color, #db4437);
      font-weight: 700;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .modal {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      padding: 16px;
      width: min(520px, 92vw);
      max-height: 84vh;
      overflow: auto;
      box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.4));
    }
    .modal h3 {
      margin: 0 0 4px;
    }
    .hint {
      margin: 0 0 8px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    textarea {
      width: 100%;
      min-height: 180px;
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
      gap: 8px;
      margin-top: 12px;
    }
    .buttons button {
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #444);
      background: none;
      color: var(--primary-text-color);
      cursor: pointer;
      font: inherit;
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
  description: "Map physical remote buttons to actions.",
  preview: false,
});

console.info(
  `%c REMOTE-MAPPER-CARD %c v0 `,
  "color: white; background: #3f51b5; font-weight: 700;",
  "color: #3f51b5; background: white; font-weight: 700;"
);
