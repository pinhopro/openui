import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { DIM_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([form])",
  'form = Form("review", Buttons([save]), [notesField])',
  'notesField = FormControl("Notes", TextArea("notes", "Write here", 2, {required: true}))',
  'save = Button("Save", @ToAssistant("Save"))',
].join("\n");

async function renderForm() {
  const snapshots: Array<Record<string, unknown>> = [];
  const events: ActionEvent[] = [];
  const rendered = await renderProgram(inkLibrary, program, {
    onStateUpdate: function onStateUpdate(state) {
      snapshots.push(state);
    },
    onAction: function onAction(event) {
      events.push(event);
    },
  });
  return { rendered, snapshots, events };
}

describe("TextArea", () => {
  it("shows the dim placeholder and reserves the declared rows", async () => {
    const { rendered } = await renderForm();
    const frame = rendered.frame();
    const plain = stripAnsi(frame).split("\n");
    expect(plain[1]).toBe("  Write here");
    expect(plain[2]).toBe("");
    expect(frame.split("\n")[1]).toContain(DIM_ON);
    rendered.unmount();
  });

  it("types across lines with Enter and stores the text under the form", async () => {
    const { rendered, snapshots } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    rendered.instance.stdin.write("c");
    await settle();
    const plain = stripAnsi(rendered.frame()).split("\n");
    expect(plain[1]).toBe("> ab");
    expect(plain[2]).toBe("  c ");
    expect(inverseSegments(rendered.frame())).toEqual([" "]);
    expect(snapshots[snapshots.length - 1]).toEqual({
      review: { notes: { value: "ab\nc", componentType: undefined } },
    });
    rendered.unmount();
  });

  it("moves the cursor between lines with Up and Down", async () => {
    const { rendered, snapshots } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab" + KEYS.ENTER + "cd");
    await settle();
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    rendered.instance.stdin.write("X");
    await settle();
    const last = snapshots[snapshots.length - 1] as { review: { notes: { value: string } } };
    expect(last.review.notes.value).toBe("abX\ncd");
    rendered.unmount();
  });

  it("blocks a primary button while required and empty, then fires once filled", async () => {
    const { rendered, events } = await renderForm();
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
    rendered.instance.stdin.write("ok");
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });
});
