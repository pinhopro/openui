import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import type { DesignSystemInput } from "../../src/design/design-system";
import type { UiEvent } from "../../src/ui-events";
import { INVERSE_ON, inverseSegments, stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { renderProgram, type RenderedProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

async function press(rendered: RenderedProgram, key: string): Promise<void> {
  rendered.instance.stdin.write(key);
  await settle();
}

/**
 * What the focused stop shows: its inverse text, or for a text field (whose
 * inverse is the blank cursor after the value) the word right before it.
 */
function focusedText(frame: string): string {
  for (const line of frame.split("\n")) {
    const start = line.indexOf(INVERSE_ON);
    if (start === -1) continue;
    const segment = inverseSegments(line).join("");
    if (segment.trim() !== "") return segment;
    const words = stripAnsi(line.slice(0, start)).trim().split(" ");
    return words[words.length - 1] ?? "";
  }
  return "";
}

/** What the focused stop shows after each of `count` presses of Tab. */
async function tabThrough(rendered: RenderedProgram, count: number): Promise<string[]> {
  const visited: string[] = [];
  for (let step = 0; step < count; step += 1) {
    await press(rendered, KEYS.TAB);
    visited.push(focusedText(rendered.frame()));
  }
  return visited;
}

/**
 * The stop each of `count` presses of Tab lands on, from the UI events (a
 * pressable card shows focus by its border): the focus events of each press
 * joined by " + ", so a press that focuses more than one stop on its way
 * shows up as a mismatch.
 */
async function tabThroughEvents(
  program: string,
  count: number,
  designSystem: DesignSystemInput = {},
): Promise<string[]> {
  let focused: string[] = [];
  const rendered = await renderProgram(inkLibrary, program, {
    designSystem,
    onUiEvent: function onUiEvent(event: UiEvent) {
      if (event.type === "focus") focused.push(event.component + ":" + event.name);
    },
  });
  const visited: string[] = [];
  for (let step = 0; step < count; step += 1) {
    focused = [];
    await press(rendered, KEYS.TAB);
    visited.push(focused.join(" + "));
  }
  rendered.unmount();
  return visited;
}

describe("Tab follows the sequence of the program tree", () => {
  it("visits a stop deep inside a Table in a Card before the stops after it", async () => {
    const program = [
      'root = Stack([left, right], "row")',
      'left = Card([Table([Col("Search query", [Input("q", "Search", null, null, $q)])]), Button("Under", @ToAssistant("Under"))])',
      'right = Card([Button("Right", @ToAssistant("Right"))])',
      '$q = "abc"',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(await tabThrough(rendered, 4)).toEqual(["abc", "[ Under ]", "[ Right ]", "abc"]);
    rendered.unmount();
  });

  it("puts the tab strip before the active tab's content", async () => {
    const program = [
      "root = Stack([tabs])",
      'tabs = Tabs([TabItem("a", "One", [Button("In tab", @ToAssistant("In tab"))]), TabItem("b", "Two", [TextContent("two")])])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(await tabThrough(rendered, 3)).toEqual([" One ", "[ In tab ]", " One "]);
    rendered.unmount();
  });

  it("visits the cells of a paged table row by row, then the pager", async () => {
    const first: string[] = [
      'Input("a1", "A", null, null, $a1)',
      'Input("a2", "A", null, null, $a2)',
    ];
    const second: string[] = [
      'Input("b1", "B", null, null, $b1)',
      'Input("b2", "B", null, null, $b2)',
    ];
    for (let row = 3; row <= 12; row += 1) {
      first.push(`"a${row}"`);
      second.push(`"b${row}"`);
    }
    const program = [
      "root = Stack([table])",
      `table = Table([Col("Column A", [${first.join(", ")}]), Col("Column B", [${second.join(", ")}])])`,
      '$a1 = "a1"',
      '$a2 = "a2"',
      '$b1 = "b1"',
      '$b2 = "b2"',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(await tabThrough(rendered, 7)).toEqual([
      "a1",
      "b1",
      "a2",
      "b2",
      "[ prev ]",
      "[ next ]",
      "a1",
    ]);
    rendered.unmount();
  });

  it("visits the cells of an EditableTable row by row", async () => {
    const program = [
      "root = Stack([grid])",
      'grid = EditableTable("grid", [{type: "text", key: "name", header: "Name"}, {type: "select", key: "status", header: "Status", options: [{value: "open", label: "Open"}, {value: "done", label: "Done"}]}], [{id: "r1", values: ["Pens", "open"]}, {id: "r2", values: ["Ink", "done"]}])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(await tabThrough(rendered, 5)).toEqual(["Pens", "Open", "Ink", "Done", "Pens"]);
    rendered.unmount();
  });

  it("visits the cards of a two-column card grid in declaration order", async () => {
    const program = [
      "root = Stack([block])",
      'block = SnippetCardBlock([a, b, c], "grid", true, @ToAssistant("Pick"))',
      'a = SnippetCardItem("a", IconText(Icon("a"), null, null, "Alpha"))',
      'b = SnippetCardItem("b", IconText(Icon("b"), null, null, "Beta"))',
      'c = SnippetCardItem("c", IconText(Icon("c"), null, null, "Gamma"))',
    ].join("\n");
    const designSystem: DesignSystemInput = { tokens: { "grid.columns": 2 } };
    expect(await tabThroughEvents(program, 4, designSystem)).toEqual([
      "SnippetCardBlock:Alpha",
      "SnippetCardBlock:Beta",
      "SnippetCardBlock:Gamma",
      "SnippetCardBlock:Alpha",
    ]);
  });

  it("visits the stops inside a pressable card before the next card", async () => {
    const program = [
      "root = Stack([block])",
      'block = CompositeCardBlock([a, b], "grid", true, @ToAssistant("Pick"))',
      'a = CompositeCardItem("basic", Text(null, "Basic"), [Text(null, "For one")], {price: BoldText(null, "$9"), button: Button("Choose basic", @ToAssistant("Choose basic"))})',
      'b = CompositeCardItem("team", Text(null, "Team"), [Text(null, "For teams")], {price: BoldText(null, "$29"), button: Button("Choose team", @ToAssistant("Choose team"))})',
    ].join("\n");
    expect(await tabThroughEvents(program, 5)).toEqual([
      "CompositeCardBlock:Basic",
      "Button:Choose basic",
      "CompositeCardBlock:Team",
      "Button:Choose team",
      "CompositeCardBlock:Basic",
    ]);
  });

  it("visits each Accordion header before the content of its section, whatever order they opened in", async () => {
    const program = [
      "root = Stack([Accordion([a, b])])",
      'a = AccordionItem("a", "First", [Button("Inside first", @ToAssistant("1"))])',
      'b = AccordionItem("b", "Second", [Button("Inside second", @ToAssistant("2"))])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    // Open the second section, then the first.
    await press(rendered, KEYS.TAB);
    await press(rendered, KEYS.TAB);
    await press(rendered, KEYS.ENTER);
    await press(rendered, KEYS.SHIFT_TAB);
    expect(focusedText(rendered.frame())).toBe("▸ First");
    await press(rendered, KEYS.ENTER);
    expect(await tabThrough(rendered, 4)).toEqual([
      "[ Inside first ]",
      "▾ Second",
      "[ Inside second ]",
      "▾ First",
    ]);
    // Closing and reopening a section keeps its content right after its header.
    await press(rendered, KEYS.ENTER);
    await press(rendered, KEYS.ENTER);
    expect(await tabThrough(rendered, 2)).toEqual(["[ Inside first ]", "▾ Second"]);
    rendered.unmount();
  });

  it("visits the items of a ListBlock top to bottom", async () => {
    const program = [
      "root = Stack([ListBlock([first, second, third])])",
      'first = ListItem("Plan", null, null, "Open", @ToAssistant("Plan"))',
      'second = ListItem("Build", null, null, "Open", @ToAssistant("Build"))',
      'third = ListItem("Ship", null, null, "Open", @ToAssistant("Ship"))',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(await tabThrough(rendered, 4)).toEqual(["Plan", "Build", "Ship", "Plan"]);
    rendered.unmount();
  });
});
