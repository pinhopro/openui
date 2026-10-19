import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import type { UiEvent } from "../src/ui-events";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { fillerRows, wholeFillerRows } from "./helpers/filler-rows";
import { findCell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const ESCAPE = "\u001b";
const ROWS = 12;

/**
 * The opener, the modal (with `size` when given), a text row declared after
 * it and filler rows, stacked without gaps.
 */
function program(open: boolean, children: string, size = ""): string {
  const sized = size === "" ? "" : `, ${size}`;
  return [
    `$show = ${open}`,
    `root = Stack([open, Modal("Confirm", $show, [${children}]${sized}), after, ${fillerRows(ROWS)}], "column", "none")`,
    'open = Button("Open", @Set($show, true))',
    'after = TextContent("row after the modal")',
  ].join("\n");
}

const CONFIRM = 'TextContent("Are you sure?"), Buttons([Button("Yes", @ToAssistant("Yes"))])';
const REGION =
  'Combobox("region", [SelectItem("us-east-1", "US East"), SelectItem("eu-west-1", "EU West"), SelectItem("ap-south-1", "Asia Pacific")], "Pick a region")';

async function mount(source: string, mouse = false) {
  const snapshots: Array<Record<string, unknown>> = [];
  const events: UiEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    mouse,
    onStateUpdate: function onStateUpdate(state) {
      snapshots.push(state);
    },
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  return { rendered, snapshots, events };
}

function ofType(events: UiEvent[], type: string): UiEvent[] {
  const found: UiEvent[] = [];
  for (const event of events) {
    if (event.type === type) found.push(event);
  }
  return found;
}

describe("Modal", () => {
  it("renders nothing while the binding is false", async () => {
    const { rendered } = await mount(program(false, CONFIRM));
    expect(stripAnsi(rendered.frame())).not.toContain("Confirm");
    rendered.unmount();
  });

  it("opens with the binding on its first content stop and closes from its close button, the last stop", async () => {
    const { rendered, snapshots } = await mount(program(false, CONFIRM));
    const closed = stripAnsi(rendered.frame());
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("╭");
    expect(plain).toContain("Confirm");
    expect(plain).toContain("[ x ]");
    expect(plain).toContain("Are you sure?");
    expect(plain).toContain("[ Yes ]");
    // It floats: the row after its declaration keeps its place and some base rows are covered.
    expect(findCell(plain, "row after the modal")).toEqual(findCell(closed, "row after the modal"));
    expect(plain.split("\n")).toHaveLength(closed.split("\n").length);
    expect(wholeFillerRows(plain, ROWS)).toBeLessThan(ROWS);
    // Opening moves focus to the dialog's first stop; the close control comes last.
    expect(inverseSegments(rendered.frame())).toEqual(["[ Yes ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ x ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Confirm");
    expect(snapshots[snapshots.length - 1]).toEqual({ $show: false });
    rendered.unmount();
  });

  it("is as wide as its size: 60 cells by default, 40 for sm", async () => {
    function topBorderWidth(frame: string): number {
      const corner = findCell(frame, "╭");
      const line = frame.split("\n")[corner.y] ?? "";
      return line.indexOf("╮") - corner.x + 1;
    }
    const md = await mount(program(true, CONFIRM));
    expect(topBorderWidth(stripAnsi(md.rendered.frame()))).toBe(60);
    md.rendered.unmount();
    const sm = await mount(program(true, CONFIRM, '"sm"'));
    expect(topBorderWidth(stripAnsi(sm.rendered.frame()))).toBe(40);
    sm.rendered.unmount();
  });

  it("closes on Escape and reports cancel", async () => {
    const { rendered, snapshots, events } = await mount(program(true, CONFIRM));
    expect(stripAnsi(rendered.frame())).toContain("Are you sure?");
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows.
    await settle(60);
    expect(stripAnsi(rendered.frame())).not.toContain("Are you sure?");
    expect(snapshots[snapshots.length - 1]).toEqual({ $show: false });
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ type: "cancel", component: "Modal", name: "Confirm" }),
    ]);
    rendered.unmount();
  });

  it("lets Escape clear a Combobox filter first; the next Escape closes the modal", async () => {
    const { rendered, snapshots } = await mount(program(true, REGION));
    rendered.instance.stdin.write("we");
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("US East");
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    const cleared = stripAnsi(rendered.frame());
    expect(cleared).toContain("Confirm");
    expect(cleared).not.toContain("> we");
    expect(cleared).toContain("US East");
    expect(cleared).toContain("Asia Pacific");
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    expect(stripAnsi(rendered.frame())).not.toContain("Confirm");
    expect(snapshots[snapshots.length - 1]).toEqual({ $show: false });
    rendered.unmount();
  });

  it("closes on a click on the backdrop, not on a click inside", async () => {
    const { rendered, snapshots, events } = await mount(program(true, CONFIRM), true);
    const opened = stripAnsi(rendered.frame());
    const inside = findCell(opened, "Are you sure?");
    rendered.instance.stdin.write(MOUSE.click(inside.x + 1, inside.y));
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("Are you sure?");
    const outside = findCell(opened, "row after the modal");
    rendered.instance.stdin.write(MOUSE.click(outside.x, outside.y));
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Are you sure?");
    expect(snapshots[snapshots.length - 1]).toEqual({ $show: false });
    expect(ofType(events, "cancel")).toHaveLength(1);
    rendered.unmount();
  });
});
