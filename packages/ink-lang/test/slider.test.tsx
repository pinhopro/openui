import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = 'root = Stack([Slider("volume", "discrete", 0, 10, 2, [4], "Volume")])';

describe("Slider", () => {
  it("renders the label, a track with the knob and the value", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame()).split("\n");
    expect(plain[0]).toBe("Volume");
    expect(plain[1]).toMatch(/^├[━─]*●[━─]*┤ 4$/);
    rendered.unmount();
  });

  it("changes the value by the step with Right and Left and stops at the ends", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onStateUpdate: function onStateUpdate(state) {
        snapshots.push(state);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["4"]);
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("┤ 6");
    expect(snapshots[snapshots.length - 1]).toEqual({
      volume: { value: [6], componentType: undefined },
    });
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.RIGHT + KEYS.RIGHT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("┤ 10");
    rendered.instance.stdin.write(KEYS.LEFT.repeat(6));
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("┤ 0");
    rendered.unmount();
  });

  it("starts at min with a step of one when no default or step is given", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Slider("level", "continuous", 5, 8)])',
    );
    expect(stripAnsi(rendered.frame())).toContain("┤ 5");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("┤ 6");
    rendered.unmount();
  });

  it("validates a required slider inside a form", async () => {
    const events: ActionEvent[] = [];
    const source = [
      "root = Stack([form])",
      'form = Form("mix", Buttons([save]), [field])',
      'field = FormControl("Volume", Slider("volume", "discrete", 0, 10, null, null, null, {required: true}))',
      'save = Button("Save", @ToAssistant("Save"))',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, source, {
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
    expect(events).toEqual([]);
    expect(stripAnsi(rendered.frame())).toContain("This field is required");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });
});
