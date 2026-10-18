import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const formProgram = [
  "root = Stack([form])",
  'form = Form("signup", Buttons([save]), [emailField])',
  'emailField = FormControl("Email", Input("email", "you@example.com"))',
  'save = Button("Save", @ToAssistant("Save"))',
].join("\n");

interface Captured {
  snapshots: Array<Record<string, unknown>>;
  events: ActionEvent[];
}

async function renderForm(program: string, isStreaming = false) {
  const captured: Captured = { snapshots: [], events: [] };
  const rendered = await renderProgram(inkLibrary, program, {
    isStreaming,
    onStateUpdate: function onStateUpdate(state) {
      captured.snapshots.push(state);
    },
    onAction: function onAction(event) {
      captured.events.push(event);
    },
  });
  return { rendered, captured };
}

describe("Input", () => {
  it("shows the placeholder while empty", async () => {
    const { rendered } = await renderForm(formProgram);
    expect(stripAnsi(rendered.frame())).toContain("you@example.com");
    rendered.unmount();
  });

  it("types into the focused input and stores the value under the form", async () => {
    const { rendered, captured } = await renderForm(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("ab");
    expect(stripAnsi(rendered.frame())).not.toContain("you@example.com");
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ signup: { email: { value: "ab", componentType: undefined } } });
    rendered.unmount();
  });

  it("removes the character before the cursor on Backspace", async () => {
    const { rendered, captured } = await renderForm(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    rendered.instance.stdin.write(KEYS.BACKSPACE);
    await settle();
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ signup: { email: { value: "a", componentType: undefined } } });
    rendered.unmount();
  });

  it("inserts at the cursor after moving left", async () => {
    const { rendered, captured } = await renderForm(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ac");
    await settle();
    rendered.instance.stdin.write(KEYS.LEFT);
    await settle();
    rendered.instance.stdin.write("b");
    await settle();
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ signup: { email: { value: "abc", componentType: undefined } } });
    rendered.unmount();
  });

  it("applies every key of one stdin chunk, not just the first", async () => {
    const { rendered, captured } = await renderForm(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("abc");
    await settle();
    rendered.instance.stdin.write(KEYS.BACKSPACE + KEYS.BACKSPACE);
    await settle();
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ signup: { email: { value: "a", componentType: undefined } } });
    rendered.unmount();
  });

  it("appends to a declared default instead of inserting at the start", async () => {
    const program = [
      '$q = "abc"',
      'root = Stack([Input("q", "Search", null, null, $q), TextContent("You typed: " + $q)])',
    ].join("\n");
    const { rendered, captured } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("z");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("You typed: abcz");
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ $q: "abcz" });
    rendered.unmount();
  });

  it("moves the cursor to the end when an action changes the value", async () => {
    const program = [
      '$q = "abc"',
      'root = Stack([Input("q", "Search", null, null, $q), clear, TextContent("You typed: " + $q)])',
      'clear = Button("Clear", @Set($q, "x"))',
    ].join("\n");
    const { rendered } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("You typed: x");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    rendered.instance.stdin.write("y");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("You typed: xy");
    rendered.unmount();
  });

  it("binds a $variable from an Input inside a Form at page level", async () => {
    const program = [
      '$q = ""',
      'root = Stack([form, TextContent("You typed: " + $q)])',
      'form = Form("search", Buttons([go]), [field])',
      'field = FormControl("Query", Input("q", "Search", null, null, $q))',
      'go = Button("Go")',
    ].join("\n");
    const { rendered, captured } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("late");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("You typed: late");
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ $q: "late" });
    rendered.unmount();
  });

  it("delivers the form name and form state when a button inside the form is pressed", async () => {
    const { rendered, captured } = await renderForm(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(captured.events).toEqual([
      {
        type: "continue_conversation",
        params: {},
        humanFriendlyMessage: "Save",
        formName: "signup",
        formState: { signup: { email: { value: "ab", componentType: undefined } } },
      },
    ]);
    rendered.unmount();
  });

  it("round-trips a $binding through the store", async () => {
    const program = [
      '$q = ""',
      'root = Stack([Input("q", "Search", null, null, $q), TextContent("You typed: " + $q)])',
    ].join("\n");
    const { rendered, captured } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("late");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("You typed: late");
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ $q: "late" });
    rendered.unmount();
  });

  it("masks a password", async () => {
    const program = 'root = Stack([Input("pw", "", "password")])';
    const { rendered } = await renderForm(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("**");
    expect(plain).not.toContain("ab");
    rendered.unmount();
  });

  it("ignores keys while streaming", async () => {
    const { rendered, captured } = await renderForm(formProgram, true);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    expect(captured.snapshots).toEqual([]);
    rendered.unmount();
  });

  it("does nothing on Enter", async () => {
    const { rendered, captured } = await renderForm(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("ab");
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(captured.events).toEqual([]);
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ signup: { email: { value: "ab", componentType: undefined } } });
    rendered.unmount();
  });
});
