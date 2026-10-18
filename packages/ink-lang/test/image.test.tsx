import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { DIM_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("Image", () => {
  it("renders the alt text as a dim placeholder line", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Image("A sunset", "https://example.test/sunset.png")])',
    );
    expect(stripAnsi(rendered.frame())).toBe("▣ A sunset");
    expect(rendered.frame()).toContain(DIM_ON);
    rendered.unmount();
  });

  it("falls back to the url when the alt text is empty", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Image("", "https://example.test/sunset.png")])',
    );
    expect(stripAnsi(rendered.frame())).toBe("▣ https://example.test/sunset.png");
    rendered.unmount();
  });
});

describe("ImageBlock", () => {
  it("renders the alt text, or the url without one", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([ImageBlock("https://example.test/a.png", "Chart"), ImageBlock("https://example.test/b.png")])',
    );
    const lines = stripAnsi(rendered.frame()).split("\n");
    expect(lines).toContain("▣ Chart");
    expect(lines).toContain("▣ https://example.test/b.png");
    rendered.unmount();
  });
});

describe("ImageGallery", () => {
  it("renders one line per image with its details", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([ImageGallery([{src: "https://example.test/a.png", alt: "First", details: "Taken in May"}, {src: "https://example.test/b.png", alt: "Second"}])])',
    );
    const lines = stripAnsi(rendered.frame()).split("\n");
    expect(lines[0]).toBe("▣ First  Taken in May");
    expect(lines[1]).toBe("▣ Second");
    rendered.unmount();
  });
});
