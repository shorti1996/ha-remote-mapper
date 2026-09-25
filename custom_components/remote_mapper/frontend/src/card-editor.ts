// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
/**
 * Lovelace config editor for the card (static getConfigElement). One
 * ha-form: remote picker (from list_remotes), layout kind, display mode,
 * mode-specific options, and appearance (colors, opacity).
 * Unknown keys (HA's own grid_options, visibility, …) are preserved.
 */
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ensureHaForm } from "./canvas/ha-loader";
import { resetTips, tipsSeen } from "./onboarding";
import {
  applyEditorValue,
  ASSISTED_TRIGGERS,
  AUTO_REMOTE,
  CHIPS_LAYOUTS,
  COLOR_KEYS,
  DISPLAY_MODES,
  displayOf,
  editorValue,
  LAYOUT_KINDS,
  layoutOf,
  type RemoteMapperCardConfig,
  trimConfigStrings,
} from "./config";

const LABELS: Record<string, string> = {
  entry_id: "Remote",
  title: "Title",
  show_title: "Show title",
  layout: "Layout",
  display: "Display mode",
  assisted_trigger: "Popover opens on",
  chips_layout: "Event chips",
  hide_unset: "Hide events that are not set",
  button_color: "Button color",
  accent_color: "Accent color",
  text_color: "Text color",
  button_opacity: "Button opacity",
};

const HELPERS: Record<string, string> = {
  title: "Empty = the remote's name.",
  hide_unset: "Edit mode (pencil) still shows them, so you can assign one.",
  button_color: "Pad background. Turn the switch off to use the theme.",
  accent_color: "Borders, assigned marks, flashes. Off = theme primary color.",
  text_color: "Off = theme text color.",
  button_opacity: "Pad background only; text stays readable.",
};

interface HassLike {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
}

interface RemoteListItem {
  entry_id: string;
  title: string;
}

/** Remembered per-remote choices (remote_mapper/get_options). */
interface RemoteOptions {
  cleanup_policy: "ask" | "always_delete" | "never_delete";
  snapshot_entities: string[];
}

const POLICY_TEXT: Record<RemoteOptions["cleanup_policy"], string> = {
  ask: "asks each time",
  always_delete: "always deletes",
  never_delete: "never deletes",
};

const dropdown = (options: unknown) => ({ select: { mode: "dropdown", options } });

@customElement("remote-mapper-card-editor")
export class RemoteMapperCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HassLike;

  @state() private _config?: RemoteMapperCardConfig;
  @state() private _remotes?: RemoteListItem[];
  @state() private _formOk = false;
  private _fetching = false;
  // Reset section: the remote's remembered choices + this browser's tips
  @state() private _options?: RemoteOptions;
  @state() private _tipsRev = 0;
  private _optionsFor?: string;

  public setConfig(config: RemoteMapperCardConfig): void {
    this._config = config;
  }

  /** The remote this card shows: its entry_id, or the only one there is. */
  private _entryId(): string | undefined {
    if (this._config?.entry_id) return this._config.entry_id;
    return this._remotes?.length === 1 ? this._remotes[0].entry_id : undefined;
  }

  private _fetchOptions(): void {
    const entryId = this._entryId();
    if (!this.hass || !entryId || entryId === this._optionsFor) return;
    this._optionsFor = entryId;
    this._options = undefined;
    void this.hass
      .callWS<RemoteOptions>({ type: "remote_mapper/get_options", entry_id: entryId })
      .then((res) => {
        if (this._optionsFor === entryId) this._options = res;
      })
      .catch(() => {
        /* no backend for this remote — the section stays hidden */
      });
  }

  private async _reset(what: "cleanup_policy" | "snapshot_entities"): Promise<void> {
    const entryId = this._entryId();
    if (!this.hass || !entryId) return;
    try {
      await this.hass.callWS({
        type: "remote_mapper/reset_options",
        entry_id: entryId,
        [what]: true,
      });
      this._optionsFor = undefined;
      this._fetchOptions();
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("hass-notification", {
          detail: { message: `Reset failed: ${(err as { message?: string }).message ?? String(err)}` },
        })
      );
    }
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    void ensureHaForm().then((ok) => {
      this._formOk = ok;
    });
  }

  protected override willUpdate(): void {
    if (this.hass && !this._remotes && !this._fetching) {
      this._fetching = true;
      void this.hass
        .callWS<{ remotes: RemoteListItem[] }>({ type: "remote_mapper/list_remotes" })
        .then((res) => {
          this._remotes = res.remotes;
        })
        .catch(() => {
          this._remotes = [];
        });
    }
    this._fetchOptions();
  }

  /** Forget remembered choices; each button says what it undoes. */
  private _renderReset() {
    const options = this._options;
    const seen = tipsSeen();
    void this._tipsRev;
    if (!options && !seen) return nothing;
    return html`
      <div class="reset">
        <p class="hint reset-title">Start over</p>
        ${options
          ? html`
              <div class="reset-row">
                <span class="hint">
                  Deleting a scene or automation the card created:
                  <b>${POLICY_TEXT[options.cleanup_policy]}</b>
                </span>
                <button
                  ?disabled=${options.cleanup_policy === "ask"}
                  @click=${() => void this._reset("cleanup_policy")}
                >
                  Ask again
                </button>
              </div>
              <div class="reset-row">
                <span class="hint">
                  Default entities for <i>Scene from current state</i>:
                  <b>${options.snapshot_entities.length ? options.snapshot_entities.length : "none"}</b>
                </span>
                <button
                  ?disabled=${!options.snapshot_entities.length}
                  @click=${() => void this._reset("snapshot_entities")}
                >
                  Forget
                </button>
              </div>
            `
          : nothing}
        <div class="reset-row">
          <span class="hint">
            Tips at the top of the card, in this browser:
            <b>${seen ? "seen" : "showing"}</b>
          </span>
          <button
            ?disabled=${!seen}
            @click=${() => {
              resetTips();
              this._tipsRev++;
            }}
          >
            Show again
          </button>
        </div>
      </div>
    `;
  }

  protected override render() {
    const config = this._config;
    if (!config) return nothing;
    if (!this._formOk) {
      return html`<p class="hint">Loading editor components…</p>`;
    }
    const display = displayOf(config);
    const schema: Array<Record<string, unknown>> = [
      {
        name: "entry_id",
        selector: dropdown([
          { value: AUTO_REMOTE, label: "Auto (the only remote)" },
          ...(this._remotes ?? []).map((r) => ({ value: r.entry_id, label: r.title })),
        ]),
      },
      { name: "title", selector: { text: {} } },
      { name: "show_title", selector: { boolean: {} } },
      { name: "layout", selector: dropdown(LAYOUT_KINDS) },
      { name: "display", selector: dropdown(DISPLAY_MODES) },
    ];
    if (display === "assisted") {
      schema.push({ name: "assisted_trigger", selector: dropdown(ASSISTED_TRIGGERS) });
    }
    if (display === "all") {
      schema.push({ name: "chips_layout", selector: dropdown(CHIPS_LAYOUTS) });
      schema.push({ name: "hide_unset", selector: { boolean: {} } });
    }
    // Native color picker (HA color_rgb selector) behind an on/off switch so
    // "use the theme" stays expressible; YAML may still hold any CSS color.
    for (const key of COLOR_KEYS) {
      schema.push({ name: `${key}_set`, selector: { boolean: {} } });
      if (config[key]) schema.push({ name: key, selector: { color_rgb: {} } });
    }
    schema.push({
      name: "button_opacity",
      selector: { number: { min: 0.1, max: 1, step: 0.05, mode: "slider" } },
    });
    const data = editorValue(config);
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${(s: { name: string }) =>
          s.name.endsWith("_set")
            ? `Custom ${LABELS[s.name.slice(0, -4)].toLowerCase()}`
            : (LABELS[s.name] ?? s.name)}
        .computeHelper=${(s: { name: string }) =>
          s.name === "display" && layoutOf(config) === "canvas"
            ? "Ignored for the canvas layout (every tile is already visible)."
            : (HELPERS[s.name] ?? "")}
        @value-changed=${this._changed}
        @focusout=${this._trimOnBlur}
      ></ha-form>
      ${this._renderReset()}
    `;
  }

  private _changed = (e: CustomEvent): void => {
    e.stopPropagation();
    this._emit(applyEditorValue(this._config!, e.detail.value as Record<string, unknown>));
  };

  /** Leaving a text field (or clicking Save, which blurs it) trims it. */
  private _trimOnBlur = (): void => {
    const next = trimConfigStrings(this._config!);
    if (next !== this._config) this._emit(next);
  };

  private _emit(next: RemoteMapperCardConfig): void {
    this._config = next;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: next },
        bubbles: true,
        composed: true,
      })
    );
  }

  static override styles = css`
    .hint {
      font-size: var(--ha-font-size-m, 14px);
      color: var(--secondary-text-color);
    }
    .reset {
      margin-top: var(--ha-space-4, 16px);
      padding-top: var(--ha-space-3, 12px);
      border-top: 1px solid var(--divider-color, #444);
    }
    .reset-title {
      margin: 0 0 var(--ha-space-2, 8px);
      color: var(--primary-text-color);
      font-weight: var(--ha-font-weight-medium, 500);
    }
    .reset-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3, 12px);
      min-height: var(--ha-space-10, 40px);
    }
    .reset-row .hint {
      flex: 1;
      line-height: var(--ha-line-height-normal, 1.6);
    }
    .reset-row button {
      flex: none;
      min-height: var(--ha-space-9, 36px);
      padding: var(--ha-space-1, 4px) var(--ha-space-3, 12px);
      border: 1px solid var(--primary-color);
      border-radius: var(--ha-border-radius-md, 8px);
      background: transparent;
      color: var(--primary-color);
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      cursor: pointer;
    }
    .reset-row button:disabled {
      border-color: var(--divider-color, #444);
      color: var(--secondary-text-color);
      opacity: 0.6;
      cursor: default;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "remote-mapper-card-editor": RemoteMapperCardEditor;
  }
}
