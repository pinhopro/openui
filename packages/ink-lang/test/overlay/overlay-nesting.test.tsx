import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import type { UiEvent } from "../../src/ui-events";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { fillerRows } from "../helpers/filler-rows";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const ESCAPE = "\u001b";
const ROWS = 14;

async function mount(source: string) {
  const events: UiEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  return { rendered, events };
}

function ofType(events: UiEvent[], type: string): UiEvent[] {
  const found: UiEvent[] = [];
  for (const event of events) {
    if (event.type === type) found.push(event);
  }
  return found;
}

/** Presses Tab `count` times and returns the focused segments seen after each press. */
async function tabThrough(
  rendered: Awaited<ReturnType<typeof mount>>["rendered"],
  count: number,
): Promise<string[]> {
  const seen: string[] = [];
  for (let press = 0; press < count; press += 1) {
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    seen.push(...inverseSegments(rendered.frame()));
  }
  return seen;
}

/** A page button, then an open Modal holding `children`, then filler rows. */
function modalProgram(children: string, extra: string[]): string {
  return [
    "$show = true",
    `root = Stack([page, Modal("Settings", $show, [${children}]), ${fillerRows(ROWS)}], "column", "none")`,
    'page = Button("Page button", @ToAssistant("Page"))',
    ...extra,
  ].join("\n");
}

describe("nested overlays", () => {
  it("shows a tooltip inside a modal over the modal, and the modal stays trapped", async () => {
    const { rendered } = await mount(
      modalProgram(
        'Tooltip(Button("Deploy", @ToAssistant("Deploy")), "Ships the build", "bottom"), TextContent("modal row under")',
        [],
      ),
    );
    await settle();
    // The modal focuses its first stop, the tooltip's trigger: the bubble shows,
    // painted over the modal's own row under the trigger.
    expect(inverseSegments(rendered.frame())).toEqual(["[ Deploy ]"]);
    const open = stripAnsi(rendered.frame());
    expect(open).toContain("Ships the build");
    expect(open).not.toContain("modal row under");
    const seen = await tabThrough(rendered, 4);
    expect(seen).not.toContain("[ Page button ]");
    expect(seen).toContain("[ x ]");
    expect(seen).toContain("[ Deploy ]");
    rendered.unmount();
  });

  it("opens a Dialog from a modal above it; closing it gives focus back into the modal", async () => {
    const { rendered, events } = await mount(
      modalProgram(
        'Buttons([Button("Details", @Set($note, true))]), noteDialog, TextContent("modal text")',
        [
          "$note = false",
          'noteDialog = Dialog("info", "Draft saved", "Keep editing or close this note.", "Close", "Keep", $note)',
        ],
      ),
    );
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Details ]"]);
    expect(stripAnsi(rendered.frame())).toContain("modal text");
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const opened = stripAnsi(rendered.frame());
    expect(opened).toContain("Draft saved");
    expect(opened).toContain("Settings");
    // It floats above the modal: the modal's row under its declaration is covered.
    expect(opened).not.toContain("modal text");
    // The Dialog takes focus on its first stop, and with it priority: Tab cycles inside it.
    expect(inverseSegments(rendered.frame())).toEqual(["[ Close ]"]);
    const inside = await tabThrough(rendered, 4);
    expect(new Set(inside)).toEqual(new Set(["[ Close ]", "[ Keep ]"]));
    // Two stops, so at most one more Tab lands on Close.
    for (let press = 0; press < 2; press += 1) {
      if (inverseSegments(rendered.frame()).includes("[ Close ]")) break;
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    expect(inverseSegments(rendered.frame())).toEqual(["[ Close ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Draft saved");
    expect(stripAnsi(rendered.frame())).toContain("Settings");
    expect(inverseSegments(rendered.frame())).toEqual(["[ Details ]"]);
    expect(ofType(events, "close")).toEqual([
      expect.objectContaining({ component: "Dialog", name: "Draft saved" }),
    ]);
    // The modal is still trapped.
    const after = await tabThrough(rendered, 4);
    expect(after).not.toContain("[ Page button ]");
    expect(new Set(after)).toEqual(new Set(["[ Details ]", "[ x ]"]));
    rendered.unmount();
  });

  it("releases a focused Dialog inside a modal on Escape; only the next Escape cancels the modal", async () => {
    const { rendered, events } = await mount(
      modalProgram(
        'Buttons([Button("Details", @Set($note, true))]), noteDialog, TextContent("modal text")',
        [
          "$note = true",
          'noteDialog = Dialog("info", "Draft saved", "Keep editing.", "Close", "Keep", $note)',
        ],
      ),
    );
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Close ]"]);
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows.
    await settle(60);
    const released = stripAnsi(rendered.frame());
    expect(released).toContain("Settings");
    expect(released).toContain("Draft saved");
    expect(inverseSegments(rendered.frame())).toEqual([]);
    expect(ofType(events, "cancel")).toEqual([]);
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    const cancelled = stripAnsi(rendered.frame());
    expect(cancelled).not.toContain("Settings");
    expect(cancelled).not.toContain("Draft saved");
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ component: "Modal", name: "Settings" }),
    ]);
    rendered.unmount();
  });

  it("keeps a page Dialog shown after a modal under the modal's backdrop: the modal is drawn and clicked", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(
      inkLibrary,
      [
        "$note = true",
        "$confirm = true",
        `root = Stack([page, confirmDialog, noteDialog, ${fillerRows(ROWS)}], "column", "none")`,
        'page = Button("Page button", @ToAssistant("Page"))',
        'noteDialog = Dialog("info", "Draft saved", "Keep editing.", "Close", null, $note, null, null, "center")',
        'confirmDialog = ModalDialog("destructive", "Discard?", "Gone for good.", "Cancel", "Discard it", $confirm)',
      ].join("\n"),
      {
        mouse: true,
        onUiEvent: function onUiEvent(event) {
          events.push(event);
        },
      },
    );
    await settle();
    const frame = stripAnsi(rendered.frame());
    expect(frame).toContain("⚠ Discard?");
    expect(frame).toContain("Gone for good.");
    expect(frame).toContain("[ Cancel ] [ Discard it ]");
    expect(frame).not.toContain("[ Close ]");
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    const cancel = findCell(frame, "[ Cancel ]");
    rendered.instance.stdin.write(MOUSE.click(cancel.x + 2, cancel.y));
    await settle();
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ component: "ModalDialog", name: "Discard?" }),
    ]);
    const after = stripAnsi(rendered.frame());
    expect(after).not.toContain("Discard?");
    expect(after).toContain("Draft saved");
    rendered.unmount();
  });

  it("cancels only a ModalDialog opened from a Dialog on Escape: the Dialog stays", async () => {
    const { rendered, events } = await mount(
      [
        "$confirm = false",
        `root = Stack([page, noteDialog, confirmDialog, ${fillerRows(ROWS)}], "column", "none")`,
        'page = Button("Page button", @ToAssistant("Page"))',
        'noteDialog = Dialog("info", "Draft saved", "Discard this draft?", null, "Discard", null, @Set($confirm, true))',
        'confirmDialog = ModalDialog("destructive", "Discard the draft?", "It cannot be restored.", "Cancel", "Discard it", $confirm)',
      ].join("\n"),
    );
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Discard ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Discard the draft?");
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows.
    await settle(60);
    const after = stripAnsi(rendered.frame());
    expect(after).not.toContain("Discard the draft?");
    expect(after).toContain("Draft saved");
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ component: "ModalDialog", name: "Discard the draft?" }),
    ]);
    expect(inverseSegments(rendered.frame())).toEqual(["[ Discard ]"]);
    rendered.unmount();
  });
});
