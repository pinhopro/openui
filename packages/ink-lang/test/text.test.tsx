import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, DIM_ON, RED_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

const GREEN_ON = "\u001b[32m";

describe("Text", () => {
  it("renders the value and a dim subtext line", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Text("text", "Hello", "world")])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("Hello");
    expect(stripAnsi(lines[1] ?? "")).toBe("world");
    expect(lines[1]).toContain(DIM_ON);
    expect(lines[0]).not.toContain(BOLD_ON);
    rendered.unmount();
  });

  it("colors a metric subtext by its sign", async () => {
    const program =
      'root = Stack([Text("number", "120", "+5%", "metric"), Text("number", "80", "-3%", "metric")])';
    const rendered = await renderProgram(inkLibrary, program);
    const lines = rendered.frame().split("\n");
    expect(lines[1]).toContain(GREEN_ON);
    expect(lines[4]).toContain(RED_ON);
    rendered.unmount();
  });
});

describe("BoldText", () => {
  it("renders the value in bold", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([BoldText("text", "Total", "$12")])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("Total");
    expect(lines[0]).toContain(BOLD_ON);
    expect(stripAnsi(lines[1] ?? "")).toBe("$12");
    rendered.unmount();
  });
});
