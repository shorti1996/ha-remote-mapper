/**
 * Lovelace config editor for the card (static getConfigElement). One
 * ha-form: remote picker (from list_remotes), layout kind, display mode,
 * mode-specific options, and appearance (colors, opacity).
 * Unknown keys (HA's own grid_options, visibility, …) are preserved.
 */
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ensureHaForm } from "./canvas/ha-loader";
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
  button_color: "Button color",
  accent_color: "Accent color",
  text_color: "Text color",
  button_opacity: "Button opacity",
};

const HELPERS: Record<string, string> = {
  title: "Empty = the remote's name.",
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

const dropdown = (options: unknown) => ({ select: { mode: "dropdown", options } });

@customElement("remote-mapper-card-editor")
export class RemoteMapperCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HassLike;

  @state() private _config?: RemoteMapperCardConfig;
  @state() private _remotes?: RemoteListItem[];
  @state() private _formOk = false;
  private _fetching = false;

  public setConfig(config: RemoteMapperCardConfig): void {
    this._config = config;
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "remote-mapper-card-editor": RemoteMapperCardEditor;
  }
}
