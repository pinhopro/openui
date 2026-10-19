import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import type { UiEvent } from "../src/ui-events";
import { inverseSegments, RED_ON, stripAnsi } from "./helpers/ansi";
import { fillerRows, wholeFillerRows } from "./helpers/filler-rows";
import { findCell } from "./helpers/find-cell";
import { KEYS } from "./helpers/keys";
import { MOUSE } from "./helpers/mouse";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const ESCAPE = "\u001b";
const ROWS = 10;
const TITLE = "Delete Carlos Ruiz?";

/** The dialog, bound to `$confirm`, with an optional cancel action. */
function dialog(cancelAction: string): string {
  const action = cancelAction === "" ? "" : `, null, ${cancelAction}`;
  return `dialog = ModalDialog("destructive", "${TITLE}", "Carlos Ruiz will no longer appear in your contacts.", "Cancel", "Delete contact", $confirm${action})`;
}

/**
 * A button outside, the dialog, a text row declared after it and filler rows,
 * stacked without gaps, so the floating dialog is drawn whole over the page.
 */
function program(open: boolean, cancelAction = ""): string {
  return [
    `$confirm = ${open}`,
    `root = Stack([outside, dialog, after, ${fillerRows(ROWS)}], "column", "none")`,
    'outside = Button("Outside", @Set($confirm, true))',
    'after = TextContent("row after the dialog")',
    dialog(cancelAction),
  ].join("\n");
}

async function mount(source = program(true), mouse = false) {
  const actions: ActionEvent[] = [];
  const states: Array<Record<string, unknown>> = [];
  const events: UiEvent[] = [];
  const rendered = await renderProgram(inkLibrary, source, {
    mouse,
    onAction: function onAction(event) {
      actions.push(event);
    },
    onStateUpdate: function onStateUpdate(state) {
      states.push(state);
    },
    onUiEvent: function onUiEvent(event) {
      events.push(event);
    },
  });
  return { rendered, actions, states, events };
}

function ofType(events: UiEvent[], type: string): UiEvent[] {
  const found: UiEvent[] = [];
  for (const event of events) {
    if (event.type === type) found.push(event);
  }
  return found;
}

describe("ModalDialog", () => {
  it("draws the variant mark, title, body and the two buttons, and traps focus", async () => {
    const { rendered } = await mount();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain(TITLE);
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

  it("floats over the page: the rows after its declaration keep their place and some are covered", async () => {
    const { rendered } = await mount(program(false));
    const closed = stripAnsi(rendered.frame());
    expect(closed).not.toContain(TITLE);
    expect(wholeFillerRows(closed, ROWS)).toBe(ROWS);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const opened = stripAnsi(rendered.frame());
    expect(opened).toContain(TITLE);
    expect(findCell(opened, "row after the dialog")).toEqual(
      findCell(closed, "row after the dialog"),
    );
    expect(opened.split("\n")).toHaveLength(closed.split("\n").length);
    expect(wholeFillerRows(opened, ROWS)).toBeLessThan(ROWS);
    rendered.unmount();
  });

  it("fits its content up to 60 cells: a longer body wraps", async () => {
    const long = "Carlos Ruiz will no longer appear in your contacts. ".repeat(3).trim();
    const { rendered } = await mount(
      [
        "$confirm = true",
        `root = Stack([dialog, ${fillerRows(ROWS)}], "column", "none")`,
        `dialog = ModalDialog("destructive", "${TITLE}", "${long}", "Cancel", "Delete contact", $confirm)`,
      ].join("\n"),
    );
    const frame = stripAnsi(rendered.frame());
    const corner = findCell(frame, "╭");
    const top = frame.split("\n")[corner.y] ?? "";
    // As wide as its widest wrapped line, which the 60-cell limit leaves short of 100 cells.
    const width = top.indexOf("╮") - corner.x + 1;
    expect(width).toBeLessThanOrEqual(60);
    expect(width).toBeGreaterThan(50);
    expect(frame).not.toContain(long);
    rendered.unmount();
  });

  it("takes no rows of the page while closed, even in a stack with a gap", async () => {
    const without = await renderProgram(
      inkLibrary,
      'root = Stack([TextContent("above"), TextContent("below")])',
    );
    const expected = stripAnsi(without.frame());
    without.unmount();
    const { rendered } = await mount(
      [
        "$confirm = false",
        'root = Stack([TextContent("above"), dialog, TextContent("below")])',
        dialog(""),
      ].join("\n"),
    );
    expect(stripAnsi(rendered.frame())).toBe(expected);
    rendered.unmount();
  });

  it("opens on cancel, then reaches confirm, then wraps back to cancel", async () => {
    const { rendered } = await mount();
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Delete contact ]"]);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
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
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
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
    expect(stripAnsi(again.rendered.frame())).not.toContain(TITLE);
    again.rendered.unmount();
  });

  it("cancels on Escape: emits cancel, runs the cancel action and closes", async () => {
    const { rendered, actions, states, events } = await mount(
      program(true, '@ToAssistant("Kept Carlos")'),
    );
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows.
    await settle(60);
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(actions.map((event) => event.humanFriendlyMessage)).toEqual(["Kept Carlos"]);
    expect(states[states.length - 1]).toEqual({ $confirm: false });
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ type: "cancel", component: "ModalDialog", name: TITLE }),
    ]);
    rendered.unmount();
  });

  it("gives focus back to the stop that opened it once it closes", async () => {
    const { rendered } = await mount(program(false));
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Outside ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(inverseSegments(rendered.frame())).toEqual(["[ Outside ]"]);
    rendered.unmount();
  });

  it("waits for the stream to end before it takes focus, then focuses its first stop", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program(true), {
      isStreaming: true,
      onUiEvent: function onUiEvent(event) {
        events.push(event);
      },
    });
    await settle();
    expect(stripAnsi(rendered.frame())).toContain(TITLE);
    expect(inverseSegments(rendered.frame())).toEqual([]);
    expect(ofType(events, "focus")).toEqual([]);
    await rendered.update({ isStreaming: false });
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Cancel ]"]);
    expect(ofType(events, "focus")).toEqual([
      expect.objectContaining({ type: "focus", name: "Cancel" }),
    ]);
    rendered.unmount();
  });

  it("covers the page with its backdrop while streaming: a click never reaches the page", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program(true), {
      isStreaming: true,
      mouse: true,
      onUiEvent: function onUiEvent(event) {
        events.push(event);
      },
    });
    await settle();
    const outside = findCell(stripAnsi(rendered.frame()), "[ Outside ]");
    rendered.instance.stdin.write(MOUSE.click(outside.x + 2, outside.y));
    await settle();
    const onPage = events.filter(function isOnPage(event) {
      return event.name === "Outside";
    });
    expect(onPage).toEqual([]);
    // The backdrop takes the click, but a cancel is inert while streaming.
    expect(ofType(events, "cancel")).toEqual([]);
    expect(stripAnsi(rendered.frame())).toContain(TITLE);
    rendered.unmount();
  });

  it("does not cancel on Escape while streaming; once the stream ends Escape cancels once", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program(true), {
      isStreaming: true,
      onUiEvent: function onUiEvent(event) {
        events.push(event);
      },
    });
    await settle();
    rendered.instance.stdin.write(ESCAPE);
    // Ink holds a lone Escape for 20ms in case a sequence follows.
    await settle(60);
    expect(ofType(events, "cancel")).toEqual([]);
    expect(stripAnsi(rendered.frame())).toContain(TITLE);
    await rendered.update({ isStreaming: false });
    await settle();
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    expect(ofType(events, "cancel")).toHaveLength(1);
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    rendered.unmount();
  });

  it("cancels once for two backdrop clicks in one input chunk", async () => {
    const { rendered, actions, events } = await mount(
      program(true, '@ToAssistant("Kept Carlos")'),
      true,
    );
    const corner = findCell(stripAnsi(rendered.frame()), "base row 10");
    rendered.instance.stdin.write(
      MOUSE.click(corner.x, corner.y) + MOUSE.click(corner.x + 1, corner.y),
    );
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(actions.map((event) => event.humanFriendlyMessage)).toEqual(["Kept Carlos"]);
    expect(ofType(events, "cancel")).toHaveLength(1);
    rendered.unmount();
  });

  it("names a cancel action after its title when it has no cancel button", async () => {
    const { rendered, actions } = await mount(
      [
        "$confirm = true",
        `root = Stack([dialog, ${fillerRows(ROWS)}], "column", "none")`,
        'dialog = ModalDialog("info", "Saved", "Your changes are safe.", null, "OK", $confirm, null, {type: "dismissed"})',
      ].join("\n"),
    );
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    expect(actions.map((event) => [event.type, event.humanFriendlyMessage])).toEqual([
      ["dismissed", "Saved"],
    ]);
    rendered.unmount();
  });

  it("cancels on a click on the backdrop, not on a click inside the dialog", async () => {
    const { rendered, actions, states, events } = await mount(program(true), true);
    const opened = stripAnsi(rendered.frame());
    const body = findCell(opened, "no longer appear");
    rendered.instance.stdin.write(MOUSE.click(body.x + 1, body.y));
    await settle();
    expect(stripAnsi(rendered.frame())).toContain(TITLE);
    expect(ofType(events, "cancel")).toEqual([]);
    const corner = findCell(opened, "base row 10");
    rendered.instance.stdin.write(MOUSE.click(corner.x, corner.y));
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain(TITLE);
    expect(states[states.length - 1]).toEqual({ $confirm: false });
    expect(ofType(events, "cancel")).toHaveLength(1);
    expect(actions).toEqual([]);
    rendered.unmount();
  });

  it("shows an info dialog without the open binding and with its own actions", async () => {
    const actions: ActionEvent[] = [];
    const rendered = await renderProgram(
      inkLibrary,
      `root = Stack([ModalDialog("info", "Saved", "Your changes are safe.", null, "OK", null, @ToAssistant("Acknowledged")), ${fillerRows(ROWS)}], "column", "none")`,
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

  it("stays shown without the open binding: Escape only emits cancel", async () => {
    const events: UiEvent[] = [];
    const rendered = await renderProgram(
      inkLibrary,
      `root = Stack([ModalDialog("info", "Saved", "Your changes are safe.", null, "OK"), ${fillerRows(ROWS)}], "column", "none")`,
      {
        onUiEvent: function onUiEvent(event) {
          events.push(event);
        },
      },
    );
    rendered.instance.stdin.write(ESCAPE);
    await settle(60);
    expect(stripAnsi(rendered.frame())).toContain("Your changes are safe.");
    expect(ofType(events, "cancel")).toEqual([
      expect.objectContaining({ type: "cancel", component: "ModalDialog", name: "Saved" }),
    ]);
    expect(ofType(events, "close")).toEqual([]);
    rendered.unmount();
  });
});
