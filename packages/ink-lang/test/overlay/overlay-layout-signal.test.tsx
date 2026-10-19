import { Box } from "ink";
import { render } from "ink-testing-library";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { FocusScope } from "../../src/focus/focus-scope";
import { InkRenderer } from "../../src/ink-renderer";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { settle } from "../helpers/settle";

/** Scrolls the ScrollBox below by a number of rows; set while it is mounted. */
const scroll: { by: ((rows: number) => void) | null } = { by: null };

/**
 * A pane eight rows high that hides its overflow and scrolls its content by
 * local state: scrolling re-renders this component only, never its children
 * (a stable element) nor the FocusScope above it.
 */
function ScrollBox({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState(0);
  scroll.by = function scrollBy(rows: number): void {
    setOffset(function next(previous) {
      return previous + rows;
    });
  };
  return (
    <Box flexDirection="column" height={8} overflowY="hidden" contentOffsetY={offset}>
      <Box flexDirection="column" flexShrink={0}>
        {children}
      </Box>
    </Box>
  );
}

function lines(prefix: string, count: number): string {
  const rows: string[] = [];
  for (let index = 0; index < count; index += 1) rows.push(`TextContent("${prefix} ${index}")`);
  return rows.join(", ");
}

const PROGRAM =
  `root = Stack([${lines("above", 4)}, ` +
  'Tooltip(Button("Deploy", @ToAssistant("Deploy")), "Ships the build", "bottom"), ' +
  `${lines("below", 10)}], "column", "none")`;

/** Created once, so the ScrollBox's re-renders never re-render the renderer. */
const RENDERER = <InkRenderer response={PROGRAM} library={inkLibrary} isStreaming={false} />;

describe("overlay host and the layout", () => {
  it("moves a bubble with its trigger when only a scrolled pane re-renders, and hides it once the trigger leaves", async () => {
    const instance = render(
      <FocusScope>
        <ScrollBox>{RENDERER}</ScrollBox>
      </FocusScope>,
    );
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    let frame = stripAnsi(instance.lastFrame() ?? "");
    const trigger = findCell(frame, "[ Deploy ]");
    const bubble = findCell(frame, "Ships the build");
    expect(trigger.y).toBe(4);
    expect(bubble.y).toBe(trigger.y + 2);

    scroll.by?.(2);
    await settle();
    frame = stripAnsi(instance.lastFrame() ?? "");
    expect(findCell(frame, "[ Deploy ]")).toEqual({ x: trigger.x, y: trigger.y - 2 });
    expect(findCell(frame, "Ships the build")).toEqual({ x: bubble.x, y: bubble.y - 2 });

    scroll.by?.(4);
    await settle();
    frame = stripAnsi(instance.lastFrame() ?? "");
    expect(frame).not.toContain("[ Deploy ]");
    expect(frame).not.toContain("Ships the build");
    instance.unmount();
  });
});
