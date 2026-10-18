import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  platform: "node",
  outDir: "dist",
  clean: true,
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
});
