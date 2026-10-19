import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import type { UiEvent } from "../src/ui-events";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { fillerRows } from "./helpers/filler-rows";
import { findCell, type Cell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram, type RenderedProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

/** ink-testing-library's terminal width: the bounds overlays are clamped into. */
const COLUMNS = 100;
const ROWS = 12;
const MODAL_TITLE = "Delete Carlos Ruiz?";
const NOTE_TITLE = "Draft saved";
const ESCAPE = "\u001b";
const ESCAPE_WAIT_TURNS = 60;
const DRAG_TYPES = ["dragstart", "drag", "dragend"];

/** The open ModalDialog over a page; `extra` adds trailing arguments (`null, null, false`). */
function modalDialogProgram(open: boolean, extra = ""): string {
  const trailing = extra === "" ? "" : `, ${extra}`;
  return [
    `$confirm = ${open}`,
    `root = Stack([outside, dialog, after, ${fillerRows(ROWS)}], "column", "none")`,
    'outside = Button("Outside", @Set($confirm, true))',
    'after = TextContent("row after the dialog")',
    `dialog = ModalDialog("destructive", "${MODAL_TITLE}", "Carlos Ruiz will no longer appear in your contacts.", "Cancel", "Delete contact", $confirm${trailing})`,
  ].join("\n");
}

/** Button A, the opener, an open non-modal Dialog, button B and filler rows. */
function noteProgram(rows = ROWS): string {
  return [
    "$note = true",
    `root = Stack([a, open, noteDialog, b, ${fillerRows(rows)}])`,
    'a = Button("A", @ToAssistant("A"))',
    'open = Button("Open", @Set($note, true))',
    `noteDialog = Dialog("info", "${NOTE_TITLE}", "Keep editing or close this note.", "Close", null, $note)`,
    'b = Button("B", @ToAssistant("B"))',
  ].join("\n");
}

/** The note program with an open ModalDialog too, on a page tall enough that the two do not overlap. */
function noteAndModalProgram(): string {
  return [
    noteProgram(30).replace(
      "root = Stack([a, open, noteDialog, b,",
      "root = Stack([a, open, noteDialog, dialog, b,",
    ),
    "$confirm = true",
    `dialog = ModalDialog("destructive", "${MODAL_TITLE}", "Carlos Ruiz will no longer appear.", "Cancel", "Delete contact", $confirm)`,
  ].join("\n");
}

/** A generic Modal with a text and a button, open over a page. */
function modalProgram(): string {
  return [
    "$show = true",
    `root = Stack([open, Modal("Confirm", $show, [TextContent("Are you sure?"), Buttons([Button("Yes", @ToAssistant("Yes"))])]), after, ${fillerRows(ROWS)}], "column", "none")`,
    'open = Button("Open", @Set($show, true))',
    'after = TextContent("row after the modal")',
  ].join("\n");
}

async function mount(source: string, mouse: boolean) {
  const events: UiEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    mouse,
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  await settle();
  return { rendered, events };
}

async function send(rendered: RenderedProgram, data: string): Promise<void> {
  rendered.instance.stdin.write(data);
  await settle();
}

function plain(rendered: RenderedProgram): string {
  return stripAnsi(rendered.frame());
}

function dragEvents(events: UiEvent[]): UiEvent[] {
  return events.filter(function isDrag(event) {
    return DRAG_TYPES.includes(event.type);
  });
}

function lastFocused(events: UiEvent[]): string {
  const focused = events.filter(function isFocus(event) {
    return event.type === "focus";
  });
  return focused[focused.length - 1]?.name ?? "";
}

function countOf(events: UiEvent[], type: string): number {
  let count = 0;
  for (const event of events) {
    if (event.type === type) count += 1;
  }
  return count;
}

function moved(cell: Cell, dx: number, dy: number): Cell {
  return { x: cell.x + dx, y: cell.y + dy };
}

describe("dialog drag by the title bar", () => {
  it("moves a ModalDialog by the pointer's travel and reports dragstart, drag, drag, dragend", async () => {
    const closed = await mount(modalDialogProgram(false), true);
    const closedLines = plain(closed.rendered).split("\n");
    closed.rendered.unmount();
    const { rendered, events } = await mount(modalDialogProgram(true), true);
    const before = plain(rendered);
    const title = findCell(before, MODAL_TITLE);
    const corner = findCell(before, "╭");
    const outside = findCell(before, "[ Outside ]");

    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(title.x + 2, title.y + 1));
    // While held, the title is drawn bold and inverse.
    expect(inverseSegments(rendered.frame())).toContain(MODAL_TITLE);
    await send(rendered, MOUSE.drag(title.x + 4, title.y + 2));
    await send(rendered, MOUSE.release(title.x + 4, title.y + 2));

    const after = plain(rendered);
    expect(findCell(after, MODAL_TITLE)).toEqual(moved(title, 4, 2));
    expect(findCell(after, "╭")).toEqual(moved(corner, 4, 2));
    expect(inverseSegments(rendered.frame())).not.toContain(MODAL_TITLE);
    expect(dragEvents(events)).toEqual([
      { type: "dragstart", component: "ModalDialog", name: MODAL_TITLE, x: title.x, y: title.y },
      { type: "drag", component: "ModalDialog", name: MODAL_TITLE, x: title.x + 2, y: title.y + 1 },
      { type: "drag", component: "ModalDialog", name: MODAL_TITLE, x: title.x + 4, y: title.y + 2 },
      {
        type: "dragend",
        component: "ModalDialog",
        name: MODAL_TITLE,
        x: title.x + 4,
        y: title.y + 2,
      },
    ]);
    // The page keeps its layout; the rows the dialog left show the page again.
    expect(findCell(after, "[ Outside ]")).toEqual(outside);
    const afterLines = after.split("\n");
    expect(afterLines).toHaveLength(closedLines.length);
    expect(afterLines[corner.y]).toBe(closedLines[corner.y]);
    expect(afterLines[corner.y + 1]).toBe(closedLines[corner.y + 1]);
    rendered.unmount();
  });

  it("clamps a dialog released past the right edge to end at the last column", async () => {
    const { rendered, events } = await mount(modalDialogProgram(true), true);
    const title = findCell(plain(rendered), MODAL_TITLE);
    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(COLUMNS + 20, title.y));
    await send(rendered, MOUSE.release(COLUMNS + 20, title.y));

    const lines = plain(rendered).split("\n");
    const corner = findCell(plain(rendered), "╭");
    expect(Array.from(lines[corner.y] ?? "")[COLUMNS - 1]).toBe("╮");
    expect(corner.y).toBe(title.y - 1);
    const ended = dragEvents(events).filter(function isEnd(event) {
      return event.type === "dragend";
    });
    expect(ended).toEqual([
      { type: "dragend", component: "ModalDialog", name: MODAL_TITLE, x: COLUMNS + 20, y: title.y },
    ]);
    rendered.unmount();
  });

  it("keeps no excess from a drag past the edge: dragged back 5 cells, it moves 5 cells", async () => {
    const { rendered, events } = await mount(modalDialogProgram(true), true);
    const title = findCell(plain(rendered), MODAL_TITLE);
    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(COLUMNS + 20, title.y));
    await send(rendered, MOUSE.release(COLUMNS + 20, title.y));
    const clamped = findCell(plain(rendered), MODAL_TITLE);
    expect(clamped.x).toBeGreaterThan(title.x);

    await send(rendered, MOUSE.press(clamped.x, clamped.y));
    await send(rendered, MOUSE.drag(clamped.x - 5, clamped.y));
    await send(rendered, MOUSE.release(clamped.x - 5, clamped.y));
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(moved(clamped, -5, 0));

    // Back at the right edge, Ctrl+Right cannot move it: nothing is reported.
    await send(rendered, MOUSE.press(clamped.x - 5, clamped.y));
    await send(rendered, MOUSE.drag(COLUMNS + 20, clamped.y));
    await send(rendered, MOUSE.release(COLUMNS + 20, clamped.y));
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(clamped);
    const reported = dragEvents(events).length;
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(clamped);
    expect(dragEvents(events)).toHaveLength(reported);
    await send(rendered, KEYS.CTRL_LEFT);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(moved(clamped, -1, 0));
    rendered.unmount();
  });

  it("does not drag while streaming, and a drag that streaming interrupts ends", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(inkLibrary, modalDialogProgram(true), {
      mouse: true,
      isStreaming: true,
      onUiEvent: function onUiEvent(event) {
        events.push(event);
      },
    });
    await settle();
    const title = findCell(plain(rendered), MODAL_TITLE);
    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(title.x + 4, title.y + 2));
    await send(rendered, MOUSE.release(title.x + 4, title.y + 2));
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);
    expect(dragEvents(events)).toEqual([]);

    await rendered.update({ isStreaming: false });
    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(title.x + 2, title.y));
    await rendered.update({ isStreaming: true });
    expect(inverseSegments(rendered.frame())).not.toContain(MODAL_TITLE);
    await send(rendered, MOUSE.drag(title.x + 6, title.y));
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(moved(title, 2, 0));
    expect(
      dragEvents(events).map(function typeOf(event) {
        return event.type;
      }),
    ).toEqual(["dragstart", "drag", "dragend"]);
    rendered.unmount();
  });

  it("forgets a drag its dialog closed in the middle of: reopened, it is not dragging", async () => {
    const { rendered, events } = await mount(modalDialogProgram(true), true);
    const title = findCell(plain(rendered), MODAL_TITLE);
    await send(rendered, MOUSE.press(title.x, title.y));
    // Escape cancels the modal while the button is still held; its release is never seen.
    rendered.instance.stdin.write(ESCAPE);
    await settle(ESCAPE_WAIT_TURNS);
    expect(plain(rendered)).not.toContain(MODAL_TITLE);
    await send(rendered, KEYS.TAB);
    await send(rendered, KEYS.ENTER);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);
    expect(inverseSegments(rendered.frame())).not.toContain(MODAL_TITLE);
    await send(rendered, MOUSE.move(title.x + 3, title.y + 1));
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);
    // The drag ended when the dialog closed, where the pointer was last.
    expect(dragEvents(events)).toEqual([
      { type: "dragstart", component: "ModalDialog", name: MODAL_TITLE, x: title.x, y: title.y },
      { type: "dragend", component: "ModalDialog", name: MODAL_TITLE, x: title.x, y: title.y },
    ]);
    rendered.unmount();
  });

  it("does not move a dialog with draggable false, and reports no drag events", async () => {
    const { rendered, events } = await mount(modalDialogProgram(true, "null, null, false"), true);
    const title = findCell(plain(rendered), MODAL_TITLE);
    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(title.x + 4, title.y + 2));
    await send(rendered, MOUSE.release(title.x + 4, title.y + 2));
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);
    expect(dragEvents(events)).toEqual([]);
    rendered.unmount();
  });

  it("moves a generic Modal by its title row", async () => {
    const { rendered, events } = await mount(modalProgram(), true);
    const title = findCell(plain(rendered), "Confirm");
    await send(rendered, MOUSE.press(title.x, title.y));
    await send(rendered, MOUSE.drag(title.x + 4, title.y + 2));
    await send(rendered, MOUSE.release(title.x + 4, title.y + 2));
    expect(findCell(plain(rendered), "Confirm")).toEqual(moved(title, 4, 2));
    expect(findCell(plain(rendered), "[ x ]").y).toBe(title.y + 2);
    expect(
      dragEvents(events).map(function typeOf(event) {
        return `${event.type} ${event.component} ${event.name}`;
      }),
    ).toEqual(["dragstart Modal Confirm", "drag Modal Confirm", "dragend Modal Confirm"]);
    rendered.unmount();
  });
});

describe("dialog moves with Ctrl+arrows", () => {
  it("moves a ModalDialog one cell per Ctrl+arrow while one of its stops has focus, keeping focus", async () => {
    const { rendered, events } = await mount(modalDialogProgram(true), false);
    expect(lastFocused(events)).toBe("Cancel");
    const focusCount = countOf(events, "focus");
    const title = findCell(plain(rendered), MODAL_TITLE);

    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(moved(title, 1, 0));
    await send(rendered, KEYS.CTRL_DOWN);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(moved(title, 1, 1));
    await send(rendered, KEYS.CTRL_LEFT);
    await send(rendered, KEYS.CTRL_UP);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(title);

    expect(countOf(events, "focus")).toBe(focusCount);
    expect(lastFocused(events)).toBe("Cancel");
    expect(countOf(events, "dragend")).toBe(4);
    rendered.unmount();
  });

  it("moves a Dialog while its stop has focus, and not once focus is on a page button", async () => {
    const { rendered, events } = await mount(noteProgram(), false);
    expect(lastFocused(events)).toBe("Close");
    const title = findCell(plain(rendered), NOTE_TITLE);
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), NOTE_TITLE)).toEqual(moved(title, 1, 0));
    // The focused dialog holds Tab: Escape gives it up, then Tab reaches A, on the page.
    rendered.instance.stdin.write(ESCAPE);
    // Ink waits for the rest of an escape sequence before it reports a lone Escape.
    await settle(ESCAPE_WAIT_TURNS);
    await send(rendered, KEYS.TAB);
    expect(lastFocused(events)).toBe("A");
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), NOTE_TITLE)).toEqual(moved(title, 1, 0));
    rendered.unmount();
  });

  it("reports nothing for a Ctrl+arrow that cannot move the dialog, at the left edge", async () => {
    const { rendered, events } = await mount(noteProgram(), false);
    const corner = findCell(plain(rendered), "╭");
    expect(corner.x).toBe(0);
    await send(rendered, KEYS.CTRL_LEFT);
    expect(findCell(plain(rendered), "╭")).toEqual(corner);
    expect(dragEvents(events)).toEqual([]);
    // No excess was kept: one Ctrl+Right moves it one cell, reported from the corner.
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), "╭")).toEqual(moved(corner, 1, 0));
    expect(dragEvents(events)).toEqual([
      { type: "dragstart", component: "Dialog", name: NOTE_TITLE, x: corner.x, y: corner.y },
      { type: "drag", component: "Dialog", name: NOTE_TITLE, x: corner.x + 1, y: corner.y },
      { type: "dragend", component: "Dialog", name: NOTE_TITLE, x: corner.x + 1, y: corner.y },
    ]);
    rendered.unmount();
  });

  it("moves a Modal with a focused Slider and leaves the slider's value alone", async () => {
    const { rendered } = await mount(
      [
        "$show = true",
        `root = Stack([Modal("Settings", $show, [Slider("volume", "discrete", 0, 10, 2, [4], "Volume")]), ${fillerRows(ROWS)}], "column", "none")`,
      ].join("\n"),
      false,
    );
    expect(inverseSegments(rendered.frame())).toEqual(["4"]);
    const title = findCell(plain(rendered), "Settings");
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), "Settings")).toEqual(moved(title, 1, 0));
    expect(plain(rendered)).toContain("┤ 4");
    await send(rendered, KEYS.RIGHT);
    expect(plain(rendered)).toContain("┤ 6");
    rendered.unmount();
  });

  it("moves the open modal, not a page Dialog, while a modal is open", async () => {
    const { rendered, events } = await mount(noteAndModalProgram(), false);
    expect(lastFocused(events)).toBe("Cancel");
    const note = findCell(plain(rendered), NOTE_TITLE);
    const modal = findCell(plain(rendered), MODAL_TITLE);
    await send(rendered, KEYS.CTRL_RIGHT);
    expect(findCell(plain(rendered), MODAL_TITLE)).toEqual(moved(modal, 1, 0));
    expect(findCell(plain(rendered), NOTE_TITLE)).toEqual(note);
    rendered.unmount();
  });
});
