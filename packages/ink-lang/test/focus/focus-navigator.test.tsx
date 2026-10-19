import { Box, Text, useFocus } from "ink";
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
import { fillerRows } from "../helpers/filler-rows";
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

interface SecondPanelProps {
  second: boolean;
}

interface NavigatorSwitchProps {
  withNavigator: boolean;
}

interface RendererSwitchProps {
  withRenderer: boolean;
}

interface PlainInkBoxProps {
  name: string;
}

/** A plain Ink focusable, moved by Ink's own Tab handling only. */
function PlainInkBox({ name }: PlainInkBoxProps) {
  const { isFocused } = useFocus();
  return <Text inverse={isFocused}>{"[ " + name + " ]"}</Text>;
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

  it("moves once per key when several keys arrive in one write, before React commits", async () => {
    const column = [
      "root = Stack([one, two, three])",
      'one = Button("One", @ToAssistant("One"))',
      'two = Button("Two", @ToAssistant("Two"))',
      'three = Button("Three", @ToAssistant("Three"))',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, column);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ One ]"]);
    rendered.instance.stdin.write(KEYS.DOWN + KEYS.DOWN);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Three ]"]);
    rendered.instance.stdin.write(KEYS.UP + KEYS.UP);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ One ]"]);
    rendered.unmount();
  });

  it("lets a focused Combobox's Escape clear its filter; the next Escape drops focus", async () => {
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
    // The Combobox claims the Escape that clears its filter: it keeps focus and its list.
    const cleared = stripAnsi(rendered.frame());
    expect(cleared).not.toContain("we");
    expect(cleared).toContain("US East");
    expect(cleared).toContain("Asia Pacific");
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    const dropped = rendered.frame();
    expect(stripAnsi(dropped)).not.toContain("Asia Pacific");
    expect(inverseSegments(dropped)).toEqual([]);
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
    function App({ second }: SecondPanelProps) {
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

  it("focuses the first of two autoFocus stops that mount in the same commit", async () => {
    const instance = render(
      <FocusScope>
        <Panel name="First" autoFocus />
        <Panel name="Second" autoFocus />
      </FocusScope>,
    );
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ First ]"]);
    instance.unmount();
  });

  it("lets a later autoFocus stop take focus once the first one has lost it", async () => {
    function App({ second }: SecondPanelProps) {
      return (
        <FocusScope>
          <Panel name="First" autoFocus />
          {second ? <Panel name="Second" autoFocus /> : null}
        </FocusScope>
      );
    }
    const instance = render(<App second={false} />);
    await settle();
    instance.stdin.write(ESCAPE);
    await settle(60);
    expect(inverseSegments(lastFrame(instance.frames))).toEqual([]);
    instance.rerender(<App second />);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Second ]"]);
    instance.unmount();
  });

  it("leaves the focus on a stop without autoFocus when an autoFocus stop mounts later", async () => {
    function App({ second }: SecondPanelProps) {
      return (
        <FocusScope>
          <Panel name="Plain" />
          {second ? <Panel name="Late" autoFocus /> : null}
        </FocusScope>
      );
    }
    const instance = render(<App second={false} />);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Plain ]"]);
    instance.rerender(<App second />);
    await settle();
    const frame = lastFrame(instance.frames);
    expect(stripAnsi(frame)).toContain("[ Late ]");
    expect(inverseSegments(frame)).toEqual(["[ Plain ]"]);
    instance.unmount();
  });

  it("keeps the focus a stop already has when the navigator mounts in a later commit", async () => {
    const registry = createFocusRegistry();
    function App({ withNavigator }: NavigatorSwitchProps) {
      return (
        <FocusRegistryContext.Provider value={registry}>
          <Panel name="One" autoFocus />
          <Panel name="Two" />
          {withNavigator ? <FocusNavigator /> : null}
        </FocusRegistryContext.Provider>
      );
    }
    const instance = render(<App withNavigator={false} />);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ One ]"]);
    instance.rerender(<App withNavigator />);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ One ]"]);
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ Two ]"]);
    instance.unmount();
  });

  it("leaves Ink's own Tab handling on without a registry", async () => {
    const instance = render(
      <Box>
        <FocusNavigator />
        <Panel name="One" />
        <Panel name="Two" />
      </Box>,
    );
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(lastFrame(instance.frames))).toEqual(["[ One ]"]);
    instance.unmount();
  });

  it("keeps a host stop out of the cycle while a dialog of the program is open", async () => {
    const program = [
      "$confirm = false",
      // Filler rows make the app tall enough for the floating dialog to show whole.
      `root = Stack([open, dialog, ${fillerRows(6)}], "column", "none")`,
      'open = Button("Open", @Set($confirm, true))',
      'dialog = ModalDialog("neutral", "Sure?", "Nothing is undone.", "Cancel", "Go ahead", $confirm)',
    ].join("\n");
    const instance = render(
      <FocusScope>
        <Panel name="Side" />
        <InkRenderer response={program} library={inkLibrary} />
      </FocusScope>,
    );
    await settle();
    function focused(): string[] {
      return inverseSegments(lastFrame(instance.frames));
    }
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ Side ]"]);
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ Open ]"]);
    instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(lastFrame(instance.frames))).toContain("Sure?");
    expect(focused()).toEqual(["[ Cancel ]"]);
    const visited: string[] = [];
    for (let step = 0; step < 4; step += 1) {
      instance.stdin.write(KEYS.TAB);
      await settle();
      visited.push(focused().join(""));
    }
    expect(visited).toEqual(["[ Go ahead ]", "[ Cancel ]", "[ Go ahead ]", "[ Cancel ]"]);
    instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(lastFrame(instance.frames))).not.toContain("Sure?");
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ Side ]"]);
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ Open ]"]);
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

  it("gives Ink its own Tab back once the renderer that switched it off unmounts", async () => {
    function App({ withRenderer }: RendererSwitchProps) {
      return (
        <Box flexDirection="column">
          <PlainInkBox name="One" />
          <PlainInkBox name="Two" />
          {withRenderer ? <InkRenderer response={twoButtons} library={inkLibrary} /> : null}
        </Box>
      );
    }
    const instance = render(<App withRenderer />);
    await settle();
    function focused(): string[] {
      return inverseSegments(lastFrame(instance.frames));
    }
    // While the renderer is mounted, Tab follows its cycle only: Ink moves nothing itself.
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ A ]"]);
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ B ]"]);
    instance.rerender(<App withRenderer={false} />);
    await settle();
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ One ]"]);
    instance.stdin.write(KEYS.TAB);
    await settle();
    expect(focused()).toEqual(["[ Two ]"]);
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
