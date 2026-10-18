import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { INVERSE_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([tabs])",
  "tabs = Tabs([overview, logs])",
  'overview = TabItem("overview", "Overview", [TextContent("Everything is fine")])',
  'logs = TabItem("logs", "Logs", [TextContent("No logs yet")])',
].join("\n");

describe("Tabs", () => {
  it("shows the tab strip and only the first tab's content", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Overview");
    expect(plain).toContain("Logs");
    expect(plain).toContain("Everything is fine");
    expect(plain).not.toContain("No logs yet");
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });

  it("focuses the strip with Tab and switches tabs with Right and Left", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" Overview "]);
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" Logs "]);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("No logs yet");
    expect(plain).not.toContain("Everything is fine");
    rendered.instance.stdin.write(KEYS.LEFT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Everything is fine");
    rendered.unmount();
  });

  it("stays on the last tab on Right and on the first on Left", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.LEFT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Everything is fine");
    rendered.instance.stdin.write(KEYS.RIGHT + KEYS.RIGHT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("No logs yet");
    rendered.unmount();
  });

  it("falls back to the last tab when the active one disappears", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("No logs yet");
    await rendered.update({
      response: [
        "root = Stack([tabs])",
        "tabs = Tabs([overview])",
        'overview = TabItem("overview", "Overview", [TextContent("Everything is fine")])',
      ].join("\n"),
    });
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Everything is fine");
    expect(plain).not.toContain("No logs yet");
    rendered.unmount();
  });

  it("cannot be focused while streaming", async () => {
    const rendered = await renderProgram(inkLibrary, program, { isStreaming: true });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.RIGHT);
    await settle();
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    expect(stripAnsi(rendered.frame())).toContain("Everything is fine");
    rendered.unmount();
  });

  it("renders nothing without items", async () => {
    const rendered = await renderProgram(inkLibrary, "root = Stack([Tabs([])])");
    expect(stripAnsi(rendered.frame()).trim()).toBe("");
    rendered.unmount();
  });

  it("lets Tab move on from the strip to a button inside the active tab", async () => {
    const withButton = [
      "root = Stack([tabs])",
      "tabs = Tabs([actions])",
      'actions = TabItem("actions", "Actions", [Buttons([Button("Go")])])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, withButton);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" Actions "]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Go ]"]);
    rendered.unmount();
  });
});
