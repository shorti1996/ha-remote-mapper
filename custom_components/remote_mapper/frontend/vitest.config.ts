// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
import { defineConfig } from "vitest/config";

// Default: pure-module tests in node (HA frontend convention: logic lives
// outside the Lit elements). Element tests opt into happy-dom per file
// with a `// @vitest-environment happy-dom` docblock — see
// test/remote-grid.test.ts for the tap-semantics suite.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
