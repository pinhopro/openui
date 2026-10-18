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
  'field = FormControl("Plan", RadioGroup("plan", [RadioItem("Free", "No cost", "free"), RadioItem("Pro", "Paid monthly", "pro")], "free"))',
  'save = Button("Save", @ToAssistant("Save"))',
].join("\n");

const requiredProgram = [
  "root = Stack([form])",
  'form = Form("signup", Buttons([save]), [field])',
  'field = FormControl("Plan", RadioGroup("plan", [RadioItem("Free", "No cost", "free"), RadioItem("Pro", "Paid monthly", "pro")], null, {required: true}))',
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

describe("RadioGroup", () => {
  it("marks the default value and shows the descriptions", async () => {
    const { rendered } = await renderForm(program);
    const plain = stripAnsi(rendered.frame()).split("\n");
    expect(plain[1]).toBe("(•) Free");
    expect(plain[2]).toBe("    No cost");
    expect(plain[3]).toBe("( ) Pro");
    rendered.unmount();
  });

  it("moves with Down and picks with Space, storing the value", async () => {
    const { rendered, snapshots } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["Free"]);
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("( ) Free");
    expect(plain).toContain("(•) Pro");
    expect(snapshots[snapshots.length - 1]).toEqual({
      signup: { plan: { value: "pro", componentType: undefined } },
    });
    rendered.unmount();
  });

  it("blocks a primary button until a value is picked when required", async () => {
    const { rendered, events } = await renderForm(requiredProgram);
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
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });
});
