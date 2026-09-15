import { defineConfig } from "vitest/config";

// Pure-module tests only (HA frontend convention): logic lives outside the
// Lit elements and is tested in node; the elements are exercised in the
// dev HA. Add environment: "happy-dom" per-file if an element test is ever
// needed.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
