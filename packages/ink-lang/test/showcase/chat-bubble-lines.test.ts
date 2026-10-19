import { describe, expect, it } from "vitest";
import { bubbleLines, wrapWords } from "../../examples/showcase/chat-bubble-lines";

describe("wrapWords", () => {
  it("wraps at spaces within the width and breaks a word longer than the width", () => {
    expect(wrapWords("Hi, Carlos! I've already incorporated Legal's changes.", 20)).toEqual([
      "Hi, Carlos! I've",
      "already incorporated",
      "Legal's changes.",
    ]);
    expect(wrapWords("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
    expect(wrapWords("", 10)).toEqual([]);
  });
});

describe("bubbleLines", () => {
  it("puts the meta after the last line when it fits, right-aligned to the widest line", () => {
    const bubble = bubbleLines("Perfect, thanks!", "10:42", "✓✓", 36);
    expect(bubble.lines).toEqual(["Perfect, thanks!"]);
    expect(bubble.metaOnOwnLine).toBe(false);
    // text, two spaces, the time, a space and the ticks
    expect(bubble.width).toBe("Perfect, thanks!".length + 2 + "10:42".length + 1 + 2);
  });

  it("gives the meta its own line when the last line leaves no room", () => {
    const text = "Sure, I'll check with Legal tomorrow morning";
    const bubble = bubbleLines(text, "10:44", "✓✓", 24);
    expect(bubble.lines).toEqual(["Sure, I'll check with", "Legal tomorrow morning"]);
    expect(bubble.metaOnOwnLine).toBe(true);
    expect(bubble.width).toBe("Legal tomorrow morning".length);
  });

  it("has only the meta line for an empty text", () => {
    const bubble = bubbleLines("", "10:33", "", 30);
    expect(bubble.lines).toEqual([]);
    expect(bubble.metaOnOwnLine).toBe(true);
    expect(bubble.width).toBe("10:33".length);
  });
});
