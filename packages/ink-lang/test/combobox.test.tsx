import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { INVERSE_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const ESCAPE = "\u001b";

const formProgram = [
  "root = Stack([form])",
  'form = Form("deploy", Buttons([go]), [regionField])',
  'regionField = FormControl("Region", Combobox("region", [us, eu, ap], "Pick a region"))',
  'us = SelectItem("us-east-1", "US East")',
  'eu = SelectItem("eu-west-1", "EU West")',
  'ap = SelectItem("ap-south-1", "Asia Pacific")',
  'go = Button("Go", @ToAssistant("Go"))',
].join("\n");

const requiredProgram = [
  "root = Stack([form])",
  'form = Form("deploy", Buttons([go]), [regionField])',
  'regionField = FormControl("Region", Combobox("region", [us, eu], "Pick a region", {required: true}), "Where to deploy")',
  'us = SelectItem("us-east-1", "US East")',
  'eu = SelectItem("eu-west-1", "EU West")',
  'go = Button("Go", @ToAssistant("Go"))',
].join("\n");

const boundProgram = [
  '$region = ""',
  'root = Stack([Combobox("region", [us, eu], "Pick a region", null, $region), TextContent("Region: " + $region)])',
  'us = SelectItem("us-east-1", "US East")',
  'eu = SelectItem("eu-west-1", "EU West")',
].join("\n");

function longProgram(count: number): string {
  const items: string[] = [];
  const refs: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    items.push(`o${index} = SelectItem("v${index}", "Option ${index}")`);
    refs.push(`o${index}`);
  }
  return [`root = Stack([Combobox("pick", [${refs.join(", ")}])])`, ...items].join("\n");
}

interface Captured {
  snapshots: Array<Record<string, unknown>>;
  events: ActionEvent[];
}

async function renderCombobox(program: string, isStreaming = false, mouse = false) {
  const captured: Captured = { snapshots: [], events: [] };
  const rendered = await renderProgram(inkLibrary, program, {
    isStreaming,
    mouse,
    onStateUpdate: function onStateUpdate(state) {
      captured.snapshots.push(state);
    },
    onAction: function onAction(event) {
      captured.events.push(event);
    },
  });
  return { rendered, captured };
}

describe("Combobox", () => {
  it("shows the placeholder while nothing is picked and hides the list until focused", async () => {
    const { rendered } = await renderCombobox(formProgram);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Pick a region");
    expect(plain).not.toContain("US East");
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });

  it("opens the full list when focused with the highlight on the first option", async () => {
    const { rendered } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("US East");
    expect(plain).toContain("EU West");
    expect(plain).toContain("Asia Pacific");
    expect(inverseSegments(rendered.frame())).toContain(" US East ");
    rendered.unmount();
  });

  it("filters the list as the user types and highlights the first match", async () => {
    const { rendered, captured } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("we");
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("> we");
    expect(plain).toContain("EU West");
    expect(plain).not.toContain("US East");
    expect(plain).not.toContain("Asia Pacific");
    expect(inverseSegments(rendered.frame())).toContain(" EU West ");
    // Typing a filter is not a value change.
    expect(captured.snapshots).toEqual([]);
    rendered.unmount();
  });

  it("matches anywhere in the label, ignoring case", async () => {
    const { rendered } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("PAC");
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Asia Pacific");
    expect(plain).not.toContain("EU West");
    rendered.unmount();
  });

  it("tells the user when nothing matches", async () => {
    const { rendered } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("zzz");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("no matches");
    rendered.unmount();
  });

  it("moves the highlight with Down and Up and picks with Enter, storing the value under the form", async () => {
    const { rendered, captured } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN + KEYS.DOWN);
    await settle();
    expect(inverseSegments(rendered.frame())).toContain(" Asia Pacific ");
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    expect(inverseSegments(rendered.frame())).toContain(" EU West ");
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({
      deploy: { region: { value: "eu-west-1", componentType: undefined } },
    });
    expect(captured.events).toEqual([]);
    rendered.unmount();
  });

  it("picks the highlighted match of a typed filter and clears the filter", async () => {
    const { rendered, captured } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("asia");
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({
      deploy: { region: { value: "ap-south-1", componentType: undefined } },
    });
    const plain = stripAnsi(rendered.frame());
    expect(plain).not.toContain("> asia");
    expect(plain).toContain("US East");
    rendered.unmount();
  });

  it("clears the filter on Escape", async () => {
    const { rendered } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("we");
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("US East");
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows, then drops focus.
    await settle(60);
    expect(stripAnsi(rendered.frame())).not.toContain("> we");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).not.toContain("we");
    expect(plain).toContain("US East");
    expect(plain).toContain("Asia Pacific");
    rendered.unmount();
  });

  it("edits the filter with Backspace", async () => {
    const { rendered } = await renderCombobox(formProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("wez");
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("no matches");
    rendered.instance.stdin.write(KEYS.BACKSPACE);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("EU West");
    rendered.unmount();
  });

  it("caps the open list and reports how many options follow", async () => {
    const { rendered } = await renderCombobox(longProgram(12));
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Option 1");
    expect(plain).toContain("Option 5");
    expect(plain).not.toContain("Option 6");
    expect(plain).toContain("+7 more");
    rendered.instance.stdin.write(KEYS.DOWN.repeat(6));
    await settle();
    const scrolled = stripAnsi(rendered.frame());
    expect(scrolled).toContain("Option 7");
    expect(scrolled).not.toContain("Option 1\n");
    expect(scrolled).toContain("+5 more");
    rendered.unmount();
  });

  it("shows the picked label once focus moves on", async () => {
    const { rendered } = await renderCombobox(formProgram);
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
    const { rendered, captured } = await renderCombobox(boundProgram);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("eu");
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Region: eu-west-1");
    const last = captured.snapshots[captured.snapshots.length - 1];
    expect(last).toEqual({ $region: "eu-west-1" });
    rendered.unmount();
  });

  it("delivers the picked value in the form state of a button press", async () => {
    const { rendered, captured } = await renderCombobox(formProgram);
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

  it("marks a required combobox and blocks the primary button until a value is picked", async () => {
    const { rendered, captured } = await renderCombobox(requiredProgram);
    expect(stripAnsi(rendered.frame())).toContain("Region *");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(captured.events).toEqual([]);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("This field is required");
    expect(plain).not.toContain("Where to deploy");
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(captured.events).toHaveLength(1);
    expect(stripAnsi(rendered.frame())).not.toContain("This field is required");
    rendered.unmount();
  });

  it("ignores keys while streaming", async () => {
    const { rendered, captured } = await renderCombobox(formProgram, true);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("we" + KEYS.ENTER);
    await settle();
    expect(captured.snapshots).toEqual([]);
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });

  describe("with the mouse", () => {
    // Row 0 is the "Region" label, row 1 the combobox line; focused, the options are rows 2 to 4.
    it("opens on a click at the combobox line and picks the clicked option", async () => {
      const { rendered, captured } = await renderCombobox(formProgram, false, true);
      rendered.instance.stdin.write(MOUSE.click(4, 1));
      await settle();
      expect(stripAnsi(rendered.frame())).toContain("EU West");
      rendered.instance.stdin.write(MOUSE.click(6, 3));
      await settle();
      expect(captured.snapshots[captured.snapshots.length - 1]).toEqual({
        deploy: { region: { value: "eu-west-1", componentType: undefined } },
      });
      expect(stripAnsi(rendered.frame())).toContain("● ");
      rendered.unmount();
    });

    it("picks from the filtered list by its visible row", async () => {
      const { rendered, captured } = await renderCombobox(formProgram, false, true);
      rendered.instance.stdin.write(MOUSE.click(4, 1));
      await settle();
      rendered.instance.stdin.write("asia");
      await settle();
      expect(stripAnsi(rendered.frame())).not.toContain("EU West");
      rendered.instance.stdin.write(MOUSE.click(6, 2));
      await settle();
      expect(captured.snapshots[captured.snapshots.length - 1]).toEqual({
        deploy: { region: { value: "ap-south-1", componentType: undefined } },
      });
      rendered.unmount();
    });

    it("moves the highlight with the wheel", async () => {
      const { rendered } = await renderCombobox(formProgram, false, true);
      rendered.instance.stdin.write(MOUSE.wheelDown(4, 1, 2));
      await settle();
      expect(inverseSegments(rendered.frame())).toContain(" Asia Pacific ");
      rendered.instance.stdin.write(MOUSE.wheelUp(4, 3));
      await settle();
      expect(inverseSegments(rendered.frame())).toContain(" EU West ");
      rendered.unmount();
    });

    it("ignores the mouse while streaming", async () => {
      const { rendered, captured } = await renderCombobox(formProgram, true, true);
      rendered.instance.stdin.write(MOUSE.click(4, 1));
      await settle();
      expect(stripAnsi(rendered.frame())).not.toContain("EU West");
      expect(captured.snapshots).toEqual([]);
      rendered.unmount();
    });
  });
});
