/**
 * Remote Mapper Card — M0 stub.
 *
 * Proves the full chain: integration static path → Lovelace resource →
 * card element → WS handshake with the backend. The real card (canvas
 * layout, slot tiles, editor) lands in M2/M6.
 */
import { css, html, LitElement, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

const CARD_TAG = "remote-mapper-card";

interface HomeAssistant {
  callWS<T>(msg: { type: string }): Promise<T>;
}

interface RemoteMapperCardConfig {
  type: string;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

@customElement(CARD_TAG)
export class RemoteMapperCard extends LitElement {
  @state() private _backendVersion?: string;
  @state() private _error?: string;

  private _hass?: HomeAssistant;
  private _pinged = false;

  public set hass(hass: HomeAssistant) {
    this._hass = hass;
    if (!this._pinged) {
      this._pinged = true;
      void this._ping();
    }
  }

  public setConfig(_config: RemoteMapperCardConfig): void {
    // No config yet — M2 adds entry selection.
  }

  public getCardSize(): number {
    return 2;
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  private async _ping(): Promise<void> {
    try {
      const result = await this._hass!.callWS<{ version: string }>({
        type: "remote_mapper/ping",
      });
      this._backendVersion = result.version;
    } catch (err) {
      this._error = String(err);
    }
  }

  protected override render() {
    return html`
      <ha-card header="Remote Mapper">
        <div class="content">
          ${this._error
            ? html`<p class="error">Backend unreachable: ${this._error}</p>`
            : this._backendVersion
              ? html`<p>Connected to backend v${this._backendVersion}.</p>`
              : html`<p>Connecting…</p>`}
          ${nothing}
        </div>
      </ha-card>
    `;
  }

  static override styles = css`
    .content {
      padding: 0 16px 16px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
  `;
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Remote Mapper Card",
  description: "Map physical remote buttons to actions (M0 stub).",
  preview: false,
});

console.info(
  `%c REMOTE-MAPPER-CARD %c M0 stub `,
  "color: white; background: #3f51b5; font-weight: 700;",
  "color: #3f51b5; background: white; font-weight: 700;"
);
