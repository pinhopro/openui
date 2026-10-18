import type { ActionEvent } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { INVERSE_ON, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

async function renderBlock(program: string) {
  const events: ActionEvent[] = [];
  const rendered = await renderProgram(inkLibrary, program, {
    onAction: function onAction(event) {
      events.push(event);
    },
  });
  return { rendered, events };
}

describe("SnippetCardBlock", () => {
  const program = [
    "root = Stack([Card([block])])",
    'block = SnippetCardBlock([a, b], "grid", true, @ToAssistant("Pick"))',
    'a = SnippetCardItem("rating", IconText(Icon("star"), null, null, "Rating"), BoldText(null, "4.8"))',
    'b = SnippetCardItem("price", ImageText("https://example.test/p.png", null, "Price"), Text(null, "$12"))',
  ].join("\n");

  it("draws one bordered card per item with the label and the value", async () => {
    const { rendered } = await renderBlock(program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("<star> Rating");
    expect(plain).toContain("4.8");
    expect(plain).toContain("▣ Price");
    expect(plain).toContain("$12");
    expect(plain.split("\n").filter((line) => line.includes("┌")).length).toBe(2);
    rendered.unmount();
  });

  it("fires the block action with the pressed card's context", async () => {
    const { rendered, events } = await renderBlock(program);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events).toHaveLength(1);
    expect(events[0]?.humanFriendlyMessage).toBe("Pick");
    expect(events[0]?.params["context"]).toBe(
      'Selected item: {"itemIndex":1,"itemId":"price","itemTitle":"Price","itemValue":"$12"}',
    );
    rendered.unmount();
  });

  it("is not focusable without an action", async () => {
    const { rendered } = await renderBlock(
      'root = Stack([SnippetCardBlock([SnippetCardItem(null, IconText(Icon("a"), null, null, "A")), SnippetCardItem(null, IconText(Icon("b"), null, null, "B"))])])',
    );
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(rendered.frame()).not.toContain(INVERSE_ON);
    rendered.unmount();
  });
});

describe("OverviewCardBlock", () => {
  it("draws the heading and the metric of every card", async () => {
    const program = [
      "root = Stack([block])",
      "block = OverviewCardBlock([a, b])",
      'a = OverviewCardItem("visits", IconText(Icon("eye"), null, null, "Visits"), MetricIndicatorInline("1,204", null, {direction: "up", value: 12}))',
      'b = OverviewCardItem("signups", Text(null, "Signups"), MetricIndicatorInline("37"))',
    ].join("\n");
    const { rendered } = await renderBlock(program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("<eye> Visits");
    expect(plain).toContain("1,204  +12%");
    expect(plain).toContain("Signups");
    expect(plain).toContain("37");
    rendered.unmount();
  });
});

describe("ContextCardBlock", () => {
  it("draws a string or Tag title, the body and the image placeholder", async () => {
    const program = [
      "root = Stack([block])",
      "block = ContextCardBlock([a, b])",
      'a = ContextCardItem("summary", "Summary", "Everything **works**.")',
      'b = ContextCardItem("status", Tag("Live", null, null, "success"), null, "gray", "https://example.test/bg.png", "Backdrop")',
    ].join("\n");
    const { rendered } = await renderBlock(program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Summary");
    expect(plain).toContain("Everything works.");
    expect(plain).toContain("[Live]");
    expect(plain).toContain("▣ Backdrop");
    rendered.unmount();
  });
});

describe("CompositeCardBlock", () => {
  it("draws the header, the body and the footer price and button", async () => {
    const program = [
      "root = Stack([block])",
      "block = CompositeCardBlock([a, b])",
      'a = CompositeCardItem("basic", IconText(Icon("box"), null, null, "Basic"), [Text(null, "For individuals"), TagBlock(["email", "chat"])], {price: BoldText(null, "$9"), button: Button("Choose", @ToAssistant("Choose basic"))})',
      'b = CompositeCardItem("team", Text(null, "Team"), [MetricIndicatorInline("5 seats")])',
    ].join("\n");
    const { rendered, events } = await renderBlock(program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("<box> Basic");
    expect(plain).toContain("For individuals");
    expect(plain).toContain("[email] [chat]");
    expect(plain).toContain("$9  [ Choose ]");
    expect(plain).toContain("5 seats");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(events[0]?.humanFriendlyMessage).toBe("Choose basic");
    rendered.unmount();
  });
});

describe("VisualCardBlock", () => {
  it("draws the image placeholder, the tag and the bold body", async () => {
    const program = [
      "root = Stack([block])",
      "block = VisualCardBlock([a, b])",
      'a = VisualCardItem(BoldText(null, "Beach day"), "beach", "https://example.test/beach.png", Tag("New"), "Sunny beach")',
      'b = VisualCardItem(BoldText(null, "City night"), "city")',
    ].join("\n");
    const { rendered } = await renderBlock(program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("▣ Sunny beach");
    expect(plain).toContain("[New]");
    expect(plain).toContain("Beach day");
    expect(plain).toContain("City night");
    rendered.unmount();
  });
});
