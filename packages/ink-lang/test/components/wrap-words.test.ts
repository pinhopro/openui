import { describe, expect, it } from "vitest";
import { wrapWords } from "../../src/components/wrap-words";

describe("wrapWords", () => {
  it("keeps a text that fits on one line", () => {
    expect(wrapWords("Keep editing.", 20)).toEqual(["Keep editing."]);
  });

  it("breaks greedily between words, with no space at either end of a line", () => {
    expect(wrapWords("one two three four", 9)).toEqual(["one two", "three", "four"]);
    for (const line of wrapWords("You can add him again anytime.", 11)) {
      expect(line).toBe(line.trim());
    }
  });

  it("fills a line exactly to the width", () => {
    expect(wrapWords("abc def ghi", 7)).toEqual(["abc def", "ghi"]);
  });

  it("collapses runs of spaces and trims the text", () => {
    expect(wrapWords("  a   b  ", 10)).toEqual(["a b"]);
  });

  it("cuts a word longer than the width", () => {
    expect(wrapWords("go abcdefghij end", 4)).toEqual(["go", "abcd", "efgh", "ij", "end"]);
  });

  it("starts a new line at each line break and keeps an empty line", () => {
    expect(wrapWords("first line\n\nsecond", 20)).toEqual(["first line", "", "second"]);
  });

  it("counts user-perceived characters", () => {
    expect(wrapWords("café café", 4)).toEqual(["café", "café"]);
  });

  it("wraps a text without spaces by cell width: a CJK character takes two cells", () => {
    expect(wrapWords("日本語のテキスト", 6)).toEqual(["日本語", "のテキ", "スト"]);
  });

  it("never cuts a wide character in half: an odd width leaves its last cell empty", () => {
    expect(wrapWords("日本語", 5)).toEqual(["日本", "語"]);
  });

  it("fits words by their cell width, not their character count", () => {
    expect(wrapWords("日本 語", 5)).toEqual(["日本", "語"]);
    expect(wrapWords("😀😀 😀", 5)).toEqual(["😀😀", "😀"]);
  });

  it("keeps a wide character on a line narrower than itself", () => {
    expect(wrapWords("日本", 1)).toEqual(["日", "本"]);
  });

  it("is one empty line for an empty text, and wraps at least one character a line", () => {
    expect(wrapWords("", 10)).toEqual([""]);
    expect(wrapWords("ab", 0)).toEqual(["a", "b"]);
  });

  it("wraps the destructive dialog's body without a leading space on any line", () => {
    const body =
      "Carlos Ruiz will no longer appear in your contacts. The conversation history and shared groups will be kept. You can add him again anytime.";
    const lines = wrapWords(body, 56);
    expect(lines).toEqual([
      "Carlos Ruiz will no longer appear in your contacts. The",
      "conversation history and shared groups will be kept. You",
      "can add him again anytime.",
    ]);
  });
});
