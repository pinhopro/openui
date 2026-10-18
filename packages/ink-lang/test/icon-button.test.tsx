import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = 'root = Stack([IconButton("Delete", Icon("trash"), @ToAssistant("Delete it"))])';

describe("IconButton", () => {
  it("renders the icon name and the accessible name as a button", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    expect(stripAnsi(rendered.frame())).toBe("[ <trash> Delete ]");
    rendered.unmount();
  });

  it("fires its action on Enter while focused", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ <trash> Delete ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]?.humanFriendlyMessage).toBe("Delete it");
    rendered.unmount();
  });

  it("sends its name as the message when it has no action", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([IconButton("Refresh", Icon("refresh-cw"))])',
      {
        onAction: function onAction(event) {
          events.push(event);
        },
      },
    );
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.SPACE);
    await settle();
    expect(events[0]?.humanFriendlyMessage).toBe("Refresh");
    rendered.unmount();
  });
});
