import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("Separator", () => {
  it("draws a horizontal rule across the available width", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([TextContent("above"), Separator(), TextContent("below")])',
    );
    const lines = stripAnsi(rendered.frame()).split("\n");
    const rule = lines.find(function isRule(line) {
      return line.startsWith("─");
    });
    expect(rule).toBe("─".repeat(100));
    rendered.unmount();
  });

  it("draws a vertical bar between row items", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Stack([TextContent("left"), Separator("vertical"), TextContent("right")], "row")])',
    );
    expect(stripAnsi(rendered.frame())).toBe("left │ right");
    rendered.unmount();
  });
});
