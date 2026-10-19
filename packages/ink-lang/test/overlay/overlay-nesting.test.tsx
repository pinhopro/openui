import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import type { UiEvent } from "../../src/ui-events";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { fillerRows } from "../helpers/filler-rows";
import { KEYS } from "../helpers/keys";
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
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const opened = stripAnsi(rendered.frame());
    expect(opened).toContain("Draft saved");
    expect(opened).toContain("Settings");
    // The Dialog takes focus on its first stop, and with it priority: Tab cycles inside it.
    expect(inverseSegments(rendered.frame())).toEqual(["[ Close ]"]);
    const inside = await tabThrough(rendered, 4);
    expect(new Set(inside)).toEqual(new Set(["[ Close ]", "[ Keep ]"]));
    while (!inverseSegments(rendered.frame()).includes("[ Close ]")) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
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
