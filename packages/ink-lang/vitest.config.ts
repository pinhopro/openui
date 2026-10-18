import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
    environment: "node",
    env: {
      // Ink colors frames only when the terminal supports color; tests assert on styles.
      FORCE_COLOR: "1",
    },
  },
});
