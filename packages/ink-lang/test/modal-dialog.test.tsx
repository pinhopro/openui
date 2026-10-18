import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, RED_ON, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "$confirm = true",
  "root = Stack([outside, dialog])",
  'outside = Button("Outside", @ToAssistant("Outside"))',
  'dialog = ModalDialog("destructive", "Delete Carlos Ruiz?", "Carlos Ruiz will no longer appear in your contacts.", "Cancel", "Delete contact", $confirm)',
].join("\n");

async function mount() {
  const actions: ActionEvent[] = [];
  const states: Array<Record<string, unknown>> = [];
  const rendered = await renderProgram(inkLibrary, program, {
    onAction: function onAction(event) {
      actions.push(event);
    },
    onStateUpdate: function onStateUpdate(state) {
      states.push(state);
    },
  });
  return { rendered, actions, states };
}

describe("ModalDialog", () => {
  it("draws the variant mark, title, body and the two buttons, and traps focus", async () => {
    const { rendered } = await mount();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Delete Carlos Ruiz?");
    expect(plain).toContain("no longer appear");
    expect(plain).toContain("[ Cancel ]");
    expect(plain).toContain("[ Delete contact ]");
    const confirmLine = rendered
      .frame()
      .split("\n")
      .find(function has(line) {
        return stripAnsi(line).includes("[ Delete contact ]");
      });
    expect(confirmLine).toContain(RED_ON);
    const seen = new Set<string>();
    for (let count = 0; count < 4; count += 1) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
      for (const segment of inverseSegments(rendered.frame())) seen.add(segment);
    }
    expect(seen.has("[ Outside ]")).toBe(false);
    expect(seen.has("[ Cancel ]")).toBe(true);
    rendered.unmount();
  });

  it("closes on cancel without an action and fires the confirm label as an action", async () => {
    const { rendered, actions, states } = await mount();
    while (!inverseSegments(rendered.frame()).includes("[ Cancel ]")) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Delete Carlos Ruiz?");
    expect(actions).toEqual([]);
    expect(states[states.length - 1]).toEqual({ $confirm: false });
    rendered.unmount();

    const again = await mount();
    while (!inverseSegments(again.rendered.frame()).includes("[ Delete contact ]")) {
      again.rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    again.rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(again.actions.map((event) => event.humanFriendlyMessage)).toEqual(["Delete contact"]);
    expect(stripAnsi(again.rendered.frame())).not.toContain("Delete Carlos Ruiz?");
    again.rendered.unmount();
  });

  it("shows an info dialog without the open binding and with its own actions", async () => {
    const actions: ActionEvent[] = [];
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([ModalDialog("info", "Saved", "Your changes are safe.", null, "OK", null, @ToAssistant("Acknowledged"))])',
      {
        onAction: function onAction(event) {
          actions.push(event);
        },
      },
    );
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Saved");
    expect(plain).not.toContain("[ Cancel ]");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(actions.map((event) => event.humanFriendlyMessage)).toEqual(["Acknowledged"]);
    rendered.unmount();
  });
});
