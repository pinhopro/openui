import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const program = [
  "root = Stack([top, bottom, size, volume])",
  'top = Buttons([Button("One", @ToAssistant("One")), Button("Two", @ToAssistant("Two"))])',
  'bottom = Buttons([Button("Three", @ToAssistant("Three"))])',
  'size = Chips("size", "single", [ChipItem("s", "Small"), ChipItem("m", "Medium")])',
  'volume = Slider("volume", "continuous", 0, 10, 1, [5])',
].join("\n");

async function press(
  rendered: Awaited<ReturnType<typeof renderProgram>>,
  key: string,
): Promise<string[]> {
  rendered.instance.stdin.write(key);
  await settle();
  return inverseSegments(rendered.frame());
}

describe("arrow-key focus navigation", () => {
  it("gives focus to the first component on Down when nothing is focused", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["[ One ]"]);
    rendered.unmount();
  });

  it("moves between buttons in a row with Left and Right and between rows with Up and Down", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    await press(rendered, KEYS.DOWN);
    expect(await press(rendered, KEYS.RIGHT)).toEqual(["[ Two ]"]);
    expect(await press(rendered, KEYS.LEFT)).toEqual(["[ One ]"]);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["[ Three ]"]);
    expect(await press(rendered, KEYS.UP)).toEqual(["[ One ]"]);
    rendered.unmount();
  });

  it("leaves a horizontal group with Up and Down but lets it keep Left and Right", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    await press(rendered, KEYS.DOWN);
    await press(rendered, KEYS.DOWN);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["[ Small ]"]);
    expect(await press(rendered, KEYS.RIGHT)).toEqual(["[ Medium ]"]);
    expect(await press(rendered, KEYS.UP)).toEqual(["[ Three ]"]);
    rendered.unmount();
  });

  it("lets a slider keep Left and Right and leaves it with Up", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    for (let count = 0; count < 5; count += 1) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    expect(stripAnsi(rendered.frame())).toContain("┤ 5");
    await press(rendered, KEYS.RIGHT);
    expect(stripAnsi(rendered.frame())).toContain("┤ 6");
    expect(await press(rendered, KEYS.UP)).toEqual(["[ Small ]"]);
    rendered.unmount();
  });
});
