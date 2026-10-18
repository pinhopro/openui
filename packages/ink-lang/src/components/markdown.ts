/** One styled run of text inside a markdown line. */
export interface MarkdownSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
}

export type MarkdownLineKind = "text" | "heading" | "bullet" | "blank";

/** One rendered line: a paragraph line, a heading, a list item or a blank separator. */
export interface MarkdownLine {
  kind: MarkdownLineKind;
  /** Nesting level of a list item (two spaces per level in the source). */
  indent: number;
  /** The list marker drawn before a bullet line. */
  marker?: string;
  /** The heading level (number of `#`) of a heading line. */
  level?: number;
  segments: MarkdownSegment[];
}

const BULLET_MARKER = "•";

function plainSegment(text: string): MarkdownSegment {
  return { text, bold: false, italic: false, code: false };
}

/** The index of `marker` in `text` after `from`, or -1 when it is missing. */
function findClosing(text: string, marker: string, from: number): number {
  return text.indexOf(marker, from);
}

/** `*text*` is emphasis only when the content is non-empty and not padded with spaces. */
function isEmphasisContent(content: string): boolean {
  if (content === "") return false;
  if (content.startsWith(" ") || content.endsWith(" ")) return false;
  return true;
}

interface InlineMatch {
  segment: MarkdownSegment;
  /** Characters of the source consumed by the match. */
  length: number;
}

function matchCode(rest: string): InlineMatch | null {
  if (!rest.startsWith("`")) return null;
  const closing = findClosing(rest, "`", 1);
  if (closing <= 1) return null;
  const content = rest.slice(1, closing);
  return {
    segment: { text: content, bold: false, italic: false, code: true },
    length: closing + 1,
  };
}

function matchEmphasis(rest: string, marker: string, bold: boolean): InlineMatch | null {
  if (!rest.startsWith(marker)) return null;
  const closing = findClosing(rest, marker, marker.length);
  if (closing === -1) return null;
  const content = rest.slice(marker.length, closing);
  if (!isEmphasisContent(content)) return null;
  return {
    segment: { text: content, bold, italic: !bold, code: false },
    length: closing + marker.length,
  };
}

const LINK_PATTERN = /^\[([^\]]+)\]\(([^)\s]+)\)/;

function matchLink(rest: string): InlineMatch | null {
  const match = LINK_PATTERN.exec(rest);
  if (match === null) return null;
  const text = match[1] ?? "";
  const url = match[2] ?? "";
  return { segment: plainSegment(`${text} (${url})`), length: match[0].length };
}

function matchInline(rest: string): InlineMatch | null {
  const code = matchCode(rest);
  if (code !== null) return code;
  const strong = matchEmphasis(rest, "**", true);
  if (strong !== null) return strong;
  const strongUnderscore = matchEmphasis(rest, "__", true);
  if (strongUnderscore !== null) return strongUnderscore;
  const emphasis = matchEmphasis(rest, "*", false);
  if (emphasis !== null) return emphasis;
  const emphasisUnderscore = matchEmphasis(rest, "_", false);
  if (emphasisUnderscore !== null) return emphasisUnderscore;
  return matchLink(rest);
}

/** Splits one line into plain, bold, italic and code segments; unbalanced markers stay literal. */
export function parseInline(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let buffer = "";
  let index = 0;
  function flush(): void {
    if (buffer === "") return;
    segments.push(plainSegment(buffer));
    buffer = "";
  }
  while (index < text.length) {
    const rest = text.slice(index);
    const match = matchInline(rest);
    if (match === null) {
      buffer += text.charAt(index);
      index += 1;
      continue;
    }
    flush();
    segments.push(match.segment);
    index += match.length;
  }
  flush();
  return segments;
}

const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const BULLET_PATTERN = /^(\s*)[-*]\s+(.*)$/;
const NUMBERED_PATTERN = /^(\s*)(\d+)\.\s+(.*)$/;

function boldAll(segments: MarkdownSegment[]): MarkdownSegment[] {
  const bolded: MarkdownSegment[] = [];
  for (const segment of segments) {
    bolded.push({ ...segment, bold: true });
  }
  return bolded;
}

function indentLevel(spaces: string): number {
  return Math.floor(spaces.length / 2);
}

function parseLine(line: string): MarkdownLine {
  const heading = HEADING_PATTERN.exec(line);
  if (heading !== null) {
    return {
      kind: "heading",
      indent: 0,
      level: (heading[1] ?? "#").length,
      segments: boldAll(parseInline(heading[2] ?? "")),
    };
  }
  const numbered = NUMBERED_PATTERN.exec(line);
  if (numbered !== null) {
    return {
      kind: "bullet",
      indent: indentLevel(numbered[1] ?? ""),
      marker: `${numbered[2]}.`,
      segments: parseInline(numbered[3] ?? ""),
    };
  }
  const bullet = BULLET_PATTERN.exec(line);
  if (bullet !== null) {
    return {
      kind: "bullet",
      indent: indentLevel(bullet[1] ?? ""),
      marker: BULLET_MARKER,
      segments: parseInline(bullet[2] ?? ""),
    };
  }
  return { kind: "text", indent: 0, segments: parseInline(line) };
}

/**
 * The markdown subset TextContent understands: paragraphs, `#` headings,
 * `-`/`*`/`1.` lists, **bold**, *italic*, `code` and [links](url).
 * Consecutive blank lines collapse into one separator.
 */
export function parseMarkdown(source: string): MarkdownLine[] {
  const lines: MarkdownLine[] = [];
  let previousBlank = false;
  for (const rawLine of source.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.trim() === "") {
      if (!previousBlank && lines.length > 0)
        lines.push({ kind: "blank", indent: 0, segments: [] });
      previousBlank = true;
      continue;
    }
    previousBlank = false;
    lines.push(parseLine(line));
  }
  while (lines.length > 0 && lines[lines.length - 1]?.kind === "blank") lines.pop();
  return lines;
}

/** True when the text uses any of the markers parseMarkdown understands. */
export function hasMarkdown(source: string): boolean {
  if (source.includes("\n")) return true;
  return /[*_`#[]/.test(source);
}
