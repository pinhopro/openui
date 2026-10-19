import { countGraphemes, toGraphemes } from "./text-editing";

/** The words of one line of text: the runs between spaces and tabs. */
function wordsOf(paragraph: string): string[] {
  const words: string[] = [];
  for (const part of paragraph.split(/[ \t]+/)) {
    if (part !== "") words.push(part);
  }
  return words;
}

/** Cuts a word into pieces of at most `width` user-perceived characters. */
function cutWord(word: string, width: number): string[] {
  const pieces: string[] = [];
  let piece: string[] = [];
  for (const grapheme of toGraphemes(word)) {
    piece.push(grapheme);
    if (piece.length === width) {
      pieces.push(piece.join(""));
      piece = [];
    }
  }
  if (piece.length > 0) pieces.push(piece.join(""));
  return pieces;
}

/** The word itself, or its pieces when it is longer than `width`. */
function piecesOf(word: string, width: number): string[] {
  if (countGraphemes(word) > width) return cutWord(word, width);
  return [word];
}

/** Wraps one paragraph (no line break inside) greedily; at least one line. */
function wrapParagraph(paragraph: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  let lineWidth = 0;
  for (const word of wordsOf(paragraph)) {
    for (const piece of piecesOf(word, width)) {
      const pieceWidth = countGraphemes(piece);
      if (line === "") {
        line = piece;
        lineWidth = pieceWidth;
      } else if (lineWidth + 1 + pieceWidth <= width) {
        line = line + " " + piece;
        lineWidth = lineWidth + 1 + pieceWidth;
      } else {
        lines.push(line);
        line = piece;
        lineWidth = pieceWidth;
      }
    }
  }
  lines.push(line);
  return lines;
}

/**
 * `text` as lines of at most `width` user-perceived characters (at least
 * one), broken greedily between words: no line starts or ends with a space,
 * runs of spaces collapse to one, a word longer than the width is cut into
 * pieces, and each line break in the text starts a new line (an empty line
 * stays). Ink's own `wrap="wrap"` keeps the space it breaks at (`trim:
 * false`), so the dialogs draw their body as these lines instead.
 */
export function wrapWords(text: string, width: number): string[] {
  const limit = Math.max(1, width);
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    for (const line of wrapParagraph(paragraph, limit)) lines.push(line);
  }
  return lines;
}
