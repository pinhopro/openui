import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program =
  'root = Stack([SwitchGroup("flags", [SwitchItem("Dark mode", "Use dark colors", "dark"), SwitchItem("Beta", null, "beta", true)], "card")])';

describe("SwitchGroup", () => {
  it("renders on/off switches inside a card border", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("╭");
    expect(plain).toContain("[off] Dark mode");
    expect(plain).toContain("      Use dark colors");
    expect(plain).toContain("[on ] Beta");
    rendered.unmount();
  });

  it("toggles the switch under the cursor and stores the aggregate", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onStateUpdate: function onStateUpdate(state) {
        snapshots.push(state);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["Dark mode"]);
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("[on ] Dark mode");
    expect(snapshots[snapshots.length - 1]).toEqual({
      flags: { value: { dark: true, beta: true }, componentType: undefined },
    });
    rendered.instance.stdin.write(KEYS.DOWN + KEYS.SPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("[off] Beta");
    rendered.unmount();
  });
});
