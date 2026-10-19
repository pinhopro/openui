import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { fillerRows } from "../helpers/filler-rows";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const program = [
  "$show = true",
  // Filler rows make the page tall enough for the floating modal to show whole.
  `root = Stack([outside, dialog, ${fillerRows(8)}], "column", "none")`,
  'outside = Button("Outside", @ToAssistant("Outside"))',
  'dialog = Modal("Confirm", $show, [TextContent("Sure?"), Buttons([Button("Inside", @ToAssistant("Inside"))])])',
].join("\n");

describe("modal layer", () => {
  it("keeps Tab inside the open modal and lets it out once the modal closes", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    const seen = new Set<string>();
    for (let count = 0; count < 6; count += 1) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
      for (const segment of inverseSegments(rendered.frame())) seen.add(segment);
    }
    expect(seen.has("[ x ]")).toBe(true);
    expect(seen.has("[ Inside ]")).toBe(true);
    expect(seen.has("[ Outside ]")).toBe(false);
    // Enter on the close control closes the modal; Tab then reaches the outside button.
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    while (!inverseSegments(rendered.frame()).includes("[ x ]")) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Sure?");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Outside ]"]);
    rendered.unmount();
  });

  it("opens on the first content stop, then the close control, then wraps", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Inside ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ x ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Inside ]"]);
    rendered.unmount();
  });

  it("keeps clicks outside the open modal from the page: the backdrop takes them and cancels", async () => {
    const actions: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      mouse: true,
      onAction: function onAction(event) {
        actions.push(event);
      },
    });
    const opened = stripAnsi(rendered.frame());
    const inside = findCell(opened, "[ Inside ]");
    rendered.instance.stdin.write(MOUSE.click(inside.x + 2, inside.y));
    await settle();
    expect(actions.map((event) => event.humanFriendlyMessage)).toEqual(["Inside"]);
    const outside = findCell(opened, "[ Outside ]");
    rendered.instance.stdin.write(MOUSE.click(outside.x + 2, outside.y));
    await settle();
    expect(actions.map((event) => event.humanFriendlyMessage)).toEqual(["Inside"]);
    expect(stripAnsi(rendered.frame())).not.toContain("Sure?");
    rendered.unmount();
  });

  it("returns focus to the outer modal's stop when a modal opened from it closes", async () => {
    const nested = [
      "$outer = true",
      "$inner = false",
      `root = Stack([outside, outer, ${fillerRows(12)}], "column", "none")`,
      'outside = Button("Outside", @ToAssistant("Outside"))',
      'outer = Modal("Outer", $outer, [Buttons([Button("First", @ToAssistant("First")), Button("Nested", @Set($inner, true))]), inner])',
      'inner = ModalDialog("neutral", "Inner", "Nested dialog", "Back", "Go", $inner)',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, nested);
    expect(inverseSegments(rendered.frame())).toEqual(["[ First ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Nested ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Nested dialog");
    expect(inverseSegments(rendered.frame())).toEqual(["[ Back ]"]);
    rendered.instance.stdin.write("\u001b");
    // Ink holds a lone Escape for 20ms in case a sequence follows; it cancels the inner dialog only.
    await settle(60);
    const frame = stripAnsi(rendered.frame());
    expect(frame).not.toContain("Nested dialog");
    expect(frame).toContain("Outer");
    expect(inverseSegments(rendered.frame())).toEqual(["[ Nested ]"]);
    rendered.unmount();
  });
});
