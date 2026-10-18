import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { KEYS } from "../helpers/keys";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const program = [
  "$show = true",
  "root = Stack([outside, dialog])",
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

  it("ignores clicks outside the open modal", async () => {
    const actions: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      mouse: true,
      onAction: function onAction(event) {
        actions.push(event);
      },
    });
    const outside = findCell(stripAnsi(rendered.frame()), "[ Outside ]");
    rendered.instance.stdin.write(MOUSE.click(outside.x + 2, outside.y));
    await settle();
    expect(actions).toEqual([]);
    const inside = findCell(stripAnsi(rendered.frame()), "[ Inside ]");
    rendered.instance.stdin.write(MOUSE.click(inside.x + 2, inside.y));
    await settle();
    expect(actions.map((event) => event.humanFriendlyMessage)).toEqual(["Inside"]);
    rendered.unmount();
  });
});
