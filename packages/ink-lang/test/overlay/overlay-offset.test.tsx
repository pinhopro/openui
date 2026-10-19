import { Box, Text, type DOMElement } from "ink";
import { useRef, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { CellRect } from "../../src/focus/element-rect";
import { FocusScope } from "../../src/focus/focus-scope";
import type { PlacedFrame } from "../../src/overlay/overlay-registry";
import { useOverlay } from "../../src/overlay/use-overlay";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { renderTerminal, type RenderedTerminal } from "../helpers/render-terminal";
import { settle } from "../helpers/settle";

/** The terminal's width: the root, and so the bounds, are this many columns wide. */
const COLUMNS = 40;

/** The overlay's size: "OVERLAY" (7 cells) in a single border. */
const OVERLAY_WIDTH = 9;
const OVERLAY_HEIGHT = 3;

/** Every rect `onPlaced` received, oldest first. */
const placedReports: (CellRect | null)[] = [];

/** Every frame `onPlaced` received with those rects, oldest first. */
const placedFrames: (PlacedFrame | null)[] = [];

function recordPlaced(rect: CellRect | null, frame: PlacedFrame | null): void {
  placedReports.push(rect);
  placedFrames.push(frame);
}

interface FloaterProps {
  open: boolean;
  offset?: { x: number; y: number };
  report?: boolean;
}

/** An anchor row with a bordered "OVERLAY" box under it while open, moved by `offset`. */
function Floater({ open, offset, report }: FloaterProps) {
  const anchorRef = useRef<DOMElement | null>(null);
  useOverlay({
    kind: "dialog",
    anchorRef,
    placement: "bottom",
    gap: 0,
    isOpen: open,
    offset,
    onPlaced: report === true ? recordPlaced : undefined,
    render: function renderOverlay(): ReactNode {
      return (
        <Box borderStyle="single">
          <Text>OVERLAY</Text>
        </Box>
      );
    },
  });
  return (
    <Box ref={anchorRef}>
      <Text>anchor</Text>
    </Box>
  );
}

/** The Floater on the first row, then eight filler rows (the root is 9 rows high). */
function App(props: FloaterProps) {
  const fillers = [];
  for (let index = 1; index <= 8; index += 1) {
    fillers.push(<Text key={index}>{`filler ${index}`}</Text>);
  }
  return (
    <FocusScope>
      <Box flexDirection="column">
        <Floater {...props} />
        {fillers}
      </Box>
    </FocusScope>
  );
}

async function frameOf(terminal: RenderedTerminal): Promise<string> {
  await settle();
  return stripAnsi(terminal.lastFrame());
}

/** The character at a cell of a plain frame. */
function charAt(frame: string, x: number, y: number): string {
  const line = frame.split("\n")[y] ?? "";
  return Array.from(line)[x] ?? "";
}

afterEach(() => {
  placedReports.length = 0;
  placedFrames.length = 0;
});

describe("overlay offset", () => {
  it("moves the shown overlay by its offset from where it was placed", async () => {
    const terminal = renderTerminal(<App open={true} />, COLUMNS);
    const placed = findCell(await frameOf(terminal), "OVERLAY");
    terminal.rerender(<App open={true} offset={{ x: 3, y: 1 }} />);
    const moved = findCell(await frameOf(terminal), "OVERLAY");
    expect(moved).toEqual({ x: placed.x + 3, y: placed.y + 1 });
    terminal.unmount();
  });

  it("clamps an overlay its offset pushes past the right edge so it ends at the last column", async () => {
    const terminal = renderTerminal(<App open={true} offset={{ x: 100, y: 0 }} />, COLUMNS);
    const frame = await frameOf(terminal);
    const left = COLUMNS - OVERLAY_WIDTH;
    // The box's top border runs from its left column to the root's last column.
    expect(charAt(frame, left, 1)).toBe("┌");
    expect(charAt(frame, COLUMNS - 1, 1)).toBe("┐");
    expect(findCell(frame, "OVERLAY")).toEqual({ x: left + 1, y: 2 });
    terminal.unmount();
  });
});

describe("overlay onPlaced", () => {
  it("reports the shown overlay's cells once per change, and null after it closes", async () => {
    const terminal = renderTerminal(<App open={true} report={true} />, COLUMNS);
    await settle();
    // Under the anchor's row, from the root's first column.
    const opened: CellRect = { x: 0, y: 1, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT };
    expect(placedReports).toEqual([opened]);

    terminal.rerender(<App open={true} report={true} offset={{ x: 3, y: 1 }} />);
    await settle();
    const moved: CellRect = { x: 3, y: 2, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT };
    expect(placedReports).toEqual([opened, moved]);

    // A new render with the same offset draws the overlay in the same cells: nothing new is reported.
    terminal.rerender(<App open={true} report={true} offset={{ x: 3, y: 1 }} />);
    await settle();
    expect(placedReports).toEqual([opened, moved]);

    terminal.rerender(<App open={false} report={true} offset={{ x: 3, y: 1 }} />);
    await settle();
    expect(placedReports).toEqual([opened, moved, null]);
    terminal.unmount();
  });

  it("tells where the form was placed before its offset and the bounds it was clamped into", async () => {
    const terminal = renderTerminal(
      <App open={true} report={true} offset={{ x: 100, y: 0 }} />,
      COLUMNS,
    );
    await settle();
    const clamped: CellRect = {
      x: COLUMNS - OVERLAY_WIDTH,
      y: 1,
      width: OVERLAY_WIDTH,
      height: OVERLAY_HEIGHT,
    };
    expect(placedReports).toEqual([clamped]);
    // Under the anchor, before the offset; the bounds are the root: 40 columns, 9 rows.
    expect(placedFrames).toEqual([
      { origin: { x: 0, y: 1 }, bounds: { x: 0, y: 0, width: COLUMNS, height: 9 } },
    ]);

    terminal.rerender(<App open={false} report={true} offset={{ x: 100, y: 0 }} />);
    await settle();
    expect(placedFrames).toEqual([
      { origin: { x: 0, y: 1 }, bounds: { x: 0, y: 0, width: COLUMNS, height: 9 } },
      null,
    ]);
    terminal.unmount();
  });
});
