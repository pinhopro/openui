import type { ActionEvent } from "@openuidev/lang-core";
import { Box, Text, type DOMElement } from "ink";
import { useRef, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type Library,
} from "../../src/library";
import { Backdrop } from "../../src/overlay/backdrop";
import { useOverlay } from "../../src/overlay/use-overlay";
import { stripAnsi } from "../helpers/ansi";
import { findCell, type Cell } from "../helpers/find-cell";
import { MOUSE } from "../helpers/mouse";
import { renderProgram, type RenderedProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

/** How many times a Backdrop's `onCancel` ran. */
const cancels: { count: number } = { count: 0 };

function recordCancel(): void {
  cancels.count += 1;
}

interface LayersProps {
  child: unknown;
  open: boolean;
}

/**
 * A label that, while `open`, registers two overlays in order: a see-through
 * backdrop covering the bounds and, above it, a centred bordered box holding
 * the program's `child` (drawn through `renderNode`, so a Button there is real).
 */
function LayersRenderer({ props, renderNode }: ComponentRenderProps<LayersProps>) {
  const anchorRef = useRef<DOMElement | null>(null);
  const child = props.child;
  function renderBackdrop(): ReactNode {
    return <Backdrop onCancel={recordCancel} />;
  }
  function renderDialog(): ReactNode {
    return <Box borderStyle="single">{renderNode(child)}</Box>;
  }
  useOverlay({
    kind: "backdrop",
    anchorRef,
    placement: "cover",
    isOpen: props.open,
    render: renderBackdrop,
    opaque: false,
  });
  useOverlay({
    kind: "modal",
    anchorRef,
    placement: "center",
    isOpen: props.open,
    render: renderDialog,
  });
  return (
    <Box ref={anchorRef}>
      <Text>layers</Text>
    </Box>
  );
}

const Layers = defineComponent({
  name: "Layers",
  description: "A label with a backdrop and a centred dialog holding a child over the program",
  props: z.object({ child: z.any(), open: z.boolean() }),
  component: LayersRenderer,
});

const backdropLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Layers]),
});

const INSIDE = 'Button("Inside", @ToAssistant("Inside"))';
const BASE = 'Button("Base", @ToAssistant("Base"))';
const ROWS = [
  'TextContent("row one")',
  'TextContent("row two")',
  'TextContent("row three")',
  'TextContent("row four")',
  'TextContent("row five")',
].join(", ");

/** The Base button on the first row, text rows under it, and the Layers label last. */
function program(open: boolean): string {
  return `root = Stack([${BASE}, ${ROWS}, Layers(${INSIDE}, ${open})], "column", "none")`;
}

interface OpenLayers {
  rendered: RenderedProgram;
  actions: ActionEvent[];
  /** The plain frame before the overlays opened. */
  closed: string;
  /** The plain frame with both overlays open. */
  opened: string;
}

/** Renders the program closed, then opens the backdrop and the dialog over it. */
async function openLayers(): Promise<OpenLayers> {
  cancels.count = 0;
  const actions: ActionEvent[] = [];
  function onAction(event: ActionEvent): void {
    actions.push(event);
  }
  const rendered = await renderProgram(backdropLibrary, program(false), { mouse: true, onAction });
  const closed = stripAnsi(rendered.frame());
  await rendered.update({ response: program(true) });
  const opened = stripAnsi(rendered.frame());
  return { rendered, actions, closed, opened };
}

async function click(rendered: RenderedProgram, cell: Cell): Promise<void> {
  rendered.instance.stdin.write(MOUSE.click(cell.x, cell.y));
  await settle();
}

describe("Backdrop", () => {
  it("cancels on a click on a base cell far from the dialog, which the base button under it never gets", async () => {
    const { rendered, actions, closed, opened } = await openLayers();
    expect(opened).toContain("[ Inside ]");
    await click(rendered, findCell(closed, "[ Base ]"));
    expect(cancels.count).toBe(1);
    expect(actions).toHaveLength(0);
    rendered.unmount();
  });

  it("spans the bounds: the last row and the cells right of the dialog cancel too", async () => {
    const { rendered, actions, opened } = await openLayers();
    await click(rendered, findCell(opened, "layers"));
    const corner = findCell(opened, "┐");
    await click(rendered, { x: corner.x + 10, y: corner.y + 1 });
    expect(cancels.count).toBe(2);
    expect(actions).toHaveLength(0);
    rendered.unmount();
  });

  it("does not cancel on a click on the dialog's border", async () => {
    const { rendered, actions, opened } = await openLayers();
    await click(rendered, findCell(opened, "┌"));
    await click(rendered, findCell(opened, "┘"));
    expect(cancels.count).toBe(0);
    expect(actions).toHaveLength(0);
    rendered.unmount();
  });

  it("lets the button inside the dialog take its click without cancelling", async () => {
    const { rendered, actions, opened } = await openLayers();
    const inside = findCell(opened, "[ Inside ]");
    await click(rendered, { x: inside.x + 2, y: inside.y });
    expect(cancels.count).toBe(0);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.humanFriendlyMessage).toBe("Inside");
    rendered.unmount();
  });

  it("is see-through: every cell outside the dialog shows the base as before", async () => {
    const { rendered, closed, opened } = await openLayers();
    const corner = findCell(opened, "┌");
    const closedLines = closed.split("\n");
    const openedLines = opened.split("\n");
    expect(openedLines).toHaveLength(closedLines.length);
    for (let y = 0; y < closedLines.length; y += 1) {
      // Ink trims each line's trailing blanks; the dialog's rows keep them up to its left edge.
      const before = (closedLines[y] ?? "").slice(0, corner.x).trimEnd();
      expect((openedLines[y] ?? "").slice(0, corner.x).trimEnd()).toBe(before);
    }
    expect(opened).toContain("row one");
    expect(opened).toContain("row five");
    rendered.unmount();
  });
});
