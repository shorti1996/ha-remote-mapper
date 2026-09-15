/**
 * Lovelace config editor for the card (static getConfigElement). One
 * ha-form: remote picker (from list_remotes), layout kind, display mode.
 */
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { ensureHaForm } from "./canvas/ha-loader";
import {
  DISPLAY_MODES,
  displayOf,
  LAYOUT_KINDS,
  layoutOf,
  type RemoteMapperCardConfig,
} from "./config";

const AUTO = "__auto__";

interface HassLike {
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
}

interface RemoteListItem {
  entry_id: string;
  title: string;
}

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
    if (!this._config) return nothing;
    if (!this._formOk) {
      return html`<p class="hint">Loading editor components…</p>`;
    }
    const remotes = this._remotes ?? [];
    const schema = [
      {
        name: "entry_id",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: AUTO, label: "Auto (the only remote)" },
              ...remotes.map((r) => ({ value: r.entry_id, label: r.title })),
            ],
          },
        },
      },
      {
        name: "layout",
        selector: { select: { mode: "dropdown", options: LAYOUT_KINDS } },
      },
      {
        name: "display",
        selector: { select: { mode: "dropdown", options: DISPLAY_MODES } },
      },
    ];
    const data = {
      entry_id: this._config.entry_id || AUTO,
      layout: layoutOf(this._config),
      display: displayOf(this._config),
    };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${(s: { name: string }) =>
          s.name === "entry_id"
            ? "Remote"
            : s.name === "layout"
              ? "Layout"
              : "Display mode"}
        .computeHelper=${(s: { name: string }) =>
          s.name === "display" && layoutOf(this._config) === "canvas"
            ? "Ignored for the canvas layout (every tile is already visible)."
            : ""}
        @value-changed=${this._changed}
      ></ha-form>
    `;
  }

  private _changed = (e: CustomEvent): void => {
    e.stopPropagation();
    const value = e.detail.value as {
      entry_id?: string;
      layout?: string;
      display?: string;
    };
    const next: RemoteMapperCardConfig = { ...this._config!, type: this._config!.type };
    if (value.entry_id && value.entry_id !== AUTO) next.entry_id = value.entry_id;
    else delete next.entry_id;
    if (value.layout === "canvas") next.layout = "canvas";
    else delete next.layout;
    if (value.display && value.display !== "normal") {
      next.display = value.display as RemoteMapperCardConfig["display"];
    } else {
      delete next.display;
    }
    this._config = next;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: next },
        bubbles: true,
        composed: true,
      })
    );
  };

  static override styles = css`
    .hint {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "remote-mapper-card-editor": RemoteMapperCardEditor;
  }
}
