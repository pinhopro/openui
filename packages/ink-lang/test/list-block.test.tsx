import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { DIM_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

describe("ListBlock", () => {
  it("numbers the items and dims the subtitles", async () => {
    const program =
      'root = Stack([ListBlock([ListItem("Plan", "Write the spec"), ListItem("Build")])])';
    const rendered = await renderProgram(inkLibrary, program);
    const frame = rendered.frame();
    const plain = stripAnsi(frame).split("\n");
    expect(plain[0]).toBe("1. Plan");
    expect(plain[1]).toBe("   Write the spec");
    expect(plain[2]).toBe("2. Build");
    expect(frame.split("\n")[1]).toContain(DIM_ON);
    rendered.unmount();
  });

  it("uses an image placeholder for the image variant", async () => {
    const program =
      'root = Stack([ListBlock([ListItem("Plan", null, {src: "https://example.test/p.png", alt: "Plan icon"})], "image")])';
    const rendered = await renderProgram(inkLibrary, program);
    expect(stripAnsi(rendered.frame())).toBe("▣ Plan");
    rendered.unmount();
  });

  it("makes items with an action focusable and fires the action on Enter", async () => {
    const events: ActionEvent[] = [];
    const program = [
      "root = Stack([ListBlock([first, second])])",
      'first = ListItem("Plan", null, null, "Open", @ToAssistant("Open plan"))',
      'second = ListItem("Build")',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program, {
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    expect(stripAnsi(rendered.frame())).toContain("1. Plan  (Open)");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["Plan"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]?.humanFriendlyMessage).toBe("Open plan");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["Plan"]);
    rendered.unmount();
  });
});
