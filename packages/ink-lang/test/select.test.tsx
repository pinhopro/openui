import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { INVERSE_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const formProgram = [
  "root = Stack([form])",
  'form = Form("deploy", Buttons([go]), [regionField])',
  'regionField = FormControl("Region", Select("region", [us, eu, ap], "Pick a region"))',
  'us = SelectItem("us-east-1", "US East")',
  'eu = SelectItem("eu-west-1", "EU West")',
  'ap = SelectItem("ap-south-1", "Asia Pacific")',
  'go = Button("Go", @ToAssistant("Go"))',
].join("\n");

const boundProgram = [
  '$region = ""',
  'root = Stack([Select("region", [us, eu], "Pick a region", null, $region), TextContent("Region: " + $region)])',
  'us = SelectItem("us-east-1", "US East")',
  'eu = SelectItem("eu-west-1", "EU West")',
].join("\n");

interface Captured {
  snapshots: Array<Record<string, unknown>>;
  events: ActionEvent[];
}

async function renderSelect(program: string, isStreaming = false) {
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

describe("Select", () => {
  it("shows the placeholder while nothing is selected and hides the list until focused", async () => {
    const { rendered } = await renderSelect(formProgram);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Pick a region");
    expect(plain).not.toContain("US East");
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });

  it("uses Select... as the default placeholder", async () => {
    const program = ['root = Stack([Select("size", [SelectItem("s", "Small")])])'].join("\n");
    const { rendered } = await renderSelect(program);
    expect(stripAnsi(rendered.frame())).toContain("Select...");
    rendered.unmount();
  });

  it("opens the list when focused with the cursor on the first item", async () => {
    const { rendered } = await renderSelect(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("US East");
    expect(plain).toContain("EU West");
    expect(plain).toContain("Asia Pacific");
    expect(inverseSegments(rendered.frame())).toEqual([" US East "]);
    rendered.unmount();
  });

  it("moves the cursor with Down and Up and picks with Enter, storing the value under the form", async () => {
    const { rendered, captured } = await renderSelect(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN + KEYS.DOWN);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" Asia Pacific "]);
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" EU West "]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({
      deploy: { region: { value: "eu-west-1", componentType: undefined } },
    });
    expect(captured.events).toEqual([]);
    rendered.unmount();
  });

  it("stops at both ends of the list", async () => {
    const { rendered } = await renderSelect(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" US East "]);
    rendered.instance.stdin.write(KEYS.DOWN + KEYS.DOWN + KEYS.DOWN + KEYS.DOWN);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" Asia Pacific "]);
    rendered.unmount();
  });

  it("shows the picked label once focus moves on", async () => {
    const { rendered } = await renderSelect(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("EU West");
    expect(plain).not.toContain("Pick a region");
    expect(plain).not.toContain("US East");
    expect(inverseSegments(rendered.frame())).toEqual(["[ Go ]"]);
    rendered.unmount();
  });

  it("round-trips a $binding through the store", async () => {
    const { rendered, captured } = await renderSelect(boundProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Region: eu-west-1");
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ $region: "eu-west-1" });
    rendered.unmount();
  });

  it("starts the cursor on the item a declared default selects", async () => {
    const program = [
      '$region = "eu-west-1"',
      'root = Stack([Select("region", [us, eu], "Pick a region", null, $region)])',
      'us = SelectItem("us-east-1", "US East")',
      'eu = SelectItem("eu-west-1", "EU West")',
    ].join("\n");
    const { rendered } = await renderSelect(program);
    expect(stripAnsi(rendered.frame())).toContain("EU West");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" EU West "]);
    rendered.unmount();
  });

  it("delivers the picked value in the form state of a button press", async () => {
    const { rendered, captured } = await renderSelect(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(captured.events).toHaveLength(1);
    expect(captured.events[0]?.formName).toBe("deploy");
    expect(captured.events[0]?.formState).toEqual({
      deploy: { region: { value: "us-east-1", componentType: undefined } },
    });
    rendered.unmount();
  });

  it("ignores keys while streaming", async () => {
    const { rendered, captured } = await renderSelect(formProgram, true);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN + KEYS.ENTER);
    await settle();
    expect(captured.snapshots).toEqual([]);
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });
});
