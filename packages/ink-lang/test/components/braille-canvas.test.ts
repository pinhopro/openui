import { describe, expect, it } from "vitest";
import {
  createBrailleCanvas,
  fillBelow,
  plot,
  plotArea,
  plotLine,
  projectValue,
  toLines,
} from "../../src/components/braille-canvas";

/** The unlit braille pattern (U+2800), which prints as an invisible cell. */
const BLANK = String.fromCharCode(0x2800);

/** The braille glyph for a dot bitmask, so the expectations read as bits. */
function glyph(bits: number): string {
  return String.fromCharCode(0x2800 + bits);
}

describe("braille canvas", () => {
  it("starts as blank braille cells, one string per row", () => {
    const canvas = createBrailleCanvas(2, 2);
    expect(toLines(canvas)).toEqual([BLANK + BLANK, BLANK + BLANK]);
  });

  it("maps the eight dots of a cell to the braille bit layout", () => {
    const topLeft = createBrailleCanvas(1, 1);
    plot(topLeft, 0, 0);
    expect(toLines(topLeft)).toEqual(["⠁"]);
    const bottomLeft = createBrailleCanvas(1, 1);
    plot(bottomLeft, 0, 3);
    expect(toLines(bottomLeft)).toEqual(["⡀"]);
    const bottomRight = createBrailleCanvas(1, 1);
    plot(bottomRight, 1, 3);
    expect(toLines(bottomRight)).toEqual(["⢀"]);
    const full = createBrailleCanvas(1, 1);
    for (let x = 0; x < 2; x += 1) {
      for (let y = 0; y < 4; y += 1) plot(full, x, y);
    }
    expect(toLines(full)).toEqual(["⣿"]);
  });

  it("addresses dots across cells: two dots per column, four per row", () => {
    const canvas = createBrailleCanvas(2, 2);
    plot(canvas, 2, 0);
    plot(canvas, 1, 4);
    expect(toLines(canvas)).toEqual([BLANK + "⠁", "⠈" + BLANK]);
  });

  it("ignores dots outside the canvas", () => {
    const canvas = createBrailleCanvas(1, 1);
    plot(canvas, -1, 0);
    plot(canvas, 2, 0);
    plot(canvas, 0, 4);
    plot(canvas, 0, -1);
    expect(toLines(canvas)).toEqual([BLANK]);
  });

  it("draws a diagonal line dot by dot", () => {
    const canvas = createBrailleCanvas(2, 1);
    plotLine(canvas, 0, 0, 3, 3);
    expect(toLines(canvas)).toEqual(["⠑⢄"]);
  });

  it("draws a steep line without gaps", () => {
    const canvas = createBrailleCanvas(1, 1);
    plotLine(canvas, 0, 0, 1, 3);
    // Every row between the ends carries a dot.
    const bits = [0x01, 0x02 | 0x10, 0x04 | 0x20, 0x80];
    const line = toLines(canvas)[0] ?? "";
    const code = line.charCodeAt(0) - 0x2800;
    for (const rowBits of bits) expect(code & rowBits).not.toBe(0);
  });

  it("fills a column from a dot down to the bottom", () => {
    const canvas = createBrailleCanvas(1, 1);
    fillBelow(canvas, 0, 1);
    expect(toLines(canvas)).toEqual(["⡆"]);
  });

  it("fills the area under a segment column by column", () => {
    const canvas = createBrailleCanvas(2, 1);
    plotArea(canvas, 0, 3, 3, 0);
    // Column 0 starts at row 3, column 3 at row 0; the columns between slope up.
    const left = 0x40 | (0x20 | 0x80);
    const right = 0x02 | 0x04 | 0x40 | (0x08 | 0x10 | 0x20 | 0x80);
    expect(toLines(canvas)).toEqual([glyph(left) + glyph(right)]);
  });
});

describe("projectValue", () => {
  it("maps a range onto dot indexes, both ends included", () => {
    expect(projectValue(0, 0, 10, 16)).toBe(0);
    expect(projectValue(10, 0, 10, 16)).toBe(15);
    expect(projectValue(5, 0, 10, 11)).toBe(5);
  });

  it("puts a flat range in the middle", () => {
    expect(projectValue(3, 3, 3, 7)).toBe(3);
  });

  it("clamps values outside the range", () => {
    expect(projectValue(-4, 0, 10, 16)).toBe(0);
    expect(projectValue(40, 0, 10, 16)).toBe(15);
  });
});
