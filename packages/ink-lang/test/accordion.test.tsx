import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([Accordion([a, b])])",
  'a = AccordionItem("a", "Details", [TextContent("Hidden details")])',
  'b = AccordionItem("b", "More", [TextContent("Even more"), Buttons([Button("Go", @ToAssistant("Go"))])])',
].join("\n");

describe("Accordion", () => {
  it("shows every header closed and no content", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame()).split("\n");
    expect(plain[0]).toBe("▸ Details");
    expect(plain[1]).toBe("▸ More");
    expect(stripAnsi(rendered.frame())).not.toContain("Hidden details");
    rendered.unmount();
  });

  it("focuses a header with Tab and toggles its section with Enter", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["▸ Details"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("▾ Details");
    expect(plain).toContain("Hidden details");
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Hidden details");
    rendered.unmount();
  });

  it("visits a header before the buttons inside its open section", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onAction: function onAction(event) {
        events.push(event);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["▸ More"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Go ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    rendered.unmount();
  });
});
