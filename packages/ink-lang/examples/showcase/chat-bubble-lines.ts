import { countGraphemes } from "../../src/components/text-editing";

/** The text of a bubble laid out in lines, with the time and ticks placed. */
export interface BubbleLines {
  lines: string[];
  /** True when the time and ticks sit under the text instead of after its last line. */
  metaOnOwnLine: boolean;
  /** The cells the widest line (meta included) takes. */
  width: number;
}

/** Breaks `text` into lines of at most `width` cells at spaces, splitting words wider than that. */
export function wrapWords(text: string, width: number): string[] {
  const lines: string[] = [];
  if (text === "") return lines;
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const pieces = splitLongWord(word, width);
      for (const piece of pieces) {
        if (line === "") {
          line = piece;
          continue;
        }
        if (countGraphemes(line) + 1 + countGraphemes(piece) <= width) {
          line = line + " " + piece;
          continue;
        }
        lines.push(line);
        line = piece;
      }
    }
    lines.push(line);
  }
  return lines;
}

function splitLongWord(word: string, width: number): string[] {
  const characters = Array.from(word);
  if (characters.length <= width) return [word];
  const pieces: string[] = [];
  for (let start = 0; start < characters.length; start += width) {
    pieces.push(characters.slice(start, start + width).join(""));
  }
  return pieces;
}

/** The cells `time` and `ticks` take at the end of a line, with the gap before them. */
export function metaWidth(time: string, ticks: string): number {
  return countGraphemes(time) + (ticks === "" ? 0 : 1 + countGraphemes(ticks));
}

/**
 * Lays a message out for a bubble `maxWidth` cells wide: the text wrapped,
 * and the time and ticks after the last line when two spaces and the meta
 * still fit, else on a line of their own.
 */
export function bubbleLines(
  text: string,
  time: string,
  ticks: string,
  maxWidth: number,
): BubbleLines {
  const lines = wrapWords(text, maxWidth);
  const meta = metaWidth(time, ticks);
  let widest = 0;
  for (const line of lines) {
    const cells = countGraphemes(line);
    if (cells > widest) widest = cells;
  }
  const last = lines.length === 0 ? "" : (lines[lines.length - 1] as string);
  const lastWithMeta = countGraphemes(last) + 2 + meta;
  const metaOnOwnLine = lines.length === 0 || lastWithMeta > maxWidth;
  const width = metaOnOwnLine ? Math.max(widest, meta) : Math.max(widest, lastWithMeta);
  return { lines, metaOnOwnLine, width };
}
