import { Box, useWindowSize } from "ink";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { inkLibrary } from "../../src/default-library";
import { focusOrder, type FocusStop } from "../../src/focus/focus-order";
import { FocusRegistryContext, type FocusRegistry } from "../../src/focus/focus-registry";
import { FocusScope } from "../../src/focus/focus-scope";
import { InkRenderer } from "../../src/ink-renderer";
import { createLibrary, defineComponent, type Library } from "../../src/library";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import type { UiEvent } from "../../src/ui-events";
import { stripAnsi } from "../helpers/ansi";
import { fillerRows } from "../helpers/filler-rows";
import { findCell, type Cell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { renderTerminal, type RenderedTerminal } from "../helpers/render-terminal";
import { settle } from "../helpers/settle";

const NOTE_TITLE = "Draft saved";
const MODAL_TITLE = "Delete Carlos Ruiz?";
/** 80 cells: one row at 100 columns, two at 60, so everything under it moves down a row. */
const INTRO = "Intro text that is long enough to wrap onto a second row in a narrower terminal..";
const MODE_SEQUENCES_ONLY = /^(\u001b\[\?\d+[hl])+$/;

/** The registry the latest Probe rendered with. */
const probed: { registry: FocusRegistry | null } = { registry: null };

function ProbeRenderer() {
  probed.registry = useContext(FocusRegistryContext);
  return null;
}

/** Keeps the renderer's focus registry, so a test can read each stop's anchor. */
const Probe = defineComponent({
  name: "Probe",
  description: "Records the focus registry it renders in",
  props: z.object({}),
  component: ProbeRenderer,
});

const probeLibrary: Library = createLibrary({
  root: "Stack",
  components: Object.values(inkLibrary.components).concat([Probe]),
});

interface Mounted {
  terminal: RenderedTerminal;
  events: UiEvent[];
}

async function mount(source: string, columns: number): Promise<Mounted> {
  const events: UiEvent[] = [];
  const terminal = renderTerminal(
    <InkRenderer
      response={source}
      library={probeLibrary}
      isStreaming={false}
      mouse
      onUiEvent={function onUiEvent(event) {
        events.push(event);
      }}
    />,
    columns,
  );
  await settle();
  return { terminal, events };
}

async function send(terminal: RenderedTerminal, data: string): Promise<void> {
  terminal.stdin.write(data);
  await settle();
}

async function resize(terminal: RenderedTerminal, columns: number, rows?: number): Promise<void> {
  terminal.resize(columns, rows);
  await settle();
}

/** The last frame Ink drew, without colours; mode toggles (mouse reporting) are skipped. */
function plain(terminal: RenderedTerminal): string {
  for (let index = terminal.frames.length - 1; index >= 0; index -= 1) {
    const frame = terminal.frames[index] ?? "";
    if (!MODE_SEQUENCES_ONLY.test(frame)) return stripAnsi(frame);
  }
  return "";
}

/** The plain frame of `source` with its dialog closed, at `columns`: where the page's stops are. */
async function closedFrame(source: string, columns: number): Promise<string> {
  const closed = await mount(source.replace("$note = true", "$note = false"), columns);
  const frame = plain(closed.terminal);
  closed.terminal.unmount();
  return frame;
}

function focusedNames(events: UiEvent[]): string[] {
  const names: string[] = [];
  for (const event of events) {
    if (event.type === "focus") names.push(event.name ?? "");
  }
  return names;
}

function moved(cell: Cell, dx: number, dy: number): Cell {
  return { x: cell.x + dx, y: cell.y + dy };
}

/** The width of the box whose top-left corner is the first `╭` of the frame. */
function boxWidth(frame: string): number {
  const corner = findCell(frame, "╭");
  const line = Array.from(frame.split("\n")[corner.y] ?? "");
  return line.indexOf("╮", corner.x) - corner.x + 1;
}

/** The stops of a probed registry by name. */
function stopsByName(registry: FocusRegistry | null): Map<string, FocusStop> {
  const byName = new Map<string, FocusStop>();
  if (registry === null) return byName;
  for (const stop of focusOrder(registry)) byName.set(stop.name, stop);
  return byName;
}

/** Drags the dialog by its title so its top-left corner lands on `target`, and drops it there. */
async function dragCornerTo(terminal: RenderedTerminal, title: string, target: Cell) {
  const frame = plain(terminal);
  const grab = findCell(frame, title);
  const corner = findCell(frame, "╭");
  const to = moved(grab, target.x - corner.x, target.y - corner.y);
  await send(terminal, MOUSE.press(grab.x, grab.y));
  await send(terminal, MOUSE.drag(to.x, to.y));
  await send(terminal, MOUSE.release(to.x, to.y));
}

/** Button A, the opener, an open non-modal Dialog and B, under an intro that wraps when narrow. */
function noteProgram(): string {
  return [
    "$note = true",
    `root = Stack([intro, a, open, noteDialog, b, ${fillerRows(6)}, probe])`,
    `intro = TextContent("${INTRO}")`,
    'a = Button("A", @ToAssistant("A"))',
    'open = Button("Open", @Set($note, true))',
    `noteDialog = Dialog("info", "${NOTE_TITLE}", "Keep editing or close this note.", "Close", null, $note)`,
    'b = Button("B", @ToAssistant("B"))',
    "probe = Probe()",
  ].join("\n");
}

function modalProgram(): string {
  return [
    "$confirm = true",
    `root = Stack([dialog, ${fillerRows(12)}], "column", "none")`,
    `dialog = ModalDialog("destructive", "${MODAL_TITLE}", "Carlos Ruiz will no longer appear in your contacts, and his history goes with him.", "Cancel", "Delete contact", $confirm)`,
  ].join("\n");
}

describe("overlays across a terminal resize", () => {
  it("keeps the base Tab order: a wrapping row visits the same stops at either width", async () => {
    const buttons: string[] = [];
    for (let index = 1; index <= 6; index += 1) {
      buttons.push(`Button("Button ${index}", @ToAssistant("${index}"))`);
    }
    const source = `root = Stack([${buttons.join(", ")}], "row", "s", null, null, true)`;
    const { terminal, events } = await mount(source, 100);
    // One row at 100 columns; wrapped at 60.
    let frame = plain(terminal);
    expect(findCell(frame, "[ Button 6 ]").y).toBe(findCell(frame, "[ Button 1 ]").y);

    for (let step = 0; step < 3; step += 1) await send(terminal, KEYS.TAB);
    expect(focusedNames(events)).toEqual(["Button 1", "Button 2", "Button 3"]);
    await resize(terminal, 60);
    frame = plain(terminal);
    expect(findCell(frame, "[ Button 6 ]").y).toBeGreaterThan(findCell(frame, "[ Button 1 ]").y);
    // The next Tab continues from Button 3; a whole cycle at 60 columns.
    for (let step = 0; step < 9; step += 1) await send(terminal, KEYS.TAB);
    const narrow = focusedNames(events).slice(3);
    await resize(terminal, 100);
    for (let step = 0; step < 6; step += 1) await send(terminal, KEYS.TAB);
    const wide = focusedNames(events).slice(12);

    const cycle = ["Button 1", "Button 2", "Button 3", "Button 4", "Button 5", "Button 6"];
    expect(narrow).toEqual(["Button 4", "Button 5", "Button 6"].concat(cycle));
    expect(wide).toEqual(cycle);
    terminal.unmount();
  });

  it("moves a never-dragged bottom Dialog with its declaration when a width change moves it", async () => {
    const { terminal } = await mount(noteProgram(), 100);
    const wideFrame = plain(terminal);
    const wideOpen = findCell(wideFrame, "[ Open ]");
    const wideCorner = findCell(wideFrame, "╭");

    await resize(terminal, 60);
    const narrowFrame = plain(terminal);
    const narrowOpen = findCell(narrowFrame, "[ Open ]");
    const narrowCorner = findCell(narrowFrame, "╭");
    // The intro wraps: the declaration is a row lower, and the dialog with it, unmoved by any offset.
    expect(narrowOpen).toEqual(moved(wideOpen, 0, 1));
    expect(narrowCorner).toEqual(moved(wideCorner, 0, 1));
    terminal.unmount();
  });

  it("keeps a dragged dialog's anchor stop and offset when the terminal widens, clamped when it shrinks", async () => {
    const source = noteProgram();
    const narrowB = findCell(await closedFrame(source, 60), "[ B ]");
    const wideB = findCell(await closedFrame(source, 100), "[ B ]");
    const { terminal } = await mount(source, 60);
    // Its own registry: the closed renders below probe theirs too.
    const registry = probed.registry;

    // Dropped 4 cells right of and 3 rows below B's top-left: re-anchored to B, the last stop
    // before that cell, at that offset from B.
    await dragCornerTo(terminal, NOTE_TITLE, moved(narrowB, 4, 3));
    expect(findCell(plain(terminal), "╭")).toEqual(moved(narrowB, 4, 3));
    let stops = stopsByName(registry);
    expect(stops.get("Close")?.anchor).toBe(stops.get("B")?.id);
    const anchorId = stops.get("B")?.id;

    // Wider: the intro takes one row, B goes up a row, the dialog follows it with the same offset.
    expect(wideB).toEqual(moved(narrowB, 0, -1));
    await resize(terminal, 100);
    expect(findCell(plain(terminal), "╭")).toEqual(moved(wideB, 4, 3));
    stops = stopsByName(registry);
    expect(stops.get("B")?.id).toBe(anchorId);
    expect(stops.get("Close")?.anchor).toBe(anchorId);

    // Narrower than the dialog plus its offset: the drawn form is clamped inside the right edge.
    const width = boxWidth(plain(terminal));
    const columns = narrowB.x + 4 + width - 2;
    const shrunkB = findCell(await closedFrame(source, columns), "[ B ]");
    await resize(terminal, columns);
    const clamped = findCell(plain(terminal), "╭");
    expect(clamped).toEqual({ x: columns - width, y: shrunkB.y + 3 });
    expect(stopsByName(registry).get("Close")?.anchor).toBe(anchorId);

    // The next press drops the excess the clamp cut off: dragged 1 cell left, it moves 1 cell.
    const title = findCell(plain(terminal), NOTE_TITLE);
    await send(terminal, MOUSE.press(title.x, title.y));
    await send(terminal, MOUSE.drag(title.x - 1, title.y));
    expect(findCell(plain(terminal), "╭")).toEqual(moved(clamped, -1, 0));
    await send(terminal, MOUSE.release(title.x - 1, title.y));
    expect(findCell(plain(terminal), "╭")).toEqual(moved(clamped, -1, 0));
    terminal.unmount();
  });

  it("re-centres a modal after a resize", async () => {
    const { terminal } = await mount(modalProgram(), 100);
    function margins(columns: number): { left: number; right: number } {
      const frame = plain(terminal);
      const corner = findCell(frame, "╭");
      return { left: corner.x, right: columns - corner.x - boxWidth(frame) };
    }
    const wide = margins(100);
    expect(Math.abs(wide.left - wide.right)).toBeLessThanOrEqual(1);
    await resize(terminal, 70);
    const narrow = margins(70);
    expect(Math.abs(narrow.left - narrow.right)).toBeLessThanOrEqual(1);
    expect(narrow.left).toBeLessThan(wide.left);
    terminal.unmount();
  });

  it("follows the pointer from where a resize put the dialog, in the middle of a drag", async () => {
    const { terminal, events } = await mount(modalProgram(), 100);
    // Dragged against the right edge and dropped: its offset is what is drawn there.
    const start = findCell(plain(terminal), MODAL_TITLE);
    await send(terminal, MOUSE.press(start.x, start.y));
    await send(terminal, MOUSE.drag(start.x + 60, start.y));
    await send(terminal, MOUSE.release(start.x + 60, start.y));
    const width = boxWidth(plain(terminal));
    expect(findCell(plain(terminal), "╭").x).toBe(100 - width);

    // Pressed, then the terminal narrows: re-centred, the offset now pushes it past the right edge.
    const title = findCell(plain(terminal), MODAL_TITLE);
    await send(terminal, MOUSE.press(title.x, title.y));
    await resize(terminal, 70);
    const resized = findCell(plain(terminal), "╭");
    expect(resized.x).toBe(70 - width);

    // Each move takes the dialog by the pointer's travel from the new position, never more.
    const before = events.length;
    await send(terminal, MOUSE.drag(title.x - 3, title.y));
    expect(findCell(plain(terminal), "╭")).toEqual(moved(resized, -3, 0));
    await send(terminal, MOUSE.drag(title.x - 5, title.y + 1));
    expect(findCell(plain(terminal), "╭")).toEqual(moved(resized, -5, 1));
    await send(terminal, MOUSE.release(title.x - 5, title.y + 1));
    expect(findCell(plain(terminal), "╭")).toEqual(moved(resized, -5, 1));
    const reported = events.slice(before).filter(function isDrag(event) {
      return event.type === "drag" || event.type === "dragend";
    });
    expect(
      reported.map(function where(event) {
        return `${event.type} ${event.x},${event.y}`;
      }),
    ).toEqual([
      `drag ${title.x - 3},${title.y}`,
      `drag ${title.x - 5},${title.y + 1}`,
      `dragend ${title.x - 5},${title.y + 1}`,
    ]);
    terminal.unmount();
  });
});

/** 83 cells: one row at 100 columns, three at 40, so a narrower terminal adds rows under K. */
const TAIL = "Tail text that is long enough to wrap onto several rows in a narrow terminal width.";

/** Cells right of K's top-left where the dialog is dropped, on K's row: it re-anchors to K. */
const RIGHT_OF_K = 10;

/**
 * Button S, the note Dialog declared under it, eight text rows, button K,
 * then `below` (references to rows defined in the program) and a tail that
 * wraps when narrow.
 */
function stopProgram(below: string[]): string {
  const above: string[] = [];
  for (let index = 0; index < 8; index += 1) above.push(`TextContent("above ${index}")`);
  const children = ["s", "noteDialog"].concat(above, ["k"], below, ["tail"]);
  return [
    "$note = true",
    `root = Stack([${children.join(", ")}], "column", "none")`,
    's = Button("S", @ToAssistant("S"))',
    `noteDialog = Dialog("info", "${NOTE_TITLE}", "Keep editing.", "Close", null, $note)`,
    'k = Button("K", @ToAssistant("K"))',
    `tail = TextContent("${TAIL}")`,
  ].join("\n");
}

/** `count` one-row texts for `stopProgram`'s `below`. */
function textRows(count: number): string[] {
  const rows: string[] = [];
  for (let index = 0; index < count; index += 1) rows.push(`TextContent("below ${index}")`);
  return rows;
}

/** The height of the box whose top-left corner is the first `╭` of the frame. */
function boxHeight(frame: string): number {
  return findCell(frame, "╰").y - findCell(frame, "╭").y + 1;
}

/** The note dialog's height, in rows, as `stopProgram` draws it. */
async function noteHeight(): Promise<number> {
  const { terminal } = await mount(stopProgram([]), 100);
  const height = boxHeight(plain(terminal));
  terminal.unmount();
  return height;
}

/** Where the dialog's corner is, relative to K's top-left. */
function cornerFromK(frame: string): Cell {
  const k = findCell(frame, "[ K ]");
  const corner = findCell(frame, "╭");
  return { x: corner.x - k.x, y: corner.y - k.y };
}

/** Drags the note dialog onto K's row, `RIGHT_OF_K` cells right of K: it re-anchors to K. */
async function dropRightOfK(terminal: RenderedTerminal): Promise<void> {
  const k = findCell(plain(terminal), "[ K ]");
  await dragCornerTo(terminal, NOTE_TITLE, moved(k, RIGHT_OF_K, 0));
  expect(cornerFromK(plain(terminal))).toEqual({ x: RIGHT_OF_K, y: 0 });
}

interface FullScreenProps {
  source: string;
}

/**
 * The program in a scope as tall as the terminal, as a full-screen app hosts
 * it: the overlays' bounds are the terminal's rows.
 */
function FullScreen({ source }: FullScreenProps) {
  const rows = useWindowSize().rows;
  return (
    <MouseProvider options={{ motion: true }}>
      <FocusScope>
        <Box flexDirection="column" height={rows}>
          <InkRenderer response={source} library={probeLibrary} isStreaming={false} />
        </Box>
      </FocusScope>
    </MouseProvider>
  );
}

describe("a re-anchored dialog across a resize", () => {
  it("keeps its offset from its stop when a narrower terminal makes room under the stop", async () => {
    // One row short of room under K at 100 columns; the tail wraps at 40 and makes room.
    const source = stopProgram(textRows((await noteHeight()) - 2));
    const { terminal } = await mount(source, 100);
    await dropRightOfK(terminal);

    await resize(terminal, 40);
    expect(cornerFromK(plain(terminal))).toEqual({ x: RIGHT_OF_K, y: 0 });
    await resize(terminal, 100);
    expect(cornerFromK(plain(terminal))).toEqual({ x: RIGHT_OF_K, y: 0 });
    terminal.unmount();
  });

  it("keeps its offset from its stop when a wider terminal takes rows from under the stop", async () => {
    const source = stopProgram(textRows((await noteHeight()) - 2));
    const { terminal } = await mount(source, 40);
    await dropRightOfK(terminal);

    await resize(terminal, 100);
    expect(cornerFromK(plain(terminal))).toEqual({ x: RIGHT_OF_K, y: 0 });
    await resize(terminal, 40);
    expect(cornerFromK(plain(terminal))).toEqual({ x: RIGHT_OF_K, y: 0 });
    terminal.unmount();
  });

  it("stays put against its stop when content under the stop grows: an accordion opens", async () => {
    // One row short of room under K until the section opens.
    const below = ["more"].concat(textRows((await noteHeight()) - 3));
    const source = [
      stopProgram(below),
      'more = Accordion([AccordionItem("more", "More", [TextContent("first"), TextContent("second")])])',
    ].join("\n");
    const { terminal } = await mount(source, 100);
    await dropRightOfK(terminal);

    const header = findCell(plain(terminal), "▸ More");
    await send(terminal, MOUSE.click(header.x + 2, header.y));
    const opened = plain(terminal);
    expect(opened).toContain("second");
    expect(cornerFromK(opened)).toEqual({ x: RIGHT_OF_K, y: 0 });
    terminal.unmount();
  });

  it("keeps its offset from its stop across a change of rows only, clamped while they are too few", async () => {
    const terminal = renderTerminal(<FullScreen source={stopProgram(textRows(2))} />, 100);
    await resize(terminal, 100, 30);
    await dropRightOfK(terminal);
    const height = boxHeight(plain(terminal));
    const k = findCell(plain(terminal), "[ K ]");

    // Too few rows under K for the dialog: it ends at the last row, never flipped over K.
    const rows = k.y + height - 2;
    await resize(terminal, 100, rows);
    expect(findCell(plain(terminal), "╭")).toEqual({ x: k.x + RIGHT_OF_K, y: rows - height });
    await resize(terminal, 100, 30);
    expect(cornerFromK(plain(terminal))).toEqual({ x: RIGHT_OF_K, y: 0 });
    terminal.unmount();
  });

  it("adds no rows to a short standalone page when dropped onto its last stop", async () => {
    const source = [
      "$note = true",
      'root = Stack([a, open, noteDialog, b], "column", "none")',
      'a = Button("A", @ToAssistant("A"))',
      'open = Button("Open", @Set($note, true))',
      `noteDialog = Dialog("info", "${NOTE_TITLE}", "Keep editing or close this note.", "Close", null, $note)`,
      'b = Button("B", @ToAssistant("B"))',
    ].join("\n");
    // B is under the open dialog: where it is comes from the page with the dialog closed.
    const b = findCell(await closedFrame(source, 100), "[ B ]");
    const { terminal } = await mount(source, 100);
    const before = plain(terminal);

    // Dropped with its top-left on B's cells: re-anchored to B, the page's last stop.
    await dragCornerTo(terminal, NOTE_TITLE, moved(b, 2, 0));
    const after = plain(terminal);
    expect(findCell(after, "╭")).toEqual(moved(b, 2, 0));
    expect(after.split("\n").length).toBe(before.split("\n").length);
    terminal.unmount();
  });
});
