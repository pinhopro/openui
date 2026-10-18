import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const boundProgram = [
  '$d = "2024-05-10"',
  'root = Stack([DatePicker("when", "single", null, $d), TextContent("Picked: " + $d)])',
].join("\n");

describe("DatePicker", () => {
  it("shows the bound ISO date", async () => {
    const rendered = await renderProgram(inkLibrary, boundProgram);
    expect(stripAnsi(rendered.frame())).toContain("2024-05-10");
    rendered.unmount();
  });

  it("changes the day with Up, moves to the month with Left and clamps the day", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(inkLibrary, boundProgram, {
      onStateUpdate: function onStateUpdate(state) {
        snapshots.push(state);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["10"]);
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Picked: 2024-05-11");
    expect(snapshots[snapshots.length - 1]).toEqual({ $d: "2024-05-11" });
    rendered.instance.stdin.write(KEYS.LEFT);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["05"]);
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Picked: 2024-06-11");
    rendered.instance.stdin.write(KEYS.LEFT);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Picked: 2023-06-11");
    rendered.unmount();
  });

  it("keeps the day inside the month when the month changes", async () => {
    const program = '$d = "2024-01-31"\nroot = Stack([DatePicker("when", "single", null, $d)])';
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.LEFT + KEYS.UP);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("2024-02-29");
    rendered.unmount();
  });

  it("starts from today when empty and shows a dim mask before that", async () => {
    const rendered = await renderProgram(inkLibrary, 'root = Stack([DatePicker("when")])');
    expect(stripAnsi(rendered.frame())).toContain("YYYY-MM-DD");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    expect(stripAnsi(rendered.frame())).toMatch(/\d{4}-\d{2}-\d{2}/);
    rendered.unmount();
  });

  it("edits a from/to pair in range mode", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([DatePicker("stay", "range")])',
      {
        initialState: { stay: { value: { from: "2024-05-10", to: "2024-05-12" } } },
        onStateUpdate: function onStateUpdate(state) {
          snapshots.push(state);
        },
      },
    );
    expect(stripAnsi(rendered.frame())).toContain("2024-05-10 to 2024-05-12");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.RIGHT + KEYS.RIGHT + KEYS.UP);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("2024-05-10 to 2024-05-13");
    expect(snapshots[snapshots.length - 1]).toEqual({
      stay: { value: { from: "2024-05-10", to: "2024-05-13" }, componentType: undefined },
    });
    rendered.unmount();
  });

  it("validates a required date inside a form", async () => {
    const events: ActionEvent[] = [];
    const source = [
      "root = Stack([form])",
      'form = Form("trip", Buttons([save]), [field])',
      'field = FormControl("When", DatePicker("when", "single", {required: true}))',
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
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });
});
