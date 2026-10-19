import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { focusOrder, type FocusStop } from "../../src/focus/focus-order";
import { FocusRegistryContext, type FocusEntry } from "../../src/focus/focus-registry";
import { defaultCycle, FocusScope } from "../../src/focus/focus-scope";
import { useFocusable } from "../../src/focus/use-focusable";
import { InkRenderer } from "../../src/ink-renderer";
import { inverseSegments } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { settle } from "../helpers/settle";

const MODE_SEQUENCES_ONLY = /^(\u001b\[\?\d+[hl])+$/;

const twoButtons = 'root = Stack([Button("A", @ToAssistant("A")), Button("B", @ToAssistant("B"))])';

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!MODE_SEQUENCES_ONLY.test(frame)) return frame;
  }
  return "";
}

interface PanelProps {
  name: string;
}

/** A host stop outside the renderer. */
function Panel({ name }: PanelProps) {
  const focusable = useFocusable({ isActive: true, name });
  return (
    <Box ref={focusable.ref} width={14}>
      <Text inverse={focusable.isFocused}>{"[ " + name + " ]"}</Text>
    </Box>
  );
}

/** The program's stops first, then the host's. */
function programFirst(program: FocusStop[], host: FocusEntry[]): string[] {
  const ids: string[] = [];
  for (const stop of program) ids.push(stop.id);
  for (const entry of host) ids.push(entry.id);
  return ids;
}

/** Presses Tab (or Shift+Tab) `count` times and returns the focused labels after each press. */
async function visit(
  instance: ReturnType<typeof render>,
  key: string,
  count: number,
): Promise<string[]> {
  const visited: string[] = [];
  for (let step = 0; step < count; step += 1) {
    instance.stdin.write(key);
    await settle();
    visited.push(inverseSegments(lastFrame(instance.frames)).join(""));
  }
  return visited;
}

function stop(id: string, path: number[]): FocusStop {
  return {
    id,
    component: "Button",
    name: id,
    program: path[0] ?? 0,
    path,
    rect: { x: 0, y: 0, width: 1, height: 1 },
    arrows: { up: false, down: false, left: false, right: false },
  };
}

function hostEntry(id: string): FocusEntry {
  return {
    id,
    ref: { current: null },
    isActive: true,
    arrows: {},
    component: "Panel",
    name: id,
    path: null,
  };
}

describe("defaultCycle", () => {
  it("lists the host's stops in the order given, then the program's", () => {
    const program = [stop("a", [0, 0]), stop("b", [0, 1])];
    const host = [hostEntry("side"), hostEntry("theme")];
    expect(defaultCycle(program, host)).toEqual(["side", "theme", "a", "b"]);
  });
});

describe("FocusScope order", () => {
  it("visits a host stop registered after the program first: with no path it stays out of the program's sequence", async () => {
    const instance = render(
      <FocusScope>
        <InkRenderer response={twoButtons} library={inkLibrary} />
        <Panel name="Side" />
      </FocusScope>,
    );
    await settle();
    expect(await visit(instance, KEYS.TAB, 4)).toEqual(["[ Side ]", "[ A ]", "[ B ]", "[ Side ]"]);
    expect(await visit(instance, KEYS.SHIFT_TAB, 2)).toEqual(["[ B ]", "[ A ]"]);
    instance.unmount();
  });

  it("follows the cycle the host's order returns", async () => {
    const instance = render(
      <FocusScope order={programFirst}>
        <Panel name="Side" />
        <InkRenderer response={twoButtons} library={inkLibrary} />
      </FocusScope>,
    );
    await settle();
    expect(await visit(instance, KEYS.TAB, 4)).toEqual(["[ A ]", "[ B ]", "[ Side ]", "[ A ]"]);
    expect(await visit(instance, KEYS.SHIFT_TAB, 1)).toEqual(["[ Side ]"]);
    instance.unmount();
  });

  it("skips ids the order returns that are not among the stops it was given", async () => {
    function withStaleId(program: FocusStop[], host: FocusEntry[]): string[] {
      return ["gone"].concat(defaultCycle(program, host));
    }
    const instance = render(
      <FocusScope order={withStaleId}>
        <Panel name="Side" />
        <InkRenderer response={twoButtons} library={inkLibrary} />
      </FocusScope>,
    );
    await settle();
    expect(await visit(instance, KEYS.TAB, 2)).toEqual(["[ Side ]", "[ A ]"]);
    expect(await visit(instance, KEYS.SHIFT_TAB, 2)).toEqual(["[ Side ]", "[ B ]"]);
    instance.unmount();
  });

  it("keeps the first occurrence of an id the order returns twice", async () => {
    function withDuplicate(program: FocusStop[], host: FocusEntry[]): string[] {
      const ids: string[] = [];
      const first = program[0];
      if (first !== undefined) ids.push(first.id);
      for (const entry of host) ids.push(entry.id);
      for (const stop of program) ids.push(stop.id);
      return ids;
    }
    const instance = render(
      <FocusScope order={withDuplicate}>
        <Panel name="Side" />
        <InkRenderer response={twoButtons} library={inkLibrary} />
      </FocusScope>,
    );
    await settle();
    expect(await visit(instance, KEYS.TAB, 4)).toEqual(["[ A ]", "[ Side ]", "[ B ]", "[ A ]"]);
    expect(await visit(instance, KEYS.SHIFT_TAB, 2)).toEqual(["[ B ]", "[ Side ]"]);
    instance.unmount();
  });
});

function twoButtonProgram(first: string, second: string): string {
  return `root = Stack([Button("${first}", @ToAssistant("${first}")), Button("${second}", @ToAssistant("${second}"))])`;
}

describe("several renderers in one FocusScope", () => {
  it("visits every stop of the first program before the second program's", async () => {
    let seen: FocusStop[] = [];
    function Probe() {
      const registry = useContext(FocusRegistryContext);
      if (registry !== null) seen = focusOrder(registry);
      return null;
    }
    function App() {
      return (
        <FocusScope>
          <InkRenderer response={twoButtonProgram("A1", "A2")} library={inkLibrary} />
          <InkRenderer response={twoButtonProgram("B1", "B2")} library={inkLibrary} />
          <Probe />
        </FocusScope>
      );
    }
    const instance = render(<App />);
    await settle();
    instance.rerender(<App />);
    await settle();
    const programs: number[] = [];
    for (const stop of seen) programs.push(stop.program);
    expect(programs).toEqual([0, 0, 1, 1]);
    expect(await visit(instance, KEYS.TAB, 5)).toEqual([
      "[ A1 ]",
      "[ A2 ]",
      "[ B1 ]",
      "[ B2 ]",
      "[ A1 ]",
    ]);
    expect(await visit(instance, KEYS.SHIFT_TAB, 2)).toEqual(["[ B2 ]", "[ B1 ]"]);
    instance.unmount();
  });

  it("puts the retry of the first program right after its stops, before the second program's", async () => {
    const failing = [
      'root = Stack([TextContent("Rows: " + data.total), Button("A1", @ToAssistant("A1")), Button("A2", @ToAssistant("A2"))])',
      'data = Query("stats", {}, {total: 0})',
    ].join("\n");
    const tools = {
      stats: async function stats() {
        throw new Error("down");
      },
    };
    const instance = render(
      <FocusScope>
        <InkRenderer response={failing} library={inkLibrary} toolProvider={tools} />
        <InkRenderer response={twoButtonProgram("B1", "B2")} library={inkLibrary} />
      </FocusScope>,
    );
    await settle();
    await settle();
    expect(await visit(instance, KEYS.TAB, 6)).toEqual([
      "[ A1 ]",
      "[ A2 ]",
      "[ retry ]",
      "[ B1 ]",
      "[ B2 ]",
      "[ A1 ]",
    ]);
    instance.unmount();
  });
});
