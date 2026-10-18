import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

const GREEN_ON = "\u001b[32m";
const YELLOW_ON = "\u001b[33m";
const RED_ON = "\u001b[31m";

describe("Tag", () => {
  it("renders the text in brackets", async () => {
    const rendered = await renderProgram(inkLibrary, 'root = Stack([Tag("open")])');
    expect(stripAnsi(rendered.frame())).toBe("[open]");
    rendered.unmount();
  });

  it("colors the tag by variant with the theme colors", async () => {
    const program = [
      'root = Stack([Tag("ok", null, "sm", "success"), Tag("hot", null, null, "warning"), Tag("bad", null, null, "danger")])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    const lines = rendered.frame().split("\n");
    expect(lines[0]).toContain(GREEN_ON);
    expect(lines[2]).toContain(YELLOW_ON);
    expect(lines[4]).toContain(RED_ON);
    rendered.unmount();
  });

  it("shows the icon name before the text", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Tag("Launch", Icon("rocket"))])',
    );
    expect(stripAnsi(rendered.frame())).toBe("[<rocket> Launch]");
    rendered.unmount();
  });
});

describe("TagBlock", () => {
  it("renders every tag in one row", async () => {
    const rendered = await renderProgram(inkLibrary, 'root = Stack([TagBlock(["a", "b", "c"])])');
    expect(stripAnsi(rendered.frame())).toBe("[a] [b] [c]");
    rendered.unmount();
  });
});

describe("Icon", () => {
  it("renders the icon name as a dim placeholder", async () => {
    const rendered = await renderProgram(inkLibrary, 'root = Stack([Icon("circle-check")])');
    expect(stripAnsi(rendered.frame())).toBe("<circle-check>");
    rendered.unmount();
  });
});
