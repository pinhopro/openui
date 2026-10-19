import stringWidth from "string-width";
import { toGraphemes } from "./text-editing";

/** The words of one line of text: the runs between spaces and tabs. */
function wordsOf(paragraph: string): string[] {
  const words: string[] = [];
  for (const part of paragraph.split(/[ \t]+/)) {
    if (part !== "") words.push(part);
  }
  return words;
}

/** A piece of a word being cut: its graphemes so far and the cells they take. */
interface Piece {
  graphemes: string[];
  width: number;
}

/**
 * Cuts a word into pieces of at most `width` cells, between user-perceived
 * characters (a wide character is never cut in half, so a piece may end a
 * cell short of the width); a character wider than the width is a piece of
 * its own.
 */
function cutWord(word: string, width: number): string[] {
  const pieces: string[] = [];
  let piece: Piece = { graphemes: [], width: 0 };
  for (const grapheme of toGraphemes(word)) {
    const cells = stringWidth(grapheme);
    if (piece.graphemes.length > 0 && piece.width + cells > width) {
      pieces.push(piece.graphemes.join(""));
      piece = { graphemes: [], width: 0 };
    }
    piece.graphemes.push(grapheme);
    piece.width += cells;
  }
  if (piece.graphemes.length > 0) pieces.push(piece.graphemes.join(""));
  return pieces;
}

/** The word itself, or its pieces when it is wider than `width`. */
function piecesOf(word: string, width: number): string[] {
  if (stringWidth(word) > width) return cutWord(word, width);
  return [word];
}

/** Wraps one paragraph (no line break inside) greedily; at least one line. */
function wrapParagraph(paragraph: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  let lineWidth = 0;
  for (const word of wordsOf(paragraph)) {
    for (const piece of piecesOf(word, width)) {
      const pieceWidth = stringWidth(piece);
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
 * `text` as lines of at most `width` terminal cells (at least one), broken
 * greedily between words: no line starts or ends with a space, runs of
 * spaces collapse to one, a word wider than the width is cut into pieces
 * between its user-perceived characters (so a CJK or emoji text without
 * spaces wraps at cell boundaries, never through a wide character), and
 * each line break in the text starts a new line (an empty line stays).
 * Widths are cells (`string-width`), not characters: a CJK character or an
 * emoji takes two. Ink's own `wrap="wrap"` keeps the space it breaks at
 * (`trim: false`), so the dialogs draw their body as these lines instead.
 */
export function wrapWords(text: string, width: number): string[] {
  const limit = Math.max(1, width);
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    for (const line of wrapParagraph(paragraph, limit)) lines.push(line);
  }
  return lines;
}
