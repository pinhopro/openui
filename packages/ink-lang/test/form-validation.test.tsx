import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { buttonNeedsValidation } from "../src/components/button-validation";
import { inkLibrary } from "../src/default-library";
import { RED_ON, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([form])",
  'form = Form("signup", Buttons([save, cancel]), [emailField])',
  'emailField = FormControl("Email", Input("email", "you@example.com", "email", {required: true, email: true}), "Work address")',
  'save = Button("Save", @ToAssistant("Save"))',
  'cancel = Button("Cancel", null, "secondary")',
].join("\n");

async function renderForm() {
  const events: ActionEvent[] = [];
  const rendered = await renderProgram(inkLibrary, program, {
    onAction: function onAction(event) {
      events.push(event);
    },
  });
  return { rendered, events };
}

describe("buttonNeedsValidation", () => {
  it("validates when a step talks to the assistant, runs a mutation or a custom action", () => {
    expect(
      buttonNeedsValidation({ steps: [{ type: "continue_conversation", message: "x" }] }),
    ).toBe(true);
    expect(
      buttonNeedsValidation({ steps: [{ type: "run", statementId: "m", refType: "mutation" }] }),
    ).toBe(true);
    expect(
      buttonNeedsValidation({ steps: [{ type: "custom_action", name: "Copy", params: {} }] }),
    ).toBe(true);
  });

  it("skips validation for local-only steps", () => {
    expect(buttonNeedsValidation({ steps: [{ type: "reset", targets: ["$x"] }] })).toBe(false);
    expect(
      buttonNeedsValidation({ steps: [{ type: "run", statementId: "q", refType: "query" }] }),
    ).toBe(false);
  });

  it("validates a button without an action", () => {
    expect(buttonNeedsValidation(undefined)).toBe(true);
    expect(buttonNeedsValidation(null)).toBe(true);
  });
});

describe("form validation", () => {
  it("marks a required field in its label", async () => {
    const { rendered } = await renderForm();
    expect(stripAnsi(rendered.frame())).toContain("Email *");
    rendered.unmount();
  });

  it("blocks a primary button while a required field is empty and shows the error", async () => {
    const { rendered, events } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toEqual([]);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("This field is required");
    expect(plain).not.toContain("Work address");
    const errorLine = rendered
      .frame()
      .split("\n")
      .find(function isError(line) {
        return stripAnsi(line).includes("This field is required");
      });
    expect(errorLine).toContain(RED_ON);
    rendered.unmount();
  });

  it("fires the action once the field is valid", async () => {
    const { rendered, events } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("a@b.test");
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]?.humanFriendlyMessage).toBe("Save");
    expect(stripAnsi(rendered.frame())).toContain("Work address");
    rendered.unmount();
  });

  it("validates a field when focus leaves it and clears the error when focus returns", async () => {
    const { rendered } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("not-an-email");
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Please enter a valid email");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Please enter a valid email");
    rendered.unmount();
  });

  it("lets a secondary button fire without validating", async () => {
    const { rendered, events } = await renderForm();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
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
});
