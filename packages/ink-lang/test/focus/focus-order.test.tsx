import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import {
  compareSequencePath,
  focusOrder,
  hostStops,
  nextInOrder,
  type FocusStop,
} from "../../src/focus/focus-order";
import {
  FocusRegistryContext,
  type FocusEntry,
  type FocusRegistry,
} from "../../src/focus/focus-registry";
import { FocusScope } from "../../src/focus/focus-scope";
import { useFocusable } from "../../src/focus/use-focusable";
import { InkRenderer } from "../../src/ink-renderer";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { fillerRows } from "../helpers/filler-rows";
import { findCell } from "../helpers/find-cell";
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
    // The program's rank 0, the root Stack at 0, its children at 0 and 1, each
    // stop at order 0 within its element.
    expect(seen[0]?.path).toEqual([0, 0, 0, 0]);
    expect(seen[1]?.path).toEqual([0, 0, 1, 0]);
    expect(seen[0]?.program).toBe(0);
    // An empty Input has no cursor room: no arrow is kept; a button keeps none either.
    expect(seen[0]?.arrows).toEqual({ up: false, down: false, left: false, right: false });
    expect(nextInOrder(seen, undefined, 1)).toBe(seen[0]?.id);
    expect(nextInOrder(seen, seen[1]?.id, 1)).toBe(seen[0]?.id);
    instance.unmount();
  });
});

describe("focusOrder layer and anchor", () => {
  it("reports each stop's layer, and the stop a dropped dialog re-anchored to", async () => {
    let registry: FocusRegistry | null = null;
    function Probe() {
      registry = useContext(FocusRegistryContext);
      return null;
    }
    const program = [
      "$note = true",
      `root = Stack([a, open, noteDialog, b, c, ${fillerRows(10)}])`,
      'a = Button("A", @ToAssistant("A"))',
      'open = Button("Open", @Set($note, true))',
      'noteDialog = Dialog("info", "Draft saved", "Keep editing or close this note.", "Close", null, $note)',
      'b = Button("B", @ToAssistant("B"))',
      'c = Button("C", @ToAssistant("C"))',
    ].join("\n");
    const instance = render(
      <FocusScope>
        <InkRenderer response={program} library={inkLibrary} />
        <Probe />
      </FocusScope>,
    );
    await settle();
    function stops(): Map<string, FocusStop> {
      const byName = new Map<string, FocusStop>();
      if (registry === null) return byName;
      for (const stop of focusOrder(registry)) byName.set(stop.name, stop);
      return byName;
    }
    function frame(): string {
      return stripAnsi(instance.lastFrame() ?? "");
    }

    // Never dragged: the dialog's stop has no anchor; a page stop is on the base layer.
    const shown = stops();
    const close = shown.get("Close");
    expect(close?.overlay).not.toBeNull();
    expect(close?.layer).toBe(close?.overlay);
    expect(close?.anchor).toBeNull();
    expect(shown.get("A")?.layer).toBe("base");
    expect(shown.get("A")?.anchor).toBeNull();

    // Ctrl+Down moves the focused dialog a row at a time, each move a drop, until its corner is on C.
    const c = shown.get("C")?.rect;
    const corner = findCell(frame(), "╭");
    for (let row = corner.y; row < (c?.y ?? 0); row += 1) {
      instance.stdin.write(KEYS.CTRL_DOWN);
      await settle();
    }
    expect(findCell(frame(), "╭")).toEqual({ x: c?.x, y: c?.y });
    const dropped = stops();
    expect(dropped.get("Close")?.anchor).toBe(dropped.get("C")?.id);
    expect(dropped.get("Close")?.layer).toBe(close?.overlay);
    expect(dropped.get("A")?.layer).toBe("base");
    expect(dropped.get("A")?.anchor).toBeNull();
    instance.unmount();
  });
});

describe("compareSequencePath", () => {
  it("compares element by element, then puts the shorter path first", () => {
    expect(compareSequencePath([0, 1], [0, 2])).toBeLessThan(0);
    expect(compareSequencePath([1], [0, 5, 5])).toBeGreaterThan(0);
    expect(compareSequencePath([0, 1], [0, 1, 0])).toBeLessThan(0);
    expect(compareSequencePath([0, 1, 0], [0, 1])).toBeGreaterThan(0);
    expect(compareSequencePath([2, 3], [2, 3])).toBe(0);
  });
});

function Panel() {
  const focusable = useFocusable({ isActive: true, name: "panel" });
  return (
    <Box ref={focusable.ref} width={12}>
      <Text inverse={focusable.isFocused}>[ Panel ]</Text>
    </Box>
  );
}

/** A host stop whose box is never mounted. */
function Detached() {
  useFocusable({ isActive: true, name: "detached" });
  return null;
}

/** A host stop whose box takes up no room. */
function Empty() {
  const focusable = useFocusable({ isActive: true, name: "empty" });
  return <Box ref={focusable.ref} />;
}

describe("hostStops", () => {
  it("lists the stops outside the renderer, which have no path and stay out of focusOrder", async () => {
    let program: FocusStop[] = [];
    let host: FocusEntry[] = [];
    function Probe() {
      const registry = useContext(FocusRegistryContext);
      if (registry !== null) {
        program = focusOrder(registry);
        host = hostStops(registry);
      }
      return null;
    }
    const response = 'root = Stack([Button("Page", @ToAssistant("Page"))])';
    function App() {
      return (
        <FocusScope>
          <InkRenderer response={response} library={inkLibrary} />
          <Panel />
          <Detached />
          <Empty />
          <Probe />
        </FocusScope>
      );
    }
    const instance = render(<App />);
    await settle();
    instance.rerender(<App />);
    await settle();
    expect(program.map((stop) => stop.name)).toEqual(["Page"]);
    // Like the program's stops, an unmounted or zero-size host stop is left out.
    expect(host.map((entry) => entry.name)).toEqual(["panel"]);
    expect(host[0]?.path).toBeNull();
    instance.unmount();
  });
});

describe("FocusScope across containers", () => {
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
