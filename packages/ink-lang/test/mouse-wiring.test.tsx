import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import type { UiEvent } from "../src/ui-events";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { cellAfter, findCell } from "./helpers/find-cell";
import { MOUSE } from "./helpers/mouse";
import { renderProgram, type RenderedProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

interface Mounted {
  rendered: RenderedProgram;
  events: UiEvent[];
  actions: ActionEvent[];
  states: Array<Record<string, unknown>>;
  plain: () => string;
}

async function mount(program: string): Promise<Mounted> {
  const events: UiEvent[] = [];
  const actions: ActionEvent[] = [];
  const states: Array<Record<string, unknown>> = [];
  const rendered = await renderProgram(inkLibrary, program, {
    mouse: true,
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
    onAction: function onAction(event) {
      actions.push(event);
    },
    onStateUpdate: function onStateUpdate(state) {
      states.push(state);
    },
  });
  return {
    rendered,
    events,
    actions,
    states,
    plain: function plain() {
      return stripAnsi(rendered.frame());
    },
  };
}

function focused(events: UiEvent[]): UiEvent[] {
  const found: UiEvent[] = [];
  for (const event of events) {
    if (event.type === "focus") found.push(event);
  }
  return found;
}

function lastState(states: Array<Record<string, unknown>>): Record<string, unknown> {
  return states[states.length - 1] ?? {};
}

async function click(mounted: Mounted, text: string, offset = 0): Promise<void> {
  const cell = cellAfter(mounted.plain(), text, offset);
  mounted.rendered.instance.stdin.write(MOUSE.click(cell.x, cell.y));
  await settle();
}

describe("a click focuses every typeable field", () => {
  it("TextArea", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), TextArea("bio", "Your bio", 2)])',
    );
    await click(mounted, "Your bio");
    expect(focused(mounted.events)).toEqual([
      expect.objectContaining({ component: "TextArea", name: "bio" }),
    ]);
    expect(mounted.plain()).toContain("> ");
    mounted.rendered.unmount();
  });

  it("DatePicker", async () => {
    const mounted = await mount('root = Stack([TextContent("above"), DatePicker("start")])');
    await click(mounted, "YYYY-MM-DD");
    expect(focused(mounted.events)).toEqual([
      expect.objectContaining({ component: "DatePicker", name: "start" }),
    ]);
    mounted.rendered.unmount();
  });

  it("Slider, setting the value under the pointer", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), Slider("volume", "continuous", 0, 100, 1, [50])])',
    );
    await click(mounted, "├", 1);
    expect(focused(mounted.events)).toEqual([
      expect.objectContaining({ component: "Slider", name: "volume" }),
    ]);
    expect(mounted.plain()).toContain("┤ 0");
    await click(mounted, "├", 20);
    expect(mounted.plain()).toContain("┤ 100");
    expect(lastState(mounted.states)).toEqual({
      volume: { value: [100], componentType: undefined },
    });
    mounted.rendered.unmount();
  });

  it("Slider, dragging the knob", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), Slider("volume", "continuous", 0, 100, 1, [0])])',
    );
    const start = cellAfter(mounted.plain(), "├", 1);
    mounted.rendered.instance.stdin.write(MOUSE.press(start.x, start.y));
    await settle();
    mounted.rendered.instance.stdin.write(MOUSE.drag(start.x + 10, start.y));
    await settle();
    expect(mounted.plain()).toContain("┤ 53");
    // Keeps following the pointer past the track while the button is held.
    mounted.rendered.instance.stdin.write(MOUSE.drag(start.x + 40, start.y + 3));
    await settle();
    expect(mounted.plain()).toContain("┤ 100");
    mounted.rendered.instance.stdin.write(MOUSE.release(start.x + 40, start.y + 3));
    await settle();
    expect(lastState(mounted.states)).toEqual({
      volume: { value: [100], componentType: undefined },
    });
    mounted.rendered.unmount();
  });

  it("EditableTable cells", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), EditableTable("servers", [{type: "text", key: "name", header: "Name"}, {type: "number", key: "cpus", header: "CPUs"}], [{id: "a", values: ["api-1", 4]}, {id: "b", values: ["web-1", 2]}])])',
    );
    await click(mounted, "web-1", 1);
    expect(focused(mounted.events)).toEqual([
      expect.objectContaining({ component: "EditableTable", name: "servers" }),
    ]);
    mounted.rendered.instance.stdin.write("x");
    await settle();
    expect(mounted.plain()).toContain("web-1x");
    mounted.rendered.unmount();
  });
});

describe("a click picks the option under the pointer", () => {
  it("CheckBoxGroup toggles the clicked box and focuses the group", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), CheckBoxGroup("notify", [CheckBoxItem("Email", "", "email"), CheckBoxItem("SMS", "", "sms")])])',
    );
    await click(mounted, "SMS");
    expect(mounted.plain()).toContain("[x] SMS");
    expect(lastState(mounted.states)).toEqual({
      notify: { value: { email: false, sms: true }, componentType: undefined },
    });
    expect(focused(mounted.events)).toEqual([
      expect.objectContaining({ component: "CheckBoxGroup", name: "notify" }),
    ]);
    expect(inverseSegments(mounted.rendered.frame())).toEqual(["SMS"]);
    mounted.rendered.unmount();
  });

  it("RadioGroup selects the clicked radio", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), RadioGroup("billing", [RadioItem("Monthly", "", "monthly"), RadioItem("Yearly", "", "yearly")])])',
    );
    await click(mounted, "Yearly");
    expect(lastState(mounted.states)).toEqual({
      billing: { value: "yearly", componentType: undefined },
    });
    mounted.rendered.unmount();
  });

  it("SwitchGroup flips the clicked switch", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), SwitchGroup("features", [SwitchItem("Beta", "", "beta"), SwitchItem("Telemetry", "", "telemetry")])])',
    );
    await click(mounted, "Telemetry");
    expect(lastState(mounted.states)).toEqual({
      features: { value: { beta: false, telemetry: true }, componentType: undefined },
    });
    mounted.rendered.unmount();
  });

  it("Chips toggles the clicked chip", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), Chips("size", "multiple", [ChipItem("s", "Small"), ChipItem("m", "Medium")])])',
    );
    await click(mounted, "[ Medium ]", 2);
    expect(mounted.plain()).toContain("[✓ Medium]");
    expect(lastState(mounted.states)).toEqual({
      size: { value: ["m"], componentType: undefined },
    });
    mounted.rendered.unmount();
  });

  it("OptionCards selects the clicked card", async () => {
    const mounted = await mount(
      'root = Stack([TextContent("above"), OptionCards("tier", "single", [OptionCard("a", "Starter", "For one"), OptionCard("b", "Growth", "For teams")])])',
    );
    await click(mounted, "For teams");
    expect(lastState(mounted.states)).toEqual({
      tier: { value: "b", componentType: undefined },
    });
    expect(mounted.plain()).toContain("● Growth");
    mounted.rendered.unmount();
  });
});

describe("a click presses the control under the pointer", () => {
  it("Accordion header opens its section", async () => {
    const mounted = await mount(
      'root = Stack([Accordion([AccordionItem("a", "What is it?", [TextContent("The answer")])])])',
    );
    expect(mounted.plain()).not.toContain("The answer");
    await click(mounted, "What is it?");
    expect(mounted.plain()).toContain("The answer");
    mounted.rendered.unmount();
  });

  it("Carousel arrows and wheel move between slides", async () => {
    const mounted = await mount(
      'root = Stack([Carousel([[TextContent("Slide one")], [TextContent("Slide two")], [TextContent("Slide three")]])])',
    );
    await click(mounted, "▸");
    expect(mounted.plain()).toContain("Slide two");
    await click(mounted, "◂");
    expect(mounted.plain()).toContain("Slide one");
    const cell = findCell(mounted.plain(), "Slide one");
    mounted.rendered.instance.stdin.write(MOUSE.wheelDown(cell.x, cell.y, 2));
    await settle();
    expect(mounted.plain()).toContain("Slide three");
    mounted.rendered.unmount();
  });

  it("ListBlock entries fire their action", async () => {
    const mounted = await mount(
      'root = Stack([ListBlock([ListItem("Plan", null, null, "Open", @ToAssistant("Open plan"))])])',
    );
    await click(mounted, "Plan");
    expect(mounted.actions).toHaveLength(1);
    expect(mounted.actions[0]?.humanFriendlyMessage).toBe("Open plan");
    mounted.rendered.unmount();
  });

  it("IconButton fires its action", async () => {
    const mounted = await mount(
      'root = Stack([IconButton("Delete", Icon("trash"), @ToAssistant("Delete it"))])',
    );
    await click(mounted, "Delete");
    expect(mounted.actions[0]?.humanFriendlyMessage).toBe("Delete it");
    mounted.rendered.unmount();
  });

  it("Modal close button closes it", async () => {
    const mounted = await mount(
      '$show = true\nroot = Stack([Modal("Confirm", $show, [TextContent("Sure?")])])',
    );
    expect(mounted.plain()).toContain("Sure?");
    await click(mounted, "[ x ]", 2);
    expect(mounted.plain()).not.toContain("Sure?");
    mounted.rendered.unmount();
  });

  it("card block items fire the block action with the item context", async () => {
    const mounted = await mount(
      'root = Stack([SnippetCardBlock([SnippetCardItem("cpu", IconText(Icon("cpu"), null, null, "CPU"), BoldText(null, "38%")), SnippetCardItem("mem", IconText(Icon("memory"), null, null, "Memory"), BoldText(null, "71%"))], "grid", true, @ToAssistant("Open"))])',
    );
    await click(mounted, "Memory");
    expect(mounted.actions).toHaveLength(1);
    expect(JSON.stringify(mounted.actions[0])).toContain("itemId");
    expect(JSON.stringify(mounted.actions[0])).toContain("mem");
    expect(focused(mounted.events)).toEqual([
      expect.objectContaining({ component: "SnippetCardBlock", name: "Memory" }),
    ]);
    mounted.rendered.unmount();
  });
});
