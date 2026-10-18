import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, RED_ON, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const GREEN_ON = "\u001b[32m";

describe("Callout", () => {
  it("draws a colored left border with a bold title and the description", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Callout("success", "Saved", "All changes are stored.")])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("│ Saved");
    expect(stripAnsi(lines[1] ?? "")).toBe("│ All changes are stored.");
    expect(lines[0]).toContain(GREEN_ON);
    expect(lines[0]).toContain(BOLD_ON);
    rendered.unmount();
  });

  it("uses the danger color for the error variant", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Callout("error", "Failed", "Try again")])',
    );
    expect(rendered.frame()).toContain(RED_ON);
    rendered.unmount();
  });

  it("follows a $visible binding", async () => {
    const program = [
      "$show = false",
      'root = Stack([Callout("info", "Hello", "World", $show), toggle])',
      'toggle = Button("Show", @Set($show, true))',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(stripAnsi(rendered.frame())).not.toContain("Hello");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Hello");
    rendered.unmount();
  });
});

describe("TextCallout", () => {
  it("renders the title and description with the variant color", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([TextCallout("danger", "Careful", "This cannot be undone")])',
    );
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("│ Careful");
    expect(plain).toContain("│ This cannot be undone");
    expect(rendered.frame()).toContain(RED_ON);
    rendered.unmount();
  });

  it("renders nothing without a title or description", async () => {
    const rendered = await renderProgram(inkLibrary, 'root = Stack([TextCallout("info")])');
    expect(stripAnsi(rendered.frame()).trim()).toBe("");
    rendered.unmount();
  });
});
