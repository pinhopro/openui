import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("CodeBlock", () => {
  it("draws a bordered box with the language label and the code as-is", async () => {
    const program = 'root = Stack([CodeBlock("ts", "function f() {\\n  return 1;\\n}")])';
    const rendered = await renderProgram(inkLibrary, program);
    const lines = stripAnsi(rendered.frame()).split("\n");
    expect(lines[0]?.startsWith("┌")).toBe(true);
    expect(lines[1]).toBe("│ ts" + " ".repeat(95) + "│");
    expect(lines[2]).toBe("│ function f() {" + " ".repeat(83) + "│");
    expect(lines[3]).toBe("│   return 1;" + " ".repeat(86) + "│");
    expect(lines[4]).toBe("│ }" + " ".repeat(96) + "│");
    expect(lines[5]?.startsWith("└")).toBe(true);
    rendered.unmount();
  });
});
