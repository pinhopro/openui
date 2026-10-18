import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

async function press(
  rendered: Awaited<ReturnType<typeof renderProgram>>,
  key: string,
): Promise<string[]> {
  rendered.instance.stdin.write(key);
  await settle();
  return inverseSegments(rendered.frame());
}

describe("arrow keys at the edge of a component move focus on", () => {
  it("leaves a vertical option group with Down on its last option and Up on its first", async () => {
    const program = [
      "root = Stack([above, tier, below])",
      'above = Button("Above", @ToAssistant("Above"))',
      'tier = OptionCards("tier", "single", [OptionCard("a", "Starter", "For one"), OptionCard("b", "Growth", "For teams"), OptionCard("c", "Enterprise", "Talk to sales")])',
      'below = Button("Below", @ToAssistant("Below"))',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    await press(rendered, KEYS.DOWN);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["Starter"]);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["Growth"]);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["Enterprise"]);
    expect(await press(rendered, KEYS.DOWN)).toEqual(["[ Below ]"]);
    expect(await press(rendered, KEYS.UP)).toEqual(["Enterprise"]);
    await press(rendered, KEYS.UP);
    expect(await press(rendered, KEYS.UP)).toEqual(["Starter"]);
    expect(await press(rendered, KEYS.UP)).toEqual(["[ Above ]"]);
    rendered.unmount();
  });

  it("leaves a text field with Left at the start of the text and Right at its end", async () => {
    const program = [
      "root = Stack([row])",
      'row = Stack([Button("Prev", @ToAssistant("Prev")), Input("q", "Search", null, null, $q), Button("Next", @ToAssistant("Next"))], "row")',
      '$q = "ab"',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    // The cursor sits at the end of "ab": Right has nowhere to go inside, so it moves focus.
    expect(await press(rendered, KEYS.RIGHT)).toEqual(["[ Next ]"]);
    expect(await press(rendered, KEYS.LEFT)).toContain(" ");
    expect(stripAnsi(rendered.frame())).toContain("> ab");
    await press(rendered, KEYS.LEFT);
    await press(rendered, KEYS.LEFT);
    expect(await press(rendered, KEYS.LEFT)).toEqual(["[ Prev ]"]);
    rendered.unmount();
  });

  it("leaves a slider at min with Left and at max with Right, and a tab strip at its ends", async () => {
    const program = [
      "root = Stack([row, tabs])",
      'row = Stack([Button("Prev", @ToAssistant("Prev")), Slider("v", "continuous", 0, 2, 1, [2]), Button("Next", @ToAssistant("Next"))], "row")',
      'tabs = Tabs([TabItem("a", "One", [TextContent("one")]), TabItem("b", "Two", [TextContent("two")])])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(await press(rendered, KEYS.RIGHT)).toEqual(["[ Next ]"]);
    await press(rendered, KEYS.LEFT);
    await press(rendered, KEYS.LEFT);
    await press(rendered, KEYS.LEFT);
    expect(stripAnsi(rendered.frame())).toContain("┤ 0");
    expect(await press(rendered, KEYS.LEFT)).toEqual(["[ Prev ]"]);
    rendered.unmount();
  });
});
