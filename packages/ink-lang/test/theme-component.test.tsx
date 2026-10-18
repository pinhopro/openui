import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

const MAGENTA_ON = "\u001b[35m";
const ITALIC_ON = "\u001b[3m";

describe("Theme", () => {
  it("renders its children with the tokens and stylesheet it declares", async () => {
    const program = [
      "root = Stack([themed, plain])",
      'themed = Theme({"color.primary": "magenta", "shape.fieldBorder": "round"}, "Button { font-style: italic }", [Card([CardHeader("Inside")]), Input("q", "Search"), Button("Go", @ToAssistant("Go"))])',
      'plain = Card([CardHeader("Outside")])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    const lines = rendered.frame().split("\n");
    const inside = lines.find(function has(line) {
      return stripAnsi(line).includes("Inside");
    });
    const outside = lines.find(function has(line) {
      return stripAnsi(line).includes("Outside");
    });
    const button = lines.find(function has(line) {
      return stripAnsi(line).includes("[ Go ]");
    });
    expect(inside).toContain(MAGENTA_ON);
    expect(outside).not.toContain(MAGENTA_ON);
    expect(button).toContain(ITALIC_ON);
    expect(stripAnsi(rendered.frame())).toContain("╭");
    rendered.unmount();
  });

  it("accepts nested token objects and a light or dark mode", async () => {
    const program = [
      "root = Stack([themed])",
      'themed = Theme({mode: "light", color: {text: {value: "black"}}, light: {"color.canvas.app": "white"}}, null, [TextContent("hello")])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(rendered.frame()).toContain("\u001b[30m");
    rendered.unmount();
  });
});
