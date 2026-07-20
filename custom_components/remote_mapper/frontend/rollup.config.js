import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const production = process.env.BUILD === "production";

export default {
  input: "src/remote-mapper-card.ts",
  output: {
    file: "../www/remote-mapper-card.js",
    format: "es",
    sourcemap: !production,
  },
  plugins: [
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
