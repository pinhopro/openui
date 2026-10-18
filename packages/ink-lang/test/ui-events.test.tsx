import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import type { UiEvent } from "../src/ui-events";
import { stripAnsi } from "./helpers/ansi";
import { findCell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = 'root = Stack([Button("Go", @ToAssistant("Go")), Input("q", "Search")])';

function types(events: UiEvent[]): string[] {
  const names: string[] = [];
  for (const event of events) names.push(event.type);
  return names;
}

function ofType(events: UiEvent[], type: string): UiEvent[] {
  const found: UiEvent[] = [];
  for (const event of events) {
    if (event.type === type) found.push(event);
  }
  return found;
}

async function mount() {
  const events: UiEvent[] = [];
  const rendered = await renderProgram(inkLibrary, program, {
    mouse: true,
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  return { rendered, events };
}

describe("onUiEvent", () => {
  it("reports focus and blur with the component type and name", async () => {
    const { rendered, events } = await mount();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(ofType(events, "focus")).toEqual([
      expect.objectContaining({ type: "focus", component: "Button", name: "Go" }),
    ]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(ofType(events, "blur")).toEqual([
      expect.objectContaining({ type: "blur", component: "Button", name: "Go" }),
    ]);
    expect(ofType(events, "focus")[1]).toEqual(
      expect.objectContaining({ type: "focus", component: "Input", name: "q" }),
    );
    rendered.unmount();
  });

  it("reports keydown for every key with the focused component, and input and change for edits", async () => {
    const { rendered, events } = await mount();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("a");
    await settle();
    expect(ofType(events, "keydown")).toEqual([
      expect.objectContaining({ type: "keydown", key: "Tab", component: "" }),
      expect.objectContaining({ type: "keydown", key: "Tab", component: "Button", name: "Go" }),
      expect.objectContaining({ type: "keydown", key: "a", component: "Input", name: "q" }),
    ]);
    expect(ofType(events, "input")).toEqual([
      expect.objectContaining({ type: "input", component: "Input", name: "q", value: "a" }),
    ]);
    expect(ofType(events, "change")).toEqual([
      expect.objectContaining({ type: "change", component: "Input", name: "q", value: "a" }),
    ]);
    rendered.unmount();
  });

  it("reports mousedown, mouseup and click on the component under the pointer", async () => {
    const { rendered, events } = await mount();
    const cell = findCell(stripAnsi(rendered.frame()), "[ Go ]");
    rendered.instance.stdin.write(MOUSE.click(cell.x + 2, cell.y));
    await settle();
    const mouse = ofType(events, "mousedown").concat(
      ofType(events, "mouseup"),
      ofType(events, "click"),
    );
    expect(mouse).toEqual([
      expect.objectContaining({
        type: "mousedown",
        component: "Button",
        name: "Go",
        button: "left",
      }),
      expect.objectContaining({ type: "mouseup", component: "Button", name: "Go", button: "left" }),
      expect.objectContaining({ type: "click", component: "Button", name: "Go", x: cell.x + 2 }),
    ]);
    expect(ofType(events, "focus")).toContainEqual(
      expect.objectContaining({ component: "Button", name: "Go" }),
    );
    rendered.unmount();
  });

  it("reports a double click as dblclick after the second click", async () => {
    const { rendered, events } = await mount();
    const cell = findCell(stripAnsi(rendered.frame()), "[ Go ]");
    rendered.instance.stdin.write(
      MOUSE.click(cell.x + 2, cell.y) + MOUSE.click(cell.x + 2, cell.y),
    );
    await settle();
    expect(types(ofType(events, "click").concat(ofType(events, "dblclick")))).toEqual([
      "click",
      "click",
      "dblclick",
    ]);
    rendered.unmount();
  });

  it("reports mouseenter, mousemove and mouseleave as the pointer crosses a component", async () => {
    const { rendered, events } = await mount();
    const cell = findCell(stripAnsi(rendered.frame()), "Search");
    rendered.instance.stdin.write(MOUSE.move(cell.x, cell.y));
    await settle();
    rendered.instance.stdin.write(MOUSE.move(cell.x + 1, cell.y));
    await settle();
    rendered.instance.stdin.write(MOUSE.move(90, 20));
    await settle();
    const crossing = ofType(events, "mouseenter").concat(
      ofType(events, "mousemove"),
      ofType(events, "mouseleave"),
    );
    expect(crossing).toEqual([
      expect.objectContaining({ type: "mouseenter", component: "Input", name: "q" }),
      expect.objectContaining({ type: "mousemove", component: "Input", x: cell.x, y: cell.y }),
      expect.objectContaining({ type: "mousemove", component: "Input", x: cell.x + 1 }),
      expect.objectContaining({ type: "mouseleave", component: "Input", name: "q" }),
    ]);
    rendered.unmount();
  });

  it("reports contextmenu on a right click", async () => {
    const { rendered, events } = await mount();
    const cell = findCell(stripAnsi(rendered.frame()), "[ Go ]");
    rendered.instance.stdin.write(MOUSE.rightClick(cell.x + 2, cell.y));
    await settle();
    expect(ofType(events, "contextmenu")).toEqual([
      expect.objectContaining({ type: "contextmenu", component: "Button", name: "Go" }),
    ]);
    rendered.unmount();
  });
});
