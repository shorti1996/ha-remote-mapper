/**
 * Vendored from widget-canvas-ha src/editor/ha-loader.ts +
 * src/util/actions.ts loadHelpers (verbatim).
 *
 * HA lazy-loads its editor components (ha-form, selectors,
 * ha-yaml-editor) with the editor dialogs. Custom cards can force that
 * chunk in by instantiating a built-in card's config editor — the
 * standard boilerplate-card trick. Failed attempts are NOT cached so a
 * slow chunk load can retry.
 */

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<any>;
  }
}

let helpersPromise: Promise<any> | null = null;
export function loadHelpers(): Promise<any> {
  if (!helpersPromise) {
    helpersPromise = window.loadCardHelpers
      ? window.loadCardHelpers()
      : Promise.resolve(null);
  }
  return helpersPromise;
}

let formPromise: Promise<boolean> | null = null;
export function ensureHaForm(): Promise<boolean> {
  if (customElements.get("ha-form")) return Promise.resolve(true);
  if (!formPromise) {
    formPromise = (async () => {
      try {
        const helpers = await loadHelpers();
        const card = helpers?.createCardElement?.({ type: "entities", entities: [] });
        await card?.constructor?.getConfigElement?.();
      } catch {
        /* best effort */
      }
      // whenDefined never rejects — race it against a timeout
      const defined = await Promise.race([
        customElements.whenDefined("ha-form").then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), 2000)),
      ]);
      const ok = defined && !!customElements.get("ha-form");
      if (!ok) formPromise = null; // retry on next call
      return ok;
    })();
  }
  return formPromise;
}

let yamlPromise: Promise<boolean> | null = null;
/**
 * ha-yaml-editor parses YAML internally and fires value-changed with
 * {value, isValid}. Not guaranteed loadable outside the editor dialogs;
 * callers must handle false (fall back to a textarea).
 */
export function ensureYamlEditor(): Promise<boolean> {
  if (customElements.get("ha-yaml-editor")) return Promise.resolve(true);
  if (!yamlPromise) {
    yamlPromise = (async () => {
      try {
        const helpers = await loadHelpers();
        // conditional-card editor pulls hui-card-element-editor → ha-yaml-editor
        const card = helpers?.createCardElement?.({
          type: "conditional",
          conditions: [],
          card: { type: "entities", entities: [] },
        });
        await card?.constructor?.getConfigElement?.();
      } catch {
        /* best effort */
      }
      if (customElements.get("ha-yaml-editor")) return true;
      await new Promise((r) => setTimeout(r, 300));
      const ok = !!customElements.get("ha-yaml-editor");
      if (!ok) yamlPromise = null; // retry on next call
      return ok;
    })();
  }
  return yamlPromise;
}
