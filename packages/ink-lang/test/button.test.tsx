import type { ActionEvent, OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { INVERSE_ON, inverseSegments, RED_ON, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([deploy, cancel])",
  'deploy = Button("Deploy", @ToAssistant("Deploy now"))',
  'cancel = Button("Cancel", null, "secondary")',
].join("\n");

describe("Button", () => {
  it("renders the label in brackets", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    expect(stripAnsi(rendered.frame())).toContain("[ Deploy ]");
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });

  it("moves focus with Tab and shows the focused button inverted", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Deploy ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    rendered.unmount();
  });

  it("fires the action of the focused button on Enter", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("continue_conversation");
    expect(events[0]?.humanFriendlyMessage).toBe("Deploy now");
    rendered.unmount();
  });

  it("fires on Space as well", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });

  it("sends the label to the assistant when there is no action", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]?.humanFriendlyMessage).toBe("Cancel");
    rendered.unmount();
  });

  it("cannot be focused or pressed while streaming", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      isStreaming: true,
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toEqual([]);
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });

  it("colors a destructive button red", async () => {
    const errors: OpenUIError[][] = [];
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([d])\nd = Button("Delete", null, "primary", "destructive")',
      {
        onError: function onError(next) {
          errors.push(next);
        },
      },
    );
    expect(errors[errors.length - 1]).toEqual([]);
    const lines = rendered.frame().split("\n");
    const buttonLine = lines.find(function hasDelete(line) {
      return stripAnsi(line).includes("[ Delete ]");
    });
    expect(buttonLine).toBeDefined();
    expect(buttonLine).toContain(RED_ON);
    rendered.unmount();
  });

  describe("with the mouse", () => {
    it("fires the action on a click at the button's cell without prior focus", async () => {
      const events: ActionEvent[] = [];
      const rendered = await renderProgram(inkLibrary, program, {
        mouse: true,
        onAction: function onAction(event) {
          events.push(event);
        },
      });
      // "[ Deploy ]" is row 0 and "[ Cancel ]" row 2 (the Stack's default gap is one line).
      rendered.instance.stdin.write(MOUSE.click(3, 2));
      await settle();
      expect(events).toHaveLength(1);
      expect(events[0]?.humanFriendlyMessage).toBe("Cancel");
      rendered.instance.stdin.write(MOUSE.click(0, 0));
      await settle();
      expect(events).toHaveLength(2);
      expect(events[0]?.humanFriendlyMessage).toBe("Cancel");
      expect(events[1]?.humanFriendlyMessage).toBe("Deploy now");
      rendered.unmount();
    });

    it("moves focus to the button under the pointer", async () => {
      const rendered = await renderProgram(inkLibrary, program, { mouse: true });
      rendered.instance.stdin.write(MOUSE.move(2, 2));
      await settle();
      expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
      rendered.instance.stdin.write(MOUSE.move(2, 0));
      await settle();
      expect(inverseSegments(rendered.frame())).toEqual(["[ Deploy ]"]);
      rendered.instance.stdin.write(KEYS.ENTER);
      await settle();
      rendered.unmount();
    });

    it("ignores clicks and hover while streaming", async () => {
      const events: ActionEvent[] = [];
      const rendered = await renderProgram(inkLibrary, program, {
        mouse: true,
        isStreaming: true,
        onAction: function onAction(event) {
          events.push(event);
        },
      });
      rendered.instance.stdin.write(MOUSE.move(2, 0) + MOUSE.click(2, 0));
      await settle();
      expect(events).toEqual([]);
      expect(rendered.frame()).not.toContain(INVERSE_ON);
      rendered.unmount();
    });

    it("ignores a click on the blank space next to the button", async () => {
      const events: ActionEvent[] = [];
      const rendered = await renderProgram(inkLibrary, program, {
        mouse: true,
        onAction: function onAction(event) {
          events.push(event);
        },
      });
      rendered.instance.stdin.write(MOUSE.click(12, 0));
      await settle();
      expect(events).toEqual([]);
      rendered.unmount();
    });
  });
});
