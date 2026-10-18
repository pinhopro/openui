import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([form])",
  'form = Form("signup", Buttons([save]), [field])',
  'field = FormControl("Tags", Chips("tags", "multiple", [ChipItem("a", "Alpha", Icon("rocket")), ChipItem("b", "Beta"), ChipItem("c", "Gamma", null, true)], {required: true}, ["b"]))',
  'save = Button("Save", @ToAssistant("Save"))',
].join("\n");

async function renderForm(source: string) {
  const snapshots: Array<Record<string, unknown>> = [];
  const events: ActionEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    onStateUpdate: function onStateUpdate(state) {
      snapshots.push(state);
    },
    onAction: function onAction(event) {
      events.push(event);
    },
  });
  return { rendered, snapshots, events };
}

describe("Chips", () => {
  it("renders the chips in a row with the default selected and the icon name", async () => {
    const { rendered } = await renderForm(program);
    expect(stripAnsi(rendered.frame()).split("\n")[1]).toBe(
      "[ <rocket> Alpha ] [✓ Beta] [ Gamma ]",
    );
    rendered.unmount();
  });

  it("toggles chips with Space and stores the list of values", async () => {
    const { rendered, snapshots } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ <rocket> Alpha ]"]);
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(snapshots[snapshots.length - 1]).toEqual({
      signup: { tags: { value: ["b", "a"], componentType: undefined } },
    });
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.SPACE);
    await settle();
    const last = snapshots[snapshots.length - 1] as { signup: { tags: { value: unknown } } };
    expect(last.signup.tags.value).toEqual(["a"]);
    rendered.unmount();
  });

  it("ignores a disabled chip", async () => {
    const { rendered, snapshots } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.RIGHT + KEYS.SPACE);
    await settle();
    expect(snapshots).toEqual([]);
    rendered.unmount();
  });

  it("keeps one value in single mode and deselects it on a second press", async () => {
    const source =
      'root = Stack([Chips("size", "single", [ChipItem("s", "S"), ChipItem("m", "M")])])';
    const { rendered, snapshots } = await renderForm(source);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(snapshots[snapshots.length - 1]).toEqual({
      size: { value: "s", componentType: undefined },
    });
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.SPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toBe("[ S ] [✓ M]");
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toBe("[ S ] [ M ]");
    rendered.unmount();
  });

  it("blocks a primary button while nothing is selected when required", async () => {
    const source = [
      "root = Stack([form])",
      'form = Form("signup", Buttons([save]), [field])',
      'field = FormControl("Tags", Chips("tags", "multiple", [ChipItem("a", "Alpha")], {required: true}))',
      'save = Button("Save", @ToAssistant("Save"))',
    ].join("\n");
    const { rendered, events } = await renderForm(source);
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
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });
});
