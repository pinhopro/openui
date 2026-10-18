import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { DIM_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([form])",
  'form = Form("prefs", Buttons([save]), [field])',
  'field = FormControl("Notify", CheckBoxGroup("notify", [CheckBoxItem("Email", "Daily digest", "email"), CheckBoxItem("SMS", "Urgent only", "sms", true)], {required: true}))',
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

describe("CheckBoxGroup", () => {
  it("renders one box per item with its dim description and the defaults checked", async () => {
    const { rendered } = await renderForm();
    const frame = rendered.frame();
    const plain = stripAnsi(frame).split("\n");
    expect(plain[1]).toBe("[ ] Email");
    expect(plain[2]).toBe("    Daily digest");
    expect(plain[3]).toBe("[x] SMS");
    expect(plain[4]).toBe("    Urgent only");
    expect(frame.split("\n")[2]).toContain(DIM_ON);
    rendered.unmount();
  });

  it("toggles the item under the cursor with Space and stores the aggregate", async () => {
    const { rendered, snapshots } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["Email"]);
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("[x] Email");
    expect(snapshots[snapshots.length - 1]).toEqual({
      prefs: { notify: { value: { email: true, sms: true }, componentType: undefined } },
    });
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["SMS"]);
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("[ ] SMS");
    const last = snapshots[snapshots.length - 1] as { prefs: { notify: { value: unknown } } };
    expect(last.prefs.notify.value).toEqual({ email: true, sms: false });
    rendered.unmount();
  });

  it("blocks a primary button until a box is toggled when required", async () => {
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
