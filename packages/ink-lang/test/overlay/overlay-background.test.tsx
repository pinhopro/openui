import { Box } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { FocusScope } from "../../src/focus/focus-scope";
import { InkRenderer } from "../../src/ink-renderer";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { settle } from "../helpers/settle";

// Ink writes no colours at the default level when stdout is not a terminal.
vi.hoisted(function forceTruecolor() {
  process.env["FORCE_COLOR"] = "3";
});

/** The background code of `backgroundColor="blue"`. */
const BLUE_BACKGROUND = "44";

/**
 * The background code in force on each cell of a raw frame line, "" where
 * none is: SGR sequences are followed, every other character is one cell.
 */
function cellBackgrounds(line: string): string[] {
  const cells: string[] = [];
  let background = "";
  const pattern = /\u001b\[([\d;]*)m|([^\u001b])/gu;
  let match = pattern.exec(line);
  while (match !== null) {
    const codes = match[1];
    if (codes === undefined) {
      cells.push(background);
    } else {
      background = nextBackground(background, codes);
    }
    match = pattern.exec(line);
  }
  return cells;
}

/** The background after one SGR sequence's codes. */
function nextBackground(current: string, codes: string): string {
  const parts = codes === "" ? ["0"] : codes.split(";");
  let background = current;
  for (let index = 0; index < parts.length; index += 1) {
    const code = parts[index] ?? "";
    if (code === "0" || code === "49") background = "";
    else if (/^4[0-7]$/.test(code) || /^10[0-7]$/.test(code)) background = code;
    else if (code === "48") {
      background = parts.slice(index, index + 5).join(";");
      index += parts[index + 1] === "2" ? 4 : 2;
    } else if (code === "38") {
      index += parts[index + 1] === "2" ? 4 : 2;
    }
  }
  return background;
}

const PROGRAM =
  'root = Stack([Tooltip(Icon("info"), "Hint", "bottom"), TextContent("filler one"), TextContent("filler two"), TextContent("filler three")], "column", "none")';

/**
 * A program on a blue canvas inside a FocusScope, whose overlay host renders
 * after the scope's children: outside the canvas in the tree, so the bubble
 * does not inherit the canvas's background through Ink's own context.
 */
function Canvas() {
  return (
    <FocusScope>
      <Box flexDirection="column" backgroundColor="blue">
        <InkRenderer response={PROGRAM} library={inkLibrary} isStreaming={false} />
      </Box>
    </FocusScope>
  );
}

describe("overlay background", () => {
  it("paints an overlay with the background its anchor sits on, wherever its host is", async () => {
    const instance = render(<Canvas />);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    const frame = instance.lastFrame() ?? "";
    const plain = stripAnsi(frame);
    const text = findCell(plain, "Hint");
    expect(text).toEqual({ x: 2, y: 2 });
    const backgrounds = cellBackgrounds(frame.split("\n")[text.y] ?? "");
    // "│ Hint │": the padding cells and the text's cells carry the canvas's blue.
    expect(backgrounds[text.x - 1]).toBe(BLUE_BACKGROUND);
    expect(backgrounds[text.x]).toBe(BLUE_BACKGROUND);
    expect(backgrounds[text.x + "Hint".length]).toBe(BLUE_BACKGROUND);
    instance.unmount();
  });

  it("paints no background where the anchor has none", async () => {
    const instance = render(
      <FocusScope>
        <InkRenderer response={PROGRAM} library={inkLibrary} isStreaming={false} />
      </FocusScope>,
    );
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    const frame = instance.lastFrame() ?? "";
    const text = findCell(stripAnsi(frame), "Hint");
    const backgrounds = cellBackgrounds(frame.split("\n")[text.y] ?? "");
    expect(backgrounds[text.x - 1]).toBe("");
    expect(backgrounds[text.x]).toBe("");
    instance.unmount();
  });
});
