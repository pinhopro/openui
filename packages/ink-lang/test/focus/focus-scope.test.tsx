import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import type { FocusStop } from "../../src/focus/focus-order";
import type { FocusEntry } from "../../src/focus/focus-registry";
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
});
