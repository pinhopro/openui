/** @jsxRuntime automatic @jsxImportSource react */
import { render } from "ink";
import { showcasePages } from "./showcase/pages";
import { ShowcaseApp } from "./showcase/showcase-app";
import { createShowcaseTools } from "./showcase/showcase-tools";

// Full-screen tour of every component: `pnpm run showcase`, or `--no-mouse`
// to keep the terminal's own text selection.
const mouse = !process.argv.includes("--no-mouse");

render(
  <ShowcaseApp
    pages={showcasePages}
    tools={createShowcaseTools({ latencyMs: 900, healthFailsFirst: true })}
    mouse={mouse}
    stream={{ chunkSize: 24, intervalMs: 12 }}
  />,
  { alternateScreen: true, exitOnCtrlC: true },
);
