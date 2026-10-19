import { Box } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { FocusScope } from "../src/focus/focus-scope";
import { InkRenderer } from "../src/ink-renderer";
import { stripAnsi } from "./helpers/ansi";
import { findCell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { renderTerminal } from "./helpers/render-terminal";
import { settle } from "./helpers/settle";

/** The character at a cell of a plain frame. */
function charAt(frame: string, x: number, y: number): string {
  const line = frame.split("\n")[y] ?? "";
  return Array.from(line)[x] ?? "";
}

/** `count` TextContent rows reading "<prefix> <index>". */
function textRows(prefix: string, count: number): string {
  const rows: string[] = [];
  for (let index = 0; index < count; index += 1) rows.push(`TextContent("${prefix} ${index}")`);
  return rows.join(", ");
}

/** The widest line of any frame, in cells (the plain frames hold one-cell characters only). */
function widestLine(frames: string[]): number {
  let widest = 0;
  for (const frame of frames) {
    for (const line of stripAnsi(frame).split("\n")) {
      widest = Math.max(widest, Array.from(line).length);
    }
  }
  return widest;
}

/** A program inside a box `rows` high, under a FocusScope whose host bounds are the root. */
function TallRoot({ rows, program }: { rows: number; program: string }) {
  return (
    <FocusScope>
      <Box flexDirection="column" height={rows}>
        <InkRenderer response={program} library={inkLibrary} isStreaming={false} />
      </Box>
    </FocusScope>
  );
}

describe("Tooltip in a narrow or short terminal", () => {
  it("wraps a long bubble inside the terminal's width: no frame line is wider than the root", async () => {
    const long = "word ".repeat(40).trim();
    const program = `root = Stack([Tooltip(Icon("info"), "${long}", "bottom"), ${textRows("filler", 10)}], "column", "none")`;
    const terminal = renderTerminal(
      <InkRenderer response={program} library={inkLibrary} isStreaming={false} />,
      60,
    );
    await settle();
    terminal.stdin.write(KEYS.TAB);
    await settle();
    expect(widestLine(terminal.frames)).toBeLessThanOrEqual(60);
    const open = stripAnsi(terminal.lastFrame()).split("\n");
    // The whole bubble is drawn under the icon, its text wrapped over several rows.
    expect(open[1]).toMatch(/^[╭┌]─+[╮┐]$/);
    const wrapped = open.filter(function isTextRow(line) {
      return /^[│|] word/.test(line);
    });
    expect(wrapped.length).toBeGreaterThan(1);
    expect(wrapped.join(" ").split("word").length - 1).toBe(40);
    terminal.unmount();
  });

  it("turns a compact label back into the whole bubble once the root grows tall enough", async () => {
    const program = 'root = Stack([Tooltip(Icon("info"), "More", "bottom")], "column", "none")';
    const instance = render(<TallRoot rows={1} program={program} />);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    let frame = stripAnsi(instance.lastFrame() ?? "");
    // The label " More " starts one cell after the icon.
    expect(frame.trimEnd()).toBe("<info>  More");
    instance.rerender(<TallRoot rows={5} program={program} />);
    await settle();
    frame = stripAnsi(instance.lastFrame() ?? "");
    expect(charAt(frame, 0, 1)).toMatch(/[╭┌]/);
    expect(findCell(frame, "More")).toEqual({ x: 2, y: 2 });
    instance.unmount();
  });

  it("turns a compact label back into the whole bubble once the terminal widens", async () => {
    const text = "word ".repeat(24).trim();
    const program = `root = Stack([TextContent("first"), Tooltip(Icon("info"), "${text}", "bottom"), ${textRows("filler", 3)}], "column", "none")`;
    const terminal = renderTerminal(
      <InkRenderer response={program} library={inkLibrary} isStreaming={false} />,
      60,
    );
    await settle();
    terminal.stdin.write(KEYS.TAB);
    await settle();
    // At 60 columns the bubble wraps to four text rows: it fits neither above nor below the icon.
    let frame = stripAnsi(terminal.lastFrame());
    expect(frame).not.toMatch(/[╭┌│]/);
    expect(findCell(frame, "<info>")).toEqual({ x: 0, y: 1 });
    expect(findCell(frame, "word")).toEqual({ x: 8, y: 1 });
    expect(widestLine(terminal.frames)).toBeLessThanOrEqual(60);
    // At 130 columns it is three rows high and fits below.
    terminal.resize(130);
    await settle();
    frame = stripAnsi(terminal.lastFrame());
    expect(charAt(frame, 0, 2)).toMatch(/[╭┌]/);
    expect(findCell(frame, text)).toEqual({ x: 2, y: 3 });
    terminal.unmount();
  });
});
