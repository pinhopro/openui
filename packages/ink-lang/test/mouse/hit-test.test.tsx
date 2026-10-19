import { Box, Text, type DOMElement } from "ink";
import { render } from "ink-testing-library";
import { useRef, type RefObject } from "react";
import { describe, expect, it } from "vitest";
import { measureTargets, targetsUnderCell, type MeasuredTarget } from "../../src/mouse/hit-test";
import type { MouseTarget } from "../../src/mouse/mouse-target";
import { settle } from "../helpers/settle";

function target(): MouseTarget {
  return { ref: { current: null }, handlers: {}, layer: 0 };
}

function measured(
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  layer = 0,
): MeasuredTarget {
  return { target: { ...target(), layer }, rect: { x, y, width, height }, depth };
}

describe("targetsUnderCell", () => {
  it("returns nothing when no rect contains the cell", () => {
    const outer = measured(0, 0, 10, 2, 1);
    expect(targetsUnderCell([outer], 10, 0)).toEqual([]);
    expect(targetsUnderCell([outer], 3, 2)).toEqual([]);
    expect(targetsUnderCell([], 0, 0)).toEqual([]);
  });

  it("returns the one rect that contains the cell", () => {
    const first = measured(0, 0, 10, 1, 1);
    const second = measured(0, 1, 10, 1, 1);
    expect(targetsUnderCell([first, second], 9, 0)).toEqual([first.target]);
    expect(targetsUnderCell([first, second], 0, 1)).toEqual([second.target]);
  });

  it("lists nested boxes innermost first", () => {
    const outer = measured(0, 0, 20, 5, 1);
    const inner = measured(2, 1, 5, 1, 3);
    expect(targetsUnderCell([outer, inner], 3, 1)).toEqual([inner.target, outer.target]);
    expect(targetsUnderCell([inner, outer], 3, 1)).toEqual([inner.target, outer.target]);
    expect(targetsUnderCell([outer, inner], 0, 0)).toEqual([outer.target]);
  });

  it("puts the smaller rect first at the same depth, then the later one", () => {
    const big = measured(0, 0, 20, 5, 2);
    const small = measured(0, 0, 3, 1, 2);
    expect(targetsUnderCell([big, small], 0, 0)).toEqual([small.target, big.target]);
    const twinA = measured(0, 0, 3, 1, 2);
    const twinB = measured(0, 0, 3, 1, 2);
    expect(targetsUnderCell([twinA, twinB], 0, 0)).toEqual([twinB.target, twinA.target]);
  });

  it("puts a higher layer first even when it is shallower and larger", () => {
    const page = measured(0, 0, 3, 1, 5);
    const overlay = measured(0, 0, 20, 5, 1, 1);
    expect(targetsUnderCell([page, overlay], 0, 0)).toEqual([overlay.target, page.target]);
    expect(targetsUnderCell([overlay, page], 0, 0)).toEqual([overlay.target, page.target]);
  });

  it("ignores rects without a size", () => {
    const empty = measured(0, 0, 0, 0, 5);
    const real = measured(0, 0, 4, 1, 1);
    expect(targetsUnderCell([empty, real], 0, 0)).toEqual([real.target]);
  });
});

describe("measureTargets", () => {
  it("subtracts the contentOffsetY of scrolled ancestors so rects are viewport cells", async () => {
    let captured: RefObject<DOMElement | null> | null = null;
    function Scrolled() {
      const ref = useRef<DOMElement | null>(null);
      captured = ref;
      return (
        <Box flexDirection="column" height={2} overflowY="hidden" contentOffsetY={3}>
          <Box flexDirection="column" flexShrink={0}>
            <Text>0</Text>
            <Text>1</Text>
            <Text>2</Text>
            <Text>3</Text>
            <Box ref={ref} width={1}>
              <Text>4</Text>
            </Box>
          </Box>
        </Box>
      );
    }
    const instance = render(<Scrolled />);
    await settle();
    const ref = captured as RefObject<DOMElement | null> | null;
    expect(ref).not.toBeNull();
    const [first] = measureTargets([
      { ref: ref as RefObject<DOMElement | null>, handlers: {}, layer: 0 },
    ]);
    expect(first?.rect).toEqual({ x: 0, y: 1, width: 1, height: 1 });
    instance.unmount();
  });
});
