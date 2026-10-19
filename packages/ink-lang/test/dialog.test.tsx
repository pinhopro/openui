import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { InkRenderer } from "../src/ink-renderer";
import type { UiEvent } from "../src/ui-events";
import { stripAnsi } from "./helpers/ansi";
import { fillerRows, fillerText } from "./helpers/filler-rows";
import { findCell, type Cell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { renderTerminal } from "./helpers/render-terminal";
import { settle } from "./helpers/settle";

const ROWS = 10;
const TITLE = "Draft saved";
/** ink-testing-library's terminal width: the bounds overlays are placed in. */
const COLUMNS = 100;

/** The note dialog bound to `$note`, at `placement` when one is given. */
function noteDialog(placement: string): string {
  const placed = placement === "" ? "" : `, null, null, "${placement}"`;
  return `noteDialog = Dialog("info", "${TITLE}", "Keep editing or close this note.", "Close", null, $note${placed})`;
}

/**
 * Button A, the opener, the dialog, button B and filler rows in a Stack with
 * its default gap, so the dialog floats over the page drawn whole.
 */
function program(open: boolean, placement = ""): string {
  return [
    `$note = ${open}`,
    `root = Stack([a, open, noteDialog, b, ${fillerRows(ROWS)}])`,
    'a = Button("A", @ToAssistant("A"))',
    'open = Button("Open", @Set($note, true))',
    noteDialog(placement),
    'b = Button("B", @ToAssistant("B"))',
  ].join("\n");
}

async function mount(source: string) {
  const states: Array<Record<string, unknown>> = [];
  const events: UiEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    onStateUpdate: function onStateUpdate(state) {
      states.push(state);
    },
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  return { rendered, states, events };
}

function ofType(events: UiEvent[], type: string): UiEvent[] {
  const found: UiEvent[] = [];
  for (const event of events) {
    if (event.type === type) found.push(event);
  }
  return found;
}

/** The name of the stop that took focus last; covered stops cannot be read off the frame. */
function lastFocused(events: UiEvent[]): string {
  const focused = ofType(events, "focus");
  return focused[focused.length - 1]?.name ?? "";
}

/** The 0-based cell where `text` starts last in a plain frame; throws when absent. */
function findLastCell(frame: string, text: string): Cell {
  const lines = frame.split("\n");
  for (let y = lines.length - 1; y >= 0; y -= 1) {
    const x = (lines[y] ?? "").lastIndexOf(text);
    if (x !== -1) return { x, y };
  }
  throw new Error(`"${text}" is not in the frame:\n${frame}`);
}

/** The dialog's box: its top-left and bottom-right border corners. */
function dialogBox(frame: string): { top: Cell; bottom: Cell } {
  return { top: findCell(frame, "╭"), bottom: findLastCell(frame, "╯") };
}

/** Focuses the opener with Tab and presses it. */
async function openWithKeys(rendered: { instance: { stdin: { write: (data: string) => void } } }) {
  rendered.instance.stdin.write(KEYS.TAB);
  await settle();
  rendered.instance.stdin.write(KEYS.TAB);
  await settle();
  rendered.instance.stdin.write(KEYS.ENTER);
  await settle();
}

describe("Dialog", () => {
  it("floats under its declaration without moving the page", async () => {
    const { rendered, events } = await mount(program(false));
    const closed = stripAnsi(rendered.frame());
    expect(closed).not.toContain(TITLE);
    await openWithKeys(rendered);
    expect(lastFocused(events)).toBe("Close");
    const opened = stripAnsi(rendered.frame());
    expect(opened).toContain(TITLE);
    expect(opened).toContain("Keep editing or close this note.");
    expect(opened).toContain("[ Close ]");
    expect(opened.split("\n")).toHaveLength(closed.split("\n").length);
    expect(findCell(opened, fillerText(ROWS))).toEqual(findCell(closed, fillerText(ROWS)));
    // The rows after the opener are covered from the one under it, where the dialog is declared.
    const opener = findCell(closed, "[ Open ]");
    expect(dialogBox(opened).top).toEqual({ x: 0, y: opener.y + 1 });
    expect(findCell(opened, "[ Open ]")).toEqual(opener);
    rendered.unmount();
  });

  it("takes no rows of the page while closed, even in a stack with a gap", async () => {
    const without = await renderProgram(
      inkLibrary,
      'root = Stack([TextContent("above"), TextContent("below")])',
    );
    const expected = stripAnsi(without.frame());
    without.unmount();
    const { rendered } = await mount(
      [
        "$note = false",
        'root = Stack([TextContent("above"), noteDialog, TextContent("below")])',
        noteDialog(""),
      ].join("\n"),
    );
    expect(stripAnsi(rendered.frame())).toBe(expected);
    rendered.unmount();
  });

  it("leaves the page interactive: its stops sit between the opener and the next stop", async () => {
    const { rendered, events } = await mount(program(false));
    await openWithKeys(rendered);
    expect(lastFocused(events)).toBe("Close");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(lastFocused(events)).toBe("B");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    expect(lastFocused(events)).toBe("Close");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    expect(lastFocused(events)).toBe("Open");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    expect(lastFocused(events)).toBe("A");
    expect(stripAnsi(rendered.frame())).toContain(TITLE);
    rendered.unmount();
  });

  it("opens on its first stop when shown from the start", async () => {
    const { rendered, events } = await mount(program(true));
    await settle();
    expect(lastFocused(events)).toBe("Close");
    expect(ofType(events, "open")).toEqual([
      expect.objectContaining({ type: "open", component: "Dialog", name: TITLE }),
    ]);
    rendered.unmount();
  });

  it("closes on its cancel button, reports cancel and close and gives focus back to the opener", async () => {
    const { rendered, states, events } = await mount(program(false));
    await openWithKeys(rendered);
    expect(lastFocused(events)).toBe("Close");
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(states[states.length - 1]).toEqual({ $note: false });
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ type: "cancel", component: "Dialog", name: TITLE }),
    ]);
    expect(ofType(events, "close")).toEqual([
      expect.objectContaining({ type: "close", component: "Dialog", name: TITLE }),
    ]);
    expect(lastFocused(events)).toBe("Open");
    rendered.unmount();
  });

  it("leaves focus on the page when closed from there", async () => {
    const hideFromB = program(false).replace(
      'b = Button("B", @ToAssistant("B"))',
      'b = Button("B", @Set($note, false))',
    );
    const { rendered, events } = await mount(hideFromB);
    await openWithKeys(rendered);
    expect(lastFocused(events)).toBe("Close");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(lastFocused(events)).toBe("B");
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(ofType(events, "close")).toHaveLength(1);
    expect(lastFocused(events)).toBe("B");
    rendered.unmount();
  });

  it("never pulls focus back once it moved to the page, even when a resize re-measures it", async () => {
    const events: UiEvent[] = [];
    const terminal = renderTerminal(
      <InkRenderer
        response={program(true)}
        library={inkLibrary}
        isStreaming={false}
        onUiEvent={function onUiEvent(event) {
          events.push(event);
        }}
      />,
      100,
    );
    await settle();
    expect(lastFocused(events)).toBe("Close");
    terminal.stdin.write(KEYS.TAB);
    await settle();
    expect(lastFocused(events)).toBe("B");
    // A narrower terminal changes the overlay's width limit: it is measured again, hidden.
    terminal.resize(90);
    await settle();
    expect(stripAnsi(terminal.lastFrame())).toContain(TITLE);
    expect(lastFocused(events)).toBe("B");
    terminal.unmount();
  });

  it("floats under its place in a row: after the opener, before the next stop", async () => {
    const { rendered } = await mount(
      [
        "$note = true",
        `root = Stack([Stack([a, open, noteDialog, b], "row"), ${fillerRows(ROWS)}], "column", "none")`,
        'a = Button("A", @ToAssistant("A"))',
        'open = Button("Open", @Set($note, true))',
        noteDialog(""),
        'b = Button("B", @ToAssistant("B"))',
      ].join("\n"),
    );
    const frame = stripAnsi(rendered.frame());
    const opener = findCell(frame, "[ Open ]");
    const next = findCell(frame, "[ B ]");
    const box = dialogBox(frame);
    expect(box.top.y).toBe(opener.y + 1);
    expect(box.top.x).toBeGreaterThanOrEqual(opener.x + "[ Open ]".length);
    expect(box.top.x).toBeLessThan(next.x);
    rendered.unmount();
  });

  it("centres itself in the bounds with the center placement", async () => {
    const { rendered } = await mount(program(true, "center"));
    const frame = stripAnsi(rendered.frame());
    const box = dialogBox(frame);
    const left = box.top.x;
    const right = COLUMNS - (box.bottom.x + 1);
    const above = box.top.y;
    const below = frame.split("\n").length - (box.bottom.y + 1);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
    expect(Math.abs(above - below)).toBeLessThanOrEqual(1);
    rendered.unmount();
  });

  it("goes on its declaration's row, at the right, with the right placement", async () => {
    const { rendered } = await mount(program(true, "right"));
    const frame = stripAnsi(rendered.frame());
    const box = dialogBox(frame);
    const opener = findCell(frame, "[ Open ]");
    expect(box.top.y).toBe(opener.y + 1);
    expect(box.bottom.x).toBe(COLUMNS - 1);
    expect(box.top.x).toBeGreaterThan(0);
    rendered.unmount();
  });
});
