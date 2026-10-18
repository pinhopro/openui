import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { RED_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

const GREEN_ON = "\u001b[32m";
const STRIKETHROUGH_ON = "\u001b[9m";

describe("MetricIndicatorInline", () => {
  it("renders the value, a colored trend and the subtext on one line", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([MetricIndicatorInline("1,204", "visits", {direction: "up", value: 12.5})])',
    );
    expect(stripAnsi(rendered.frame())).toBe("1,204  +12.5%  visits");
    expect(rendered.frame()).toContain(GREEN_ON);
    rendered.unmount();
  });

  it("uses the danger color for a downward trend", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([MetricIndicatorInline("80", null, {direction: "down", value: 3})])',
    );
    expect(stripAnsi(rendered.frame())).toBe("80  -3%");
    expect(rendered.frame()).toContain(RED_ON);
    rendered.unmount();
  });
});

describe("MetricIndicatorWithStrikethrough", () => {
  it("strikes the previous value through and puts the subtext below", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([MetricIndicatorWithStrikethrough("$9", "per month", "$12", {direction: "down", value: 25})])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("$9  $12  -25%");
    expect(lines[0]).toContain(STRIKETHROUGH_ON);
    expect(stripAnsi(lines[1] ?? "")).toBe("per month");
    rendered.unmount();
  });
});
