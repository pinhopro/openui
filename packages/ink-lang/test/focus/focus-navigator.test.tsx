import { Box, Text } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { useFocusCommands, type FocusCommands } from "../../src/focus/focus-commands";
import { FocusNavigator } from "../../src/focus/focus-navigator";
import { createFocusRegistry, FocusRegistryContext } from "../../src/focus/focus-registry";
import { FocusScope } from "../../src/focus/focus-scope";
import { useFocusable } from "../../src/focus/use-focusable";
import { InkRenderer } from "../../src/ink-renderer";
import type { UiEvent } from "../../src/ui-events";
import { inverseSegments, stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const ESCAPE = "\u001b";
const MODE_SEQUENCES_ONLY = /^(\u001b\[\?\d+[hl])+$/;

/** The focused segments of every frame Ink wrote from `start` on (mode toggles skipped). */
function focusedSince(frames: string[], start: number): string[][] {
  const focused: string[][] = [];
  for (let index = start; index < frames.length; index += 1) {
    const frame = frames[index] ?? "";
    if (MODE_SEQUENCES_ONLY.test(frame)) continue;
    focused.push(inverseSegments(frame));
  }
  return focused;
}

function lastFrame(frames: string[]): string {
  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index] ?? "";
    if (!MODE_SEQUENCES_ONLY.test(frame)) return frame;
  }
  return "";
}

interface PanelProps {
  name: string;
  autoFocus?: boolean;
}

/** A host stop outside the renderer. */
function Panel({ name, autoFocus }: PanelProps) {
  const focusable = useFocusable({ isActive: true, name, autoFocus });
  return (
    <Box ref={focusable.ref} width={14}>
      <Text inverse={focusable.isFocused}>{"[ " + name + " ]"}</Text>
    </Box>
  );
}

const twoButtons = 'root = Stack([Button("A", @ToAssistant("A")), Button("B", @ToAssistant("B"))])';

describe("FocusNavigator", () => {
  it("wraps Shift+Tab from the first stop to the last, with no frame on another stop", async () => {
    // "B" mounts after "C", so Ink's own registration order (A, C, B) differs from the tree's.
    const before =
      'root = Stack([a, c])\na = Button("A", @ToAssistant("A"))\nc = Button("C", @ToAssistant("C"))';
    const after =
      'root = Stack([a, b, c])\na = Button("A", @ToAssistant("A"))\nb = Button("B", @ToAssistant("B"))\nc = Button("C", @ToAssistant("C"))';
    const rendered = await renderProgram(inkLibrary, before);
    await rendered.update({ response: after });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ A ]"]);
    const start = rendered.instance.frames.length;
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle(0);
    expect(inverseSegments(rendered.frame())).toEqual(["[ C ]"]);
    await settle();
    for (const focused of focusedSince(rendered.instance.frames, start)) {
      expect(focused).toEqual(["[ C ]"]);
    }
    rendered.unmount();
  });

  it("moves exactly once per Tab", async () => {
    const focused: string[] = [];
    const rendered = await renderProgram(inkLibrary, twoButtons, {
      onUiEvent: function onUiEvent(event: UiEvent) {
        if (event.type === "focus") focused.push(event.name);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused).toEqual(["A"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused).toEqual(["A", "B"]);
    rendered.unmount();
  });

  it("clears a focused Combobox's filter on Escape and drops focus", async () => {
    const program = [
      "root = Stack([form])",
      'form = Form("deploy", Buttons([go]), [regionField])',
      'regionField = FormControl("Region", Combobox("region", [us, eu, ap], "Pick a region"))',
      'us = SelectItem("us-east-1", "US East")',
      'eu = SelectItem("eu-west-1", "EU West")',
      'ap = SelectItem("ap-south-1", "Asia Pacific")',
      'go = Button("Go", @ToAssistant("Go"))',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("we");
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("US East");
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows.
    await settle(60);
    const dropped = rendered.frame();
    expect(stripAnsi(dropped)).not.toContain("> we");
    expect(inverseSegments(dropped)).toEqual([]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).not.toContain("we");
    expect(plain).toContain("US East");
    expect(plain).toContain("Asia Pacific");
    rendered.unmount();
  });

  it("lets a host stop with autoFocus inside a FocusScope take focus on mount", async () => {
    const instance = render(
      <FocusScope>
        <InkRenderer response={twoButtons} library={inkLibrary} />
        <Panel name="Side" autoFocus />
      </FocusScope>,
    );
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Side ]"]);
    instance.unmount();
  });

  it("keeps the first autoFocus stop focused when a second one mounts later", async () => {
    function App({ second }: { second: boolean }) {
      return (
        <FocusScope>
          <InkRenderer response={twoButtons} library={inkLibrary} />
          <Panel name="First" autoFocus />
          {second ? <Panel name="Second" autoFocus /> : null}
        </FocusScope>
      );
    }
    const instance = render(<App second={false} />);
    await settle();
    instance.rerender(<App second />);
    await settle();
    const frame = lastFrame(instance.frames);
    expect(stripAnsi(frame)).toContain("[ Second ]");
    expect(inverseSegments(frame)).toEqual(["[ First ]"]);
    instance.unmount();
  });

  it("lets an autoFocus stop rendered before the navigator take focus on mount", async () => {
    const registry = createFocusRegistry();
    const instance = render(
      <FocusRegistryContext.Provider value={registry}>
        <Panel name="Early" autoFocus />
        <FocusNavigator />
      </FocusRegistryContext.Provider>,
    );
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Early ]"]);
    instance.unmount();
  });

  it("gives Tab and Shift+Tab to the library: Ink's own handling is off", async () => {
    const instance = render(
      <FocusScope>
        <Panel name="One" />
        <Panel name="Two" />
        <Panel name="Three" />
      </FocusScope>,
    );
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual([]);
    instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Three ]"]);
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ One ]"]);
    instance.unmount();
  });

  it("provides focus commands that follow the cycle", async () => {
    let commands: FocusCommands | null = null;
    function Probe() {
      commands = useFocusCommands();
      return null;
    }
    const instance = render(
      <FocusScope>
        <Probe />
        <Panel name="One" />
        <Panel name="Two" />
      </FocusScope>,
    );
    await settle();
    const current = commands as FocusCommands | null;
    if (current === null) throw new Error("no focus commands");
    current.focusFirst();
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ One ]"]);
    current.focusNext();
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Two ]"]);
    current.focusNext();
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ One ]"]);
    current.focusPrevious();
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Two ]"]);
    instance.unmount();
  });

  it("gives no-op focus commands outside a navigator", async () => {
    let commands: FocusCommands | null = null;
    function Probe() {
      commands = useFocusCommands();
      return null;
    }
    const instance = render(
      <Box flexDirection="column">
        <Probe />
        <Panel name="One" />
      </Box>,
    );
    await settle();
    const current = commands as FocusCommands | null;
    if (current === null) throw new Error("no focus commands");
    current.focusFirst();
    current.focusNext();
    current.focusPrevious();
    await settle();
    expect(stripAnsi(lastFrame(instance.frames))).toContain("[ One ]");
    expect(inverseSegments(lastFrame(instance.frames))).toEqual([]);
    instance.unmount();
  });
});
