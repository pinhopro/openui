import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, DIM_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("Steps", () => {
  it("numbers the steps, bolds the titles and dims the details", async () => {
    const program =
      'root = Stack([Steps([StepsItem("Install", "Run npm install"), StepsItem("Run", "Start the app")])])';
    const rendered = await renderProgram(inkLibrary, program);
    const frame = rendered.frame();
    const plain = stripAnsi(frame).split("\n");
    expect(plain[0]).toBe("1. Install");
    expect(plain[1]).toBe("   Run npm install");
    expect(plain[2]).toBe("2. Run");
    expect(plain[3]).toBe("   Start the app");
    expect(frame.split("\n")[0]).toContain(BOLD_ON);
    expect(frame.split("\n")[1]).toContain(DIM_ON);
    rendered.unmount();
  });
});
