import type { ActionEvent } from "@openuidev/lang-core";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { FocusScope } from "../src/focus/focus-scope";
import { InkRenderer } from "../src/ink-renderer";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { findCell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const FILLER = 'TextContent("filler one"), TextContent("filler two"), TextContent("filler three")';

/** A column of rows without gaps: the given rows, then three filler rows. */
function rowsProgram(rows: string): string {
  return `root = Stack([${rows}, ${FILLER}], "column", "none")`;
}

/** The character at a cell of a plain frame. */
function charAt(frame: string, x: number, y: number): string {
  const line = frame.split("\n")[y] ?? "";
  return Array.from(line)[x] ?? "";
}

const BOTTOM_TIP = rowsProgram(
  'Tooltip(Icon("info"), "View certificate details", "bottom", "light"), Button("Next", @ToAssistant("Next"))',
);

/** The cells [from, from + length) of a row of a plain frame, blank past the line's end. */
function cellsAt(frame: string, y: number, from: number, length: number): string {
  const line = frame.split("\n")[y] ?? "";
  return Array.from(line.padEnd(from + length))
    .slice(from, from + length)
    .join("");
}

/** A single row: the tooltip's icon, then a Go button one cell to its right. */
function shortRowProgram(placement: string): string {
  return `root = Stack([Tooltip(Icon("info"), "More", "${placement}"), Button("Go", @ToAssistant("Go"))], "row")`;
}

describe("Tooltip", () => {
  it("floats its bubble under the trigger while focused, over the rows below, without moving them", async () => {
    const rendered = await renderProgram(inkLibrary, BOTTOM_TIP);
    const closed = stripAnsi(rendered.frame());
    expect(closed).not.toContain("View certificate details");
    const icon = findCell(closed, "<info>");
    expect(icon).toEqual({ x: 0, y: 0 });
    expect(findCell(closed, "[ Next ]")).toEqual({ x: 0, y: 1 });

    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const open = stripAnsi(rendered.frame());
    // The bubble's top border is on the row after the icon, its text on the row below,
    // painted over "[ Next ]" and "filler one".
    expect(charAt(open, 0, 1)).toMatch(/[╭┌]/);
    expect(findCell(open, "View certificate details")).toEqual({ x: 2, y: 2 });
    // The bubble is opaque: its padding cells hide the "i" and "e" of "filler one".
    expect(open.split("\n")[2]).toMatch(/^[│|] View certificate details [│|]$/);
    expect(charAt(open, 0, 3)).toMatch(/[╰└]/);
    expect(open).not.toContain("[ Next ]");
    expect(open).not.toContain("filler one");
    expect(findCell(open, "<info>")).toEqual(icon);
    expect(findCell(open, "filler three")).toEqual(findCell(closed, "filler three"));
    expect(open.split("\n").length).toBe(closed.split("\n").length);

    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const after = stripAnsi(rendered.frame());
    expect(inverseSegments(rendered.frame())).toEqual(["[ Next ]"]);
    expect(after).not.toContain("View certificate details");
    expect(findCell(after, "[ Next ]")).toEqual({ x: 0, y: 1 });
    rendered.unmount();
  });

  it("adds no stop of its own around a focusable trigger: Tab goes trigger to trigger", async () => {
    const program =
      'root = Stack([Button("Prev", @ToAssistant("Prev")), Tooltip(Button("Deploy", @ToAssistant("Deploy")), "Ships the build", "right"), Button("Next", @ToAssistant("Next"))])';
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Prev ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Deploy ]"]);
    expect(stripAnsi(rendered.frame())).toContain("Ships the build");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Next ]"]);
    expect(stripAnsi(rendered.frame())).not.toContain("Ships the build");
    rendered.unmount();
  });

  it("keeps a focused trigger focused while its bubble opens (top, left)", async () => {
    const program =
      'root = Stack([Tooltip(Button("Save", @ToAssistant("Save")), "Keeps a copy", "top"), Tooltip(Button("Back", @ToAssistant("Back")), "Previous build", "left"), Button("Next", @ToAssistant("Next"))])';
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Save ]"]);
    expect(stripAnsi(rendered.frame())).toContain("Keeps a copy");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(inverseSegments(rendered.frame())).toEqual(["[ Back ]"]);
    expect(plain).toContain("Previous build");
    expect(plain).not.toContain("Keeps a copy");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Next ]"]);
    rendered.unmount();
  });

  it("floats a right bubble one cell after the trigger, on the trigger's row", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      rowsProgram('Tooltip(Icon("info"), "More", "right")'),
    );
    const closed = stripAnsi(rendered.frame());
    const icon = findCell(closed, "<info>");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const open = stripAnsi(rendered.frame());
    const left = icon.x + "<info>".length + 1;
    expect(charAt(open, left - 1, icon.y)).toBe(" ");
    expect(charAt(open, left, icon.y)).toMatch(/[╭┌]/);
    expect(findCell(open, "More")).toEqual({ x: left + 2, y: icon.y + 1 });
    expect(findCell(open, "<info>")).toEqual(icon);
    expect(open.split("\n").length).toBe(closed.split("\n").length);
    rendered.unmount();
  });

  it("floats a left bubble ending one cell before the trigger, on the trigger's row", async () => {
    const row =
      'Stack([TextContent("Lead-in words"), Tooltip(Icon("info"), "Less", "left")], "row")';
    const rendered = await renderProgram(inkLibrary, rowsProgram(row));
    const closed = stripAnsi(rendered.frame());
    const icon = findCell(closed, "<info>");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const open = stripAnsi(rendered.frame());
    expect(charAt(open, icon.x - 1, icon.y)).toBe(" ");
    expect(charAt(open, icon.x - 2, icon.y)).toMatch(/[╮┐]/);
    // "│ Less │" ends at icon.x - 2, so its text starts six cells before that.
    expect(findCell(open, "Less")).toEqual({ x: icon.x - 7, y: icon.y + 1 });
    expect(findCell(open, "<info>")).toEqual(icon);
    rendered.unmount();
  });

  it("flips a top bubble on the first row below its trigger", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      rowsProgram('Tooltip(Icon("info"), "Up", "top")'),
    );
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const open = stripAnsi(rendered.frame());
    expect(findCell(open, "<info>")).toEqual({ x: 0, y: 0 });
    expect(charAt(open, 0, 1)).toMatch(/[╭┌]/);
    expect(findCell(open, "Up")).toEqual({ x: 2, y: 2 });
    rendered.unmount();
  });

  it("floats a top bubble above a trigger with room above it", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      `root = Stack([${FILLER}, Tooltip(Icon("info"), "Up", "top")], "column", "none")`,
    );
    const icon = findCell(stripAnsi(rendered.frame()), "<info>");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const open = stripAnsi(rendered.frame());
    expect(findCell(open, "Up")).toEqual({ x: icon.x + 2, y: icon.y - 2 });
    expect(findCell(open, "<info>")).toEqual(icon);
    rendered.unmount();
  });

  it("opens on hover with the mouse on and closes when the pointer leaves", async () => {
    const program = rowsProgram('TextContent("above"), Tooltip(Icon("info"), "More", "right")');
    const rendered = await renderProgram(inkLibrary, program, { mouse: true });
    const icon = findCell(stripAnsi(rendered.frame()), "<info>");
    rendered.instance.stdin.write(MOUSE.move(icon.x + 1, icon.y));
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(findCell(plain, "More")).toEqual({ x: icon.x + "<info>".length + 3, y: icon.y + 1 });
    rendered.instance.stdin.write(MOUSE.move(50, 20));
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("More");
    rendered.unmount();
  });

  it("is painted by a FocusScope's host with the renderer's styles", async () => {
    const standalone = await renderProgram(inkLibrary, BOTTOM_TIP);
    standalone.instance.stdin.write(KEYS.TAB);
    await settle();
    const expected = standalone.frame().split("\n")[2];
    standalone.unmount();

    const instance = render(
      <FocusScope>
        <InkRenderer response={BOTTOM_TIP} library={inkLibrary} isStreaming={false} />
      </FocusScope>,
    );
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    const frame = instance.lastFrame() ?? "";
    const plain = stripAnsi(frame);
    expect(plain.split("View certificate details").length).toBe(2);
    expect(findCell(plain, "View certificate details")).toEqual({ x: 2, y: 2 });
    // Same cells and same styles (the light bubble) as without the scope.
    expect(frame.split("\n")[2]).toBe(expected);
    instance.unmount();
  });

  it("takes the clicks on its bubble: the button it covers fires only once it is uncovered", async () => {
    const actions: ActionEvent[] = [];
    function onAction(event: ActionEvent): void {
      actions.push(event);
    }
    const rendered = await renderProgram(inkLibrary, BOTTOM_TIP, { mouse: true, onAction });
    const next = findCell(stripAnsi(rendered.frame()), "[ Next ]");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    // The bubble's top border is painted over "[ Next ]".
    expect(stripAnsi(rendered.frame())).not.toContain("[ Next ]");
    rendered.instance.stdin.write(MOUSE.click(next.x + 3, next.y));
    await settle();
    expect(actions).toHaveLength(0);

    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("View certificate details");
    rendered.instance.stdin.write(MOUSE.click(next.x + 3, next.y));
    await settle();
    expect(actions).toHaveLength(1);
    expect(actions[0]?.humanFriendlyMessage).toBe("Next");
    rendered.unmount();
  });

  for (const placement of ["bottom", "top", "right"]) {
    it(`shows a one-row label beside the trigger when a ${placement} bubble has no room`, async () => {
      const rendered = await renderProgram(inkLibrary, shortRowProgram(placement));
      const closed = stripAnsi(rendered.frame());
      const icon = findCell(closed, "<info>");
      const go = findCell(closed, "[ Go ]");
      expect(go).toEqual({ x: icon.x + "<info>".length + 1, y: icon.y });
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
      const open = stripAnsi(rendered.frame());
      expect(open.split("\n").length).toBe(closed.split("\n").length);
      // " More " starts one cell after the icon, over "[ Go ]" and nothing else; no border.
      expect(cellsAt(open, icon.y, go.x, " More ".length)).toBe(" More ");
      expect(findCell(open, "<info>")).toEqual(icon);
      expect(open).not.toMatch(/[╭╮╰╯┌┐└┘│─]/);
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
      expect(inverseSegments(rendered.frame())).toEqual(["[ Go ]"]);
      expect(stripAnsi(rendered.frame())).not.toContain("More");
      rendered.unmount();
    });
  }
});
