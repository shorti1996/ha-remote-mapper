import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "node:fs";

const production = process.env.BUILD === "production";
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));

/** Stamp package.json's version into the bundle (CARD_VERSION in src/version.ts). */
const cardVersion = () => ({
  name: "card-version",
  transform(code, id) {
    if (!id.endsWith("/src/version.ts")) return null;
    return { code: code.replace("__CARD_VERSION__", version), map: null };
  },
});

export default {
  input: "src/remote-mapper-card.ts",
  output: {
    file: "../www/remote-mapper-card.js",
    format: "es",
    sourcemap: !production,
  },
  plugins: [
    cardVersion(),
    resolve(),
    commonjs(),
    typescript(),
    production &&
      terser({
        format: { comments: false },
        compress: {
          pure_funcs: ["console.debug"],
        },
      }),
  ],
};
