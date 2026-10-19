import { describe, expect, it } from "vitest";
import { tokensLibrary } from "../../examples/showcase/tokens-library";
import { stripAnsi } from "../helpers/ansi";
import { renderProgram } from "../helpers/render-program";

describe("TokenSheet", () => {
  it("lists every token group and marks the tokens the design system set", async () => {
    const rendered = await renderProgram(tokensLibrary, "root = Stack([TokenSheet()])", {
      designSystem: {
        mode: "light",
        tokens: {
          "color.primary": "#88c0d0",
          "spacing.lg": 3,
          "typography.h4.transform": "uppercase",
        },
      },
    });
    const plain = stripAnsi(rendered.frame());
    const lines = plain.split("\n");
    function line(text: string): string {
      return lines.find((candidate) => candidate.includes(text)) ?? "";
    }
    expect(plain).toContain("Mode light");
    expect(plain).toContain("3 tokens set");
    expect(line("primary")).toContain("● primary");
    expect(line("primary")).toContain("#88c0d0");
    expect(line("neutral")).toContain("○ neutral");
    expect(line("lg 3")).toContain("● lg 3");
    expect(line("xs 0")).toContain("○ xs 0");
    expect(line("● h4")).toContain("SAMPLE");
    expect(line("● h4")).toContain("uppercase");
    expect(line("○ h1")).toContain("Sample");
    expect(line("fieldBorder")).toContain("○ fieldBorder none");
    expect(plain).toContain("textBackground");
    expect(plain).toContain("button.background");
    expect(plain).toContain("containerMaxWidth 0");
    rendered.unmount();
  });
});
