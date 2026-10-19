import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { InkRenderer } from "../src/ink-renderer";
import type { UiEvent } from "../src/ui-events";
import { stripAnsi } from "./helpers/ansi";
import { fillerRows, fillerText } from "./helpers/filler-rows";
import { findCell, type Cell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
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

const ESCAPE = "\u001b";

/** The opener's program with a dialog of two buttons, Close then Done, shown from the start by default. */
function twoButtonProgram(open = true): string {
  return program(open).replace(
    noteDialog(""),
    `noteDialog = Dialog("info", "${TITLE}", "Keep editing or close this note.", "Close", "Done", $note)`,
  );
}

/** Mounts the two-button program with the mouse on (motion reported), recording actions too. */
async function mountWithMouse() {
  const events: UiEvent[] = [];
  const actions: ActionEvent[] = [];
  const rendered = await renderProgram(inkLibrary, twoButtonProgram(), {
    mouse: true,
    onAction: function onAction(event) {
      actions.push(event);
    },
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  await settle();
  return { rendered, events, actions };
}

/** Writes `data` to the program's stdin and waits for it to settle. */
async function send(
  rendered: { instance: { stdin: { write: (data: string) => void } } },
  data: string,
): Promise<void> {
  rendered.instance.stdin.write(data);
  await settle();
}

/** Ink holds a lone Escape for 20ms in case a sequence follows. */
const ESCAPE_WAIT_MS = 60;

/** Presses Escape and waits until Ink has let it through. */
async function pressEscape(rendered: {
  instance: { stdin: { write: (data: string) => void } };
}): Promise<void> {
  rendered.instance.stdin.write(ESCAPE);
  await settle(ESCAPE_WAIT_MS);
}

/** The names of the stops that took focus after the first `skip` focus events. */
function focusedAfter(events: UiEvent[], skip: number): string[] {
  const names: string[] = [];
  for (const event of ofType(events, "focus").slice(skip)) names.push(event.name ?? "");
  return names;
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

  it("leaves the page interactive: after Escape its stops sit between the opener and the next stop", async () => {
    const { rendered, events } = await mount(program(false));
    await openWithKeys(rendered);
    expect(lastFocused(events)).toBe("Close");
    // Its stop has focus, so it has priority: Tab stays on its only stop.
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    await pressEscape(rendered);
    await send(rendered, KEYS.SHIFT_TAB);
    expect(lastFocused(events)).toBe("B");
    await send(rendered, KEYS.SHIFT_TAB);
    expect(lastFocused(events)).toBe("Close");
    await send(rendered, KEYS.SHIFT_TAB);
    expect(lastFocused(events)).toBe("Open");
    await send(rendered, KEYS.SHIFT_TAB);
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
    await pressEscape(rendered);
    await send(rendered, KEYS.SHIFT_TAB);
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
        mouse
        onUiEvent={function onUiEvent(event) {
          events.push(event);
        }}
      />,
      100,
    );
    await settle();
    expect(lastFocused(events)).toBe("Close");
    // A press on a page button moves focus there, out of the dialog.
    const a = findCell(stripAnsi(terminal.lastFrame()), "[ A ]");
    terminal.stdin.write(MOUSE.click(a.x + 2, a.y));
    await settle();
    expect(lastFocused(events)).toBe("A");
    // A narrower terminal changes the overlay's width limit: it is measured again, hidden.
    terminal.resize(90);
    await settle();
    expect(stripAnsi(terminal.lastFrame())).toContain(TITLE);
    expect(lastFocused(events)).toBe("A");
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

  it("is drawn whole under the last row of a program shorter than itself; closing it gives the rows back", async () => {
    const { rendered, events } = await mount(
      [
        "$note = true",
        "root = Stack([text, noteDialog])",
        'text = TextContent("A short answer.")',
        noteDialog(""),
      ].join("\n"),
    );
    await settle();
    const opened = stripAnsi(rendered.frame());
    expect(findCell(opened, "A short answer.")).toEqual({ x: 0, y: 0 });
    expect(opened).toContain(TITLE);
    expect(opened).toContain("Keep editing or close this note.");
    expect(opened).toContain("[ Close ]");
    const box = dialogBox(opened);
    expect(box.top.y).toBe(1);
    expect(box.bottom.y).toBe(opened.split("\n").length - 1);
    expect(lastFocused(events)).toBe("Close");
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const closed = stripAnsi(rendered.frame());
    expect(closed).not.toContain(TITLE);
    expect(closed.split("\n")).toHaveLength(1);
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

describe("Dialog priority", () => {
  it("keeps Tab inside while one of its stops has focus", async () => {
    const { rendered, events } = await mount(twoButtonProgram());
    await settle();
    expect(lastFocused(events)).toBe("Close");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Done");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    await send(rendered, KEYS.SHIFT_TAB);
    expect(lastFocused(events)).toBe("Done");
    rendered.unmount();
  });

  it("drops focus on Escape, and then Tab visits the page and the dialog in order", async () => {
    const { rendered, events } = await mount(twoButtonProgram());
    await settle();
    expect(lastFocused(events)).toBe("Close");
    await pressEscape(rendered);
    expect(ofType(events, "blur").length).toBeGreaterThan(0);
    const before = ofType(events, "focus").length;
    for (let step = 0; step < 5; step += 1) await send(rendered, KEYS.TAB);
    expect(focusedAfter(events, before)).toEqual(["A", "Open", "Close", "Done", "B"]);
    rendered.unmount();
  });

  it("never pulls focus back after Escape, even when a resize re-measures it", async () => {
    const events: UiEvent[] = [];
    const terminal = renderTerminal(
      <InkRenderer
        response={twoButtonProgram()}
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
    terminal.stdin.write(ESCAPE);
    await settle(ESCAPE_WAIT_MS);
    expect(ofType(events, "blur").length).toBeGreaterThan(0);
    const before = ofType(events, "focus").length;
    terminal.resize(90);
    await settle();
    expect(stripAnsi(terminal.lastFrame())).toContain(TITLE);
    expect(focusedAfter(events, before)).toEqual([]);
    terminal.unmount();
  });

  it("gives its stop focus back after a resize re-measures it: the hidden pass is no drop", async () => {
    const events: UiEvent[] = [];
    const terminal = renderTerminal(
      <InkRenderer
        response={twoButtonProgram()}
        library={inkLibrary}
        isStreaming={false}
        onUiEvent={function onUiEvent(event) {
          events.push(event);
        }}
      />,
      100,
    );
    await settle();
    terminal.stdin.write(KEYS.TAB);
    await settle();
    expect(lastFocused(events)).toBe("Done");
    const blurs = ofType(events, "blur").length;
    const before = ofType(events, "focus").length;
    terminal.resize(90);
    await settle();
    expect(stripAnsi(terminal.lastFrame())).toContain(TITLE);
    // Its stops went inert while it was measured again, hidden: Done lost focus and got it back.
    expect(ofType(events, "blur").length).toBeGreaterThan(blurs);
    expect(focusedAfter(events, before)).toEqual(["Done"]);
    terminal.unmount();
  });

  it("keeps the arrows inside while one of its stops has focus", async () => {
    const { rendered, events } = await mount(twoButtonProgram());
    await settle();
    expect(lastFocused(events)).toBe("Close");
    const before = ofType(events, "focus").length;
    for (const key of [KEYS.UP, KEYS.RIGHT, KEYS.DOWN, KEYS.LEFT, KEYS.UP, KEYS.LEFT]) {
      await send(rendered, key);
    }
    const reached = focusedAfter(events, before);
    expect(reached.length).toBeGreaterThan(0);
    for (const name of reached) expect(["Close", "Done"]).toContain(name);
    rendered.unmount();
  });

  it("takes Tab while the pointer is over it, even over one of its buttons", async () => {
    const { rendered, events } = await mountWithMouse();
    await pressEscape(rendered);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("A");
    const title = findCell(stripAnsi(rendered.frame()), TITLE);
    await send(rendered, MOUSE.move(title.x, title.y));
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Done");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    // Over one of its buttons the pointer is still inside it: once Escape drops the focus
    // the hovered button took, Tab still cycles inside.
    const done = findCell(stripAnsi(rendered.frame()), "[ Done ]");
    await send(rendered, MOUSE.move(done.x + 2, done.y));
    expect(lastFocused(events)).toBe("Done");
    await pressEscape(rendered);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    rendered.unmount();
  });

  it("gives Tab back once the pointer leaves it with no stop of its own focused", async () => {
    const { rendered, events } = await mountWithMouse();
    await pressEscape(rendered);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("A");
    const frame = stripAnsi(rendered.frame());
    const title = findCell(frame, TITLE);
    const page = findCell(frame, fillerText(ROWS));
    await send(rendered, MOUSE.move(title.x, title.y));
    await send(rendered, MOUSE.move(page.x, page.y));
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Open");
    rendered.unmount();
  });

  it("keeps Tab after the pointer leaves while one of its stops has focus", async () => {
    const { rendered, events } = await mountWithMouse();
    await pressEscape(rendered);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("A");
    const frame = stripAnsi(rendered.frame());
    const title = findCell(frame, TITLE);
    const page = findCell(frame, fillerText(ROWS));
    await send(rendered, MOUSE.move(title.x, title.y));
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    await send(rendered, MOUSE.move(page.x, page.y));
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Done");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    rendered.unmount();
  });

  it("leaves focus where it is on Escape while it only has the pointer", async () => {
    const { rendered, events } = await mountWithMouse();
    await pressEscape(rendered);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("A");
    const title = findCell(stripAnsi(rendered.frame()), TITLE);
    await send(rendered, MOUSE.move(title.x, title.y));
    const blurs = ofType(events, "blur").length;
    await pressEscape(rendered);
    expect(ofType(events, "blur")).toHaveLength(blurs);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    rendered.unmount();
  });

  it("lets a click on a page button fire it while open", async () => {
    const { rendered, actions } = await mountWithMouse();
    const frame = stripAnsi(rendered.frame());
    expect(frame).toContain(TITLE);
    const a = findCell(frame, "[ A ]");
    await send(rendered, MOUSE.click(a.x + 2, a.y));
    expect(actions).toHaveLength(1);
    expect(actions[0]?.humanFriendlyMessage).toBe("A");
    rendered.unmount();
  });

  it("takes priority back when the pointer gives one of its stops focus after an Escape", async () => {
    const { rendered, events } = await mountWithMouse();
    expect(lastFocused(events)).toBe("Close");
    const frame = stripAnsi(rendered.frame());
    const close = findCell(frame, "[ Close ]");
    const done = findCell(frame, "[ Done ]");
    const page = findCell(frame, fillerText(ROWS));
    await send(rendered, MOUSE.move(close.x + 2, close.y));
    // Escape with the pointer already inside: focus is dropped and the priority by focus released.
    await pressEscape(rendered);
    // Moving within the dialog onto Done focuses it (hover focus): the dialog has priority again.
    await send(rendered, MOUSE.move(done.x + 2, done.y));
    expect(lastFocused(events)).toBe("Done");
    await send(rendered, MOUSE.move(page.x, page.y));
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    rendered.unmount();
  });

  it("takes priority back when it opens again after an Escape", async () => {
    const { rendered, events } = await mount(twoButtonProgram(false));
    await openWithKeys(rendered);
    expect(lastFocused(events)).toBe("Close");
    await pressEscape(rendered);
    // Released: Tab walks the page into the dialog without being kept there.
    for (let step = 0; step < 3; step += 1) await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    // Its cancel button closes it and gives focus back to the opener, which opens it again.
    await send(rendered, KEYS.ENTER);
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(lastFocused(events)).toBe("Open");
    await send(rendered, KEYS.ENTER);
    expect(stripAnsi(rendered.frame())).toContain(TITLE);
    expect(lastFocused(events)).toBe("Close");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Done");
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("Close");
    rendered.unmount();
  });
});
