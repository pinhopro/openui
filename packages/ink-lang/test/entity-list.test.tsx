import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

function lines(frame: string): string[] {
  const result: string[] = [];
  for (const line of stripAnsi(frame).split("\n")) result.push(line.trimEnd());
  return result;
}

describe("EntityList", () => {
  it("aligns the left labels and right-aligns number values", async () => {
    const program =
      'root = Stack([EntityList([{left: "Revenue", right: "1,200", rightVariant: "number"}, {left: "Users", right: "35", rightVariant: "number"}])])';
    const rendered = await renderProgram(inkLibrary, program);
    expect(lines(rendered.frame())).toEqual(["Revenue  1,200", "Users       35"]);
    rendered.unmount();
  });

  it("draws the header in bold and the footer under a rule", async () => {
    const program =
      'root = Stack([EntityList([{left: "Pens", right: "2"}], "default", {left: "Item", right: "Qty"}, {left: "Total", right: "2"})])';
    const rendered = await renderProgram(inkLibrary, program);
    const frame = rendered.frame();
    expect(lines(frame)).toEqual(["Item   Qty", "Pens   2", "──────────", "Total  2"]);
    expect(frame.split("\n")[0]).toContain(BOLD_ON);
    rendered.unmount();
  });
});
