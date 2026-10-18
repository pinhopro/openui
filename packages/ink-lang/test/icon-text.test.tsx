import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, DIM_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

const GREEN_ON = "\u001b[32m";

describe("IconText", () => {
  it("renders the icon name before the title and the subtitle under it", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([IconText(Icon("rocket"), "success", "m", "Launch", "Ready", true)])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("<rocket> Launch");
    expect(stripAnsi(lines[1] ?? "")).toBe("         Ready");
    expect(lines[0]).toContain(GREEN_ON);
    expect(lines[0]).toContain(BOLD_ON);
    expect(lines[1]).toContain(DIM_ON);
    rendered.unmount();
  });

  it("puts the icon on its own line in the vertical layout", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([IconText(Icon("rocket"), null, null, "Launch", null, false, "vertical")])',
    );
    const lines = stripAnsi(rendered.frame()).split("\n");
    expect(lines[0]).toBe("<rocket>");
    expect(lines[1]).toBe("Launch");
    rendered.unmount();
  });
});

describe("ImageText", () => {
  it("renders an image mark before the title", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([ImageText("https://example.test/a.png", "Avatar", "Ada", "Engineer")])',
    );
    const lines = stripAnsi(rendered.frame()).split("\n");
    expect(lines[0]).toBe("▣ Ada");
    expect(lines[1]).toBe("  Engineer");
    rendered.unmount();
  });
});

describe("ImageTextLarge", () => {
  it("renders the image placeholder above the bold title", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([ImageTextLarge("https://example.test/banner.png", "Banner", "Summer sale", "Until Friday")])',
    );
    const lines = rendered.frame().split("\n");
    expect(stripAnsi(lines[0] ?? "")).toBe("▣ Banner");
    expect(stripAnsi(lines[1] ?? "")).toBe("Summer sale");
    expect(lines[1]).toContain(BOLD_ON);
    expect(stripAnsi(lines[2] ?? "")).toBe("Until Friday");
    rendered.unmount();
  });
});
