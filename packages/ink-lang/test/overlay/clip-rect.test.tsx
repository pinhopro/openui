import { Box, Text, type DOMElement } from "ink";
import { render } from "ink-testing-library";
import { useRef, type ReactElement, type RefObject } from "react";
import { describe, expect, it } from "vitest";
import type { CellRect } from "../../src/focus/element-rect";
import { clippedBy } from "../../src/overlay/clip-rect";
import { settle } from "../helpers/settle";

/** The target box of the tree rendered last, set while it renders. */
const target: { ref: RefObject<DOMElement | null> | null } = { ref: null };

/** A one-cell-high box holding `text`, the element `clippedBy` is asked about. */
function Target({ text }: { text: string }) {
  const ref = useRef<DOMElement | null>(null);
  target.ref = ref;
  return (
    <Box ref={ref} flexShrink={0}>
      <Text>{text}</Text>
    </Box>
  );
}

/** Renders `tree` and returns what `clippedBy` says about its Target. */
async function clipOfTarget(tree: ReactElement): Promise<CellRect | null> {
  target.ref = null;
  const instance = render(tree);
  await settle();
  const ref = target.ref as RefObject<DOMElement | null> | null;
  const element = ref === null ? null : ref.current;
  if (element === null) throw new Error("the Target did not render");
  const clip = clippedBy(element);
  instance.unmount();
  return clip;
}

describe("clippedBy", () => {
  it("is null when no ancestor hides its overflow", async () => {
    const clip = await clipOfTarget(
      <Box flexDirection="column" borderStyle="single">
        <Target text="free" />
      </Box>,
    );
    expect(clip).toBeNull();
  });

  it("starts at the box's top row when the box has no top border", async () => {
    // The box takes rows 1..4 and columns 0..9; its border has no top side.
    const clip = await clipOfTarget(
      <Box flexDirection="column">
        <Text>above</Text>
        <Box
          flexDirection="column"
          borderStyle="single"
          borderTop={false}
          overflow="hidden"
          width={10}
          height={4}
        >
          <Target text="inside" />
        </Box>
      </Box>,
    );
    expect(clip).toEqual({ x: 1, y: 1, width: 8, height: 3 });
  });

  it("clips only the columns of a box that hides its horizontal overflow", async () => {
    // The box takes rows 1..3 and columns 2..7; rows are bounded by the root (4 rows) only.
    const clip = await clipOfTarget(
      <Box flexDirection="column">
        <Text>above</Text>
        <Box marginLeft={2} width={6} height={3} overflowX="hidden">
          <Target text="a long line of text" />
        </Box>
      </Box>,
    );
    expect(clip).toEqual({ x: 2, y: 0, width: 6, height: 4 });
  });

  it("intersects nested clips", async () => {
    // The outer box takes rows 0..4 and columns 0..9; the inner one rows 3..5 and
    // columns 4..13, past the outer box's right and bottom edges.
    const clip = await clipOfTarget(
      <Box flexDirection="column" width={10} height={5} overflow="hidden">
        <Box
          flexDirection="column"
          flexShrink={0}
          marginTop={3}
          marginLeft={4}
          width={10}
          height={3}
          overflow="hidden"
        >
          <Target text="deep" />
        </Box>
      </Box>,
    );
    expect(clip).toEqual({ x: 4, y: 3, width: 6, height: 2 });
  });
});
