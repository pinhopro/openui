import { describe, expect, it } from "vitest";
import { parseMarkdown, type MarkdownSegment } from "../../src/components/markdown";

function plain(text: string): MarkdownSegment {
  return { text, bold: false, italic: false, code: false };
}

describe("parseMarkdown", () => {
  it("splits paragraphs into lines of plain segments", () => {
    expect(parseMarkdown("Hello\nWorld")).toEqual([
      { kind: "text", indent: 0, segments: [plain("Hello")] },
      { kind: "text", indent: 0, segments: [plain("World")] },
    ]);
  });

  it("parses bold, italic and inline code", () => {
    const [line] = parseMarkdown("a **bold** and *it* and `code`");
    expect(line?.segments).toEqual([
      plain("a "),
      { text: "bold", bold: true, italic: false, code: false },
      plain(" and "),
      { text: "it", bold: false, italic: true, code: false },
      plain(" and "),
      { text: "code", bold: false, italic: false, code: true },
    ]);
  });

  it("treats underscores like asterisks for emphasis", () => {
    const [line] = parseMarkdown("__strong__ and _soft_");
    expect(line?.segments).toEqual([
      { text: "strong", bold: true, italic: false, code: false },
      plain(" and "),
      { text: "soft", bold: false, italic: true, code: false },
    ]);
  });

  it("renders headings as bold lines", () => {
    expect(parseMarkdown("# Title\n## Sub")).toEqual([
      {
        kind: "heading",
        level: 1,
        indent: 0,
        segments: [{ text: "Title", bold: true, italic: false, code: false }],
      },
      {
        kind: "heading",
        level: 2,
        indent: 0,
        segments: [{ text: "Sub", bold: true, italic: false, code: false }],
      },
    ]);
  });

  it("renders bullet and numbered lists with markers", () => {
    expect(parseMarkdown("- one\n* two\n1. three")).toEqual([
      { kind: "bullet", indent: 0, marker: "•", segments: [plain("one")] },
      { kind: "bullet", indent: 0, marker: "•", segments: [plain("two")] },
      { kind: "bullet", indent: 0, marker: "1.", segments: [plain("three")] },
    ]);
  });

  it("keeps nested list indentation", () => {
    const lines = parseMarkdown("- a\n  - b");
    expect(lines[1]).toEqual({ kind: "bullet", indent: 1, marker: "•", segments: [plain("b")] });
  });

  it("writes links as text followed by the url", () => {
    const [line] = parseMarkdown("see [docs](https://x.test) now");
    expect(line?.segments).toEqual([plain("see "), plain("docs (https://x.test)"), plain(" now")]);
  });

  it("leaves unbalanced markers as literal text", () => {
    const [line] = parseMarkdown("2 * 3 and `open");
    expect(line?.segments).toEqual([plain("2 * 3 and `open")]);
  });

  it("drops blank lines between paragraphs into a single empty line", () => {
    expect(parseMarkdown("a\n\n\nb")).toEqual([
      { kind: "text", indent: 0, segments: [plain("a")] },
      { kind: "blank", indent: 0, segments: [] },
      { kind: "text", indent: 0, segments: [plain("b")] },
    ]);
  });
});
