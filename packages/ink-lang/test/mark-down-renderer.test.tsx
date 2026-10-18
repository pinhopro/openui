import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("MarkDownRenderer", () => {
  it("renders markdown like TextContent", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([MarkDownRenderer("# Title\\n\\n- one\\n- **two**")])',
    );
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Title");
    expect(plain).toContain("• one");
    expect(plain).toContain("• two");
    expect(rendered.frame()).toContain(BOLD_ON);
    rendered.unmount();
  });

  it("wraps the text in a border for the card and sunk variants", async () => {
    const card = await renderProgram(inkLibrary, 'root = Stack([MarkDownRenderer("x", "card")])');
    expect(stripAnsi(card.frame())).toContain("╭");
    card.unmount();
    const sunk = await renderProgram(inkLibrary, 'root = Stack([MarkDownRenderer("x", "sunk")])');
    expect(stripAnsi(sunk.frame())).toContain("┌");
    sunk.unmount();
  });
});
