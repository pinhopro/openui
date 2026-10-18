import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program =
  'root = Stack([Carousel([[TextContent("First slide")], [TextContent("Second slide")], [TextContent("Third slide")]])])';

describe("Carousel", () => {
  it("shows one item and the position indicator", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("First slide");
    expect(plain).not.toContain("Second slide");
    expect(plain).toContain("◂ 1 / 3 ▸");
    rendered.unmount();
  });

  it("moves with Right and Left while focused and stops at the ends", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["◂ 1 / 3 ▸"]);
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    let plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Second slide");
    expect(plain).toContain("2 / 3");
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.RIGHT);
    await settle();
    plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Third slide");
    expect(plain).toContain("3 / 3");
    rendered.instance.stdin.write(KEYS.LEFT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Second slide");
    rendered.unmount();
  });

  it("draws a border for the card and sunk variants", async () => {
    const card = await renderProgram(
      inkLibrary,
      'root = Stack([Carousel([[TextContent("x")]], "card")])',
    );
    expect(stripAnsi(card.frame())).toContain("╭");
    card.unmount();
    const sunk = await renderProgram(
      inkLibrary,
      'root = Stack([Carousel([[TextContent("x")]], "sunk")])',
    );
    expect(stripAnsi(sunk.frame())).toContain("┌");
    sunk.unmount();
  });
});
