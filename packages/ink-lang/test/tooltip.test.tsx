import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { findCell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

describe("Tooltip", () => {
  it("shows its text under the trigger while the trigger has focus", async () => {
    const program =
      'root = Stack([Tooltip(Icon("info"), "View certificate details", "bottom", "light"), Button("Next", @ToAssistant("Next"))])';
    const rendered = await renderProgram(inkLibrary, program);
    expect(stripAnsi(rendered.frame())).not.toContain("View certificate details");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("View certificate details");
    expect(findCell(plain, "View certificate details").y).toBeGreaterThan(
      findCell(plain, "<info>").y,
    );
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("View certificate details");
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

  it("keeps a focused trigger mounted when the bubble is laid out before it (top, left)", async () => {
    const program =
      'root = Stack([Tooltip(Button("Save", @ToAssistant("Save")), "Keeps a copy", "top"), Tooltip(Button("Back", @ToAssistant("Back")), "Previous build", "left"), Button("Next", @ToAssistant("Next"))])';
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    let plain = stripAnsi(rendered.frame());
    expect(inverseSegments(rendered.frame())).toEqual(["[ Save ]"]);
    expect(findCell(plain, "Keeps a copy").y).toBeLessThan(findCell(plain, "[ Save ]").y);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    plain = stripAnsi(rendered.frame());
    expect(inverseSegments(rendered.frame())).toEqual(["[ Back ]"]);
    expect(plain).toContain("Previous build ▸ [ Back ]");
    expect(plain).not.toContain("Keeps a copy");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Next ]"]);
    rendered.unmount();
  });

  it("places the text beside the trigger for right and shows it on hover", async () => {
    const program = 'root = Stack([TextContent("above"), Tooltip(Icon("info"), "More", "right")])';
    const rendered = await renderProgram(inkLibrary, program, { mouse: true });
    const icon = findCell(stripAnsi(rendered.frame()), "<info>");
    rendered.instance.stdin.write(MOUSE.move(icon.x + 1, icon.y));
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("More");
    expect(findCell(plain, "More").y).toBe(icon.y);
    rendered.instance.stdin.write(MOUSE.move(50, 20));
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("More");
    rendered.unmount();
  });
});
