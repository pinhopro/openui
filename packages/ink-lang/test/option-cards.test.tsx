import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program =
  'root = Stack([OptionCards("plan", "single", [OptionCard("free", "Free", "No cost", Icon("gift")), OptionCard("pro", "Pro", "Billed monthly", Image("Pro badge"))], null, "free")])';

async function renderCards(source: string) {
  const snapshots: Array<Record<string, unknown>> = [];
  const events: ActionEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    onStateUpdate: function onStateUpdate(state) {
      snapshots.push(state);
    },
    onAction: function onAction(event) {
      events.push(event);
    },
  });
  return { rendered, snapshots, events };
}

describe("OptionCards", () => {
  it("renders one bordered card per option with its top content, title and subtitle", async () => {
    const { rendered } = await renderCards(program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("╭");
    expect(plain).toContain("<gift>");
    expect(plain).toContain("● Free");
    expect(plain).toContain("No cost");
    expect(plain).toContain("▣ Pro badge");
    expect(plain).toContain("○ Pro");
    rendered.unmount();
  });

  it("moves with Down and picks with Enter, storing the value", async () => {
    const { rendered, snapshots } = await renderCards(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["Free"]);
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("○ Free");
    expect(plain).toContain("● Pro");
    expect(snapshots[snapshots.length - 1]).toEqual({
      plan: { value: "pro", componentType: undefined },
    });
    rendered.unmount();
  });

  it("keeps a list in multiple mode", async () => {
    const source =
      'root = Stack([OptionCards("addons", "multiple", [OptionCard("a", "A"), OptionCard("b", "B")])])';
    const { rendered, snapshots } = await renderCards(source);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.SPACE + KEYS.DOWN + KEYS.SPACE);
    await settle();
    expect(snapshots[snapshots.length - 1]).toEqual({
      addons: { value: ["a", "b"], componentType: undefined },
    });
    rendered.unmount();
  });

  it("blocks a primary button while nothing is selected when required", async () => {
    const source = [
      "root = Stack([form])",
      'form = Form("signup", Buttons([save]), [field])',
      'field = FormControl("Plan", OptionCards("plan", "single", [OptionCard("free", "Free")], {required: true}))',
      'save = Button("Save", @ToAssistant("Save"))',
    ].join("\n");
    const { rendered, events } = await renderCards(source);
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
