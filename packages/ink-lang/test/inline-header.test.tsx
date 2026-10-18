import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, DIM_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("InlineHeader", () => {
  it("renders a bold heading and a dim description", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([InlineHeader("Usage", "Last 30 days")])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("Usage");
    expect(lines[0]).toContain(BOLD_ON);
    expect(stripAnsi(lines[1] ?? "")).toBe("Last 30 days");
    expect(lines[1]).toContain(DIM_ON);
    rendered.unmount();
  });
});
