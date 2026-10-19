import { Box, Text, type DOMElement } from "ink";
import { render } from "ink-testing-library";
import { useRef, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import { FocusScope } from "../../src/focus/focus-scope";
import { InkRenderer } from "../../src/ink-renderer";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import type { OverlayPlacement } from "../../src/overlay/overlay-placement";
import { useOverlay } from "../../src/overlay/use-overlay";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { renderProgram } from "../helpers/render-program";
import { renderTerminal } from "../helpers/render-terminal";
import { settle } from "../helpers/settle";

interface FloaterProps {
  label: string;
  hide?: boolean;
  placement?: string;
  detach?: boolean;
  hooked?: boolean;
  padded?: boolean;
  seeThrough?: boolean;
}

/** Overlay content that breaks the rule that `render` calls no hooks: it calls one. */
function HookedOverlay(): ReactNode {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <Box borderStyle="single">
      <Text>OVERLAY hooked</Text>
    </Box>
  );
}

/**
 * An anchor box with its label and, while not hidden, an overlay below it: a
 * bordered box (3 rows) reading "OVERLAY <label>". `detach` keeps the overlay
 * open but leaves its anchor ref unattached (a null anchor). `hooked` renders
 * `HookedOverlay` instead; `padded` gives the bordered box a padding of one
 * cell on every side (5 rows), cells the content itself never writes;
 * `seeThrough` opens the overlay with `opaque: false`.
 */
function FloaterRenderer({ props }: ComponentRenderProps<FloaterProps>) {
  const anchorRef = useRef<DOMElement | null>(null);
  const label = props.label;
  useOverlay({
    kind: "tooltip",
    anchorRef,
    placement: (props.placement ?? "bottom") as OverlayPlacement,
    gap: 0,
    isOpen: props.hide !== true,
    opaque: props.seeThrough !== true,
    render: props.hooked === true ? HookedOverlay : renderOverlay,
  });
  const padding = props.padded === true ? 1 : 0;
  function renderOverlay(): ReactNode {
    return (
      <Box borderStyle="single" padding={padding}>
        <Text>{`OVERLAY ${label}`}</Text>
      </Box>
    );
  }
  if (props.detach === true) {
    return (
      <Box>
        <Text>{label}</Text>
      </Box>
    );
  }
  return (
    <Box ref={anchorRef}>
      <Text>{label}</Text>
    </Box>
  );
}

const Floater = defineComponent({
  name: "Floater",
  description: "A label with a floating overlay under it",
  props: z.object({
    label: z.string(),
    hide: z.boolean().optional(),
    placement: z.string().optional(),
    detach: z.boolean().optional(),
    hooked: z.boolean().optional(),
    padded: z.boolean().optional(),
    seeThrough: z.boolean().optional(),
  }),
  component: FloaterRenderer,
});

const overlayLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Floater]),
});

const FILLER =
  'TextContent("filler one"), TextContent("filler two"), TextContent("filler three"), TextContent("filler four")';

/** A Floater, the row after it and some filler rows, stacked without gaps. */
function floaterProgram(floater: string): string {
  return `root = Stack([${floater}, TextContent("row after"), ${FILLER}], "column", "none")`;
}

/** The plain frame of a program. */
async function plainFrame(program: string): Promise<string> {
  const rendered = await renderProgram(overlayLibrary, program);
  const frame = stripAnsi(rendered.frame());
  rendered.unmount();
  return frame;
}

/** The character at a cell of a plain frame. */
function charAt(frame: string, x: number, y: number): string {
  const line = frame.split("\n")[y] ?? "";
  return Array.from(line)[x] ?? "";
}

describe("overlay host", () => {
  it("paints an overlay under its anchor without moving the rows after it", async () => {
    const closed = await plainFrame(floaterProgram('Floater("anchor", true)'));
    const open = await plainFrame(floaterProgram('Floater("anchor")'));
    const closedAnchor = findCell(closed, "anchor");
    const closedAfter = findCell(closed, "row after");
    expect(closedAfter.y).toBe(closedAnchor.y + 1);
    expect(closed).not.toContain("OVERLAY");

    const anchor = findCell(open, "anchor");
    expect(anchor).toEqual(closedAnchor);
    // The overlay's top border sits on the row after the anchor, from the anchor's column.
    expect(charAt(open, anchor.x, anchor.y + 1)).toBe("┌");
    // Its text sits on the row below, overwriting "filler one".
    expect(findCell(open, "OVERLAY anchor")).toEqual({ x: anchor.x + 1, y: anchor.y + 2 });
    expect(open).not.toContain("row after");
    expect(open).not.toContain("filler one");
    expect(charAt(open, anchor.x, anchor.y + 3)).toBe("└");
    // The layout below the overlay is unchanged.
    expect(findCell(open, "filler three")).toEqual(findCell(closed, "filler three"));
    expect(open.split("\n").length).toBe(closed.split("\n").length);
  });

  it("never draws an overlay before it is placed: no frame shows it over its anchor", async () => {
    const rendered = await renderProgram(overlayLibrary, floaterProgram('Floater("anchor", true)'));
    const closed = stripAnsi(rendered.frame());
    const anchor = findCell(closed, "anchor");
    const firstNew = rendered.instance.frames.length;
    await rendered.update({ response: floaterProgram('Floater("anchor")') });
    const frames = rendered.instance.frames.slice(firstNew).map(stripAnsi);
    expect(frames.length).toBeGreaterThan(0);
    const placed = { x: anchor.x + 1, y: anchor.y + 2 };
    for (const frame of frames) {
      if (frame.trim() === "") continue;
      // The anchor keeps its cells in every frame; the overlay shows only where it belongs.
      expect(frame.split("\n")[anchor.y]?.slice(anchor.x, anchor.x + 6)).toBe("anchor");
      if (frame.includes("OVERLAY anchor"))
        expect(findCell(frame, "OVERLAY anchor")).toEqual(placed);
    }
    expect(findCell(stripAnsi(rendered.frame()), "OVERLAY anchor")).toEqual(placed);
    rendered.unmount();
  });

  it("draws nothing for an overlay whose anchor is null", async () => {
    const closed = await plainFrame(floaterProgram('Floater("anchor", true)'));
    const detached = await plainFrame(floaterProgram('Floater("anchor", false, "bottom", true)'));
    expect(detached).not.toContain("OVERLAY");
    expect(detached).toBe(closed);
  });

  it("paints each overlay under its own anchor, the later one over the earlier", async () => {
    const row = 'Stack([Floater("first"), Floater("second")], "row", "none")';
    const frame = await plainFrame(`root = Stack([${row}, ${FILLER}], "column", "none")`);
    const first = findCell(frame, "first");
    const second = findCell(frame, "second");
    expect(second.y).toBe(first.y);
    expect(second.x).toBeGreaterThan(first.x);
    // The first overlay starts under its anchor; the second covers it from its own anchor's column.
    expect(charAt(frame, first.x, first.y + 1)).toBe("┌");
    expect(charAt(frame, first.x, first.y + 2)).toBe("│");
    expect(charAt(frame, second.x, second.y + 1)).toBe("┌");
    expect(findCell(frame, "OVERLAY second")).toEqual({ x: second.x + 1, y: second.y + 2 });
    // Where both overlap, the cell shows the second's left border, not the first's text.
    expect(charAt(frame, second.x, second.y + 2)).toBe("│");
    expect(frame).not.toContain("OVERLAY first");
    expect(frame.split("\n")[first.y + 2]?.startsWith(" ".repeat(first.x) + "│OVER")).toBe(true);
  });

  it("flips an overlay on the last row above its anchor, inside the root", async () => {
    const closed = await plainFrame(
      `root = Stack([${FILLER}, Floater("anchor", true)], "column", "none")`,
    );
    const frame = await plainFrame(
      `root = Stack([${FILLER}, Floater("anchor")], "column", "none")`,
    );
    // The overlay's own text comes first in reading order, so the anchor is read from the closed frame.
    const anchor = findCell(closed, "anchor");
    const lines = frame.split("\n");
    expect(lines.length).toBe(closed.split("\n").length);
    expect(anchor.y).toBe(lines.length - 1);
    expect(lines[anchor.y]?.slice(anchor.x)).toBe("anchor");
    const overlay = findCell(frame, "OVERLAY anchor");
    expect(overlay.y).toBeLessThan(anchor.y);
    expect(overlay).toEqual({ x: anchor.x + 1, y: anchor.y - 2 });
    expect(charAt(frame, anchor.x, anchor.y - 3)).toBe("┌");
    expect(charAt(frame, anchor.x, anchor.y - 1)).toBe("└");
  });

  it("follows its owner: new content on each render, gone once closed", async () => {
    const rendered = await renderProgram(overlayLibrary, floaterProgram('Floater("anchor")'));
    expect(stripAnsi(rendered.frame())).toContain("OVERLAY anchor");
    await rendered.update({ response: floaterProgram('Floater("moved")') });
    const moved = stripAnsi(rendered.frame());
    expect(moved).toContain("OVERLAY moved");
    expect(moved).not.toContain("OVERLAY anchor");
    await rendered.update({ response: floaterProgram('Floater("moved", true)') });
    const closed = stripAnsi(rendered.frame());
    expect(closed).not.toContain("OVERLAY");
    expect(findCell(closed, "row after").y).toBe(findCell(closed, "moved").y + 1);
    rendered.unmount();
  });

  it("is opaque: the cells its content leaves empty hide what is under them", async () => {
    const closed = await plainFrame(floaterProgram('Floater("anchor", true)'));
    const frame = await plainFrame(
      floaterProgram('Floater("anchor", false, "bottom", false, false, true)'),
    );
    const anchor = findCell(closed, "anchor");
    const lines = frame.split("\n");
    // Rows anchor+1 .. anchor+5: top border, padding, text, padding, bottom border; the
    // rows under them ("row after", "filler one" .. "filler four") show nothing through.
    expect(lines[anchor.y + 1]).toBe(`┌${"─".repeat(16)}┐`);
    expect(lines[anchor.y + 2]).toBe(`│${" ".repeat(16)}│`);
    expect(lines[anchor.y + 3]).toBe("│ OVERLAY anchor │");
    expect(lines[anchor.y + 4]).toBe(`│${" ".repeat(16)}│`);
    expect(lines[anchor.y + 5]).toBe(`└${"─".repeat(16)}┘`);
  });

  it("lets what is under a see-through overlay show in the cells its content leaves empty", async () => {
    const closed = await plainFrame(floaterProgram('Floater("anchor", true)'));
    const frame = await plainFrame(
      floaterProgram('Floater("anchor", false, "bottom", false, false, true, true)'),
    );
    const anchor = findCell(closed, "anchor");
    const lines = frame.split("\n");
    // The padding row over "filler one" shows its cells between the borders, and the
    // padding cell before the text shows the "i" of "filler two".
    expect(lines[anchor.y + 2]).toBe(`│iller one${" ".repeat(7)}│`);
    expect(lines[anchor.y + 3]).toBe("│iOVERLAY anchor │");
  });

  it("renders each overlay's content in its own component, so a hook in it cannot break the host", async () => {
    const open = floaterProgram('Floater("anchor", false, "bottom", false, true)');
    const rendered = await renderProgram(overlayLibrary, open);
    expect(stripAnsi(rendered.frame())).toContain("OVERLAY hooked");
    await rendered.update({
      response: floaterProgram('Floater("anchor", true, "bottom", false, true)'),
    });
    expect(stripAnsi(rendered.frame())).not.toContain("OVERLAY hooked");
    await rendered.update({ response: open });
    expect(stripAnsi(rendered.frame())).toContain("OVERLAY hooked");
    rendered.unmount();
  });

  it("re-places an overlay when the terminal is resized", async () => {
    const row = 'Stack([TextContent("a lead-in of words"), Floater("anchor")], "row", "none")';
    const program = `root = Stack([${row}, ${FILLER}], "column", "none")`;
    // Ink follows resizes only when interactive, as in a real terminal.
    const terminal = renderTerminal(
      <InkRenderer response={program} library={overlayLibrary} isStreaming={false} />,
    );
    await settle();
    let frame = stripAnsi(terminal.lastFrame());
    const anchor = findCell(frame, "anchor");
    expect(findCell(frame, "OVERLAY anchor")).toEqual({ x: anchor.x + 1, y: anchor.y + 2 });
    // At 30 columns the 16-cell overlay no longer fits from the anchor's column: it is shifted
    // left. Nothing in the tree re-renders: Ink's layout after the resize moves the overlay.
    terminal.resize(30);
    await settle();
    frame = stripAnsi(terminal.lastFrame());
    expect(findCell(frame, "anchor").x).toBe(anchor.x);
    expect(findCell(frame, "OVERLAY anchor")).toEqual({ x: 30 - 16 + 1, y: anchor.y + 2 });
    terminal.unmount();
  });

  it("is painted once, by the FocusScope's host, for a renderer inside a scope", async () => {
    const standalone = await plainFrame(floaterProgram('Floater("anchor")'));
    const instance = render(
      <FocusScope>
        <InkRenderer response={floaterProgram('Floater("anchor")')} library={overlayLibrary} />
      </FocusScope>,
    );
    await settle();
    const frame = stripAnsi(instance.lastFrame() ?? "");
    expect(frame.split("OVERLAY anchor").length).toBe(2);
    expect(findCell(frame, "OVERLAY anchor")).toEqual(findCell(standalone, "OVERLAY anchor"));
    expect(findCell(frame, "filler three")).toEqual(findCell(standalone, "filler three"));
    instance.unmount();
  });
});
