import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { focusOrder, nextInOrder, type FocusStop } from "../../src/focus/focus-order";
import { FocusRegistryContext } from "../../src/focus/focus-registry";
import { FocusScope } from "../../src/focus/focus-scope";
import { useFocusable } from "../../src/focus/use-focusable";
import { InkRenderer } from "../../src/ink-renderer";
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

describe("Tab in document order", () => {
  it("visits two columns one after the other, the way the program lays them out", async () => {
    const program = [
      'root = Stack([left, right], "row", "l")',
      'left = Stack([Button("A1", @ToAssistant("A1")), Button("A2", @ToAssistant("A2"))])',
      'right = Stack([Button("B1", @ToAssistant("B1")), Button("B2", @ToAssistant("B2"))])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ A1 ]"]);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ A2 ]"]);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ B1 ]"]);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ B2 ]"]);
    expect(await press(rendered, KEYS.TAB)).toEqual(["[ A1 ]"]);
    expect(await press(rendered, KEYS.SHIFT_TAB)).toEqual(["[ B2 ]"]);
    rendered.unmount();
  });
});

describe("focusOrder", () => {
  it("lists the stops with their position, identity and the arrows they keep", async () => {
    let seen: FocusStop[] = [];
    function Probe() {
      const registry = useContext(FocusRegistryContext);
      if (registry !== null) seen = focusOrder(registry);
      return null;
    }
    const program = 'root = Stack([Input("q", "Search"), Button("Go", @ToAssistant("Go"))])';
    const instance = render(
      <FocusScope>
        <InkRenderer response={program} library={inkLibrary} />
        <Probe />
      </FocusScope>,
    );
    await settle();
    instance.rerender(
      <FocusScope>
        <InkRenderer response={program} library={inkLibrary} />
        <Probe />
      </FocusScope>,
    );
    await settle();
    expect(seen.map((stop) => stop.component + ":" + stop.name)).toEqual(["Input:q", "Button:Go"]);
    expect(seen[0]?.rect.y).toBe(0);
    expect(seen[1]?.rect.y).toBeGreaterThan(0);
    expect(seen[0]?.path.length).toBeGreaterThan(0);
    // An empty Input has no cursor room: no arrow is kept; a button keeps none either.
    expect(seen[0]?.arrows).toEqual({ up: false, down: false, left: false, right: false });
    expect(nextInOrder(seen, undefined, 1)).toBe(seen[0]?.id);
    expect(nextInOrder(seen, seen[1]?.id, 1)).toBe(seen[0]?.id);
    instance.unmount();
  });
});

describe("FocusScope across containers", () => {
  function Panel() {
    const focusable = useFocusable({ isActive: true, name: "panel" });
    return (
      <Box ref={focusable.ref} width={12}>
        <Text inverse={focusable.isFocused}>[ Panel ]</Text>
      </Box>
    );
  }

  it("lets Left move from the first page button into a host panel beside it", async () => {
    const program = 'root = Stack([Button("Page", @ToAssistant("Page"))])';
    const instance = render(
      <FocusScope>
        <Box flexDirection="row" gap={2}>
          <Panel />
          <InkRenderer response={program} library={inkLibrary} />
        </Box>
      </FocusScope>,
    );
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["[ Page ]"]);
    instance.stdin.write(KEYS.LEFT);
    await settle();
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["[ Panel ]"]);
    instance.stdin.write(KEYS.RIGHT);
    await settle();
    expect(inverseSegments(instance.lastFrame() ?? "")).toEqual(["[ Page ]"]);
    // Both stops sit on the same row: the panel first, then the program's button.
    expect(stripAnsi(instance.lastFrame() ?? "")).toMatch(/\[ Panel \]\s+\[ Page \]/);
    instance.unmount();
  });
});
