import { describe, expect, it } from "vitest";
import { qrBlockLines, qrMatrix } from "../src/components/qr-matrix";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

describe("qrMatrix", () => {
  it("encodes text into a square module matrix with a quiet zone", () => {
    const matrix = qrMatrix("hello", 2);
    expect(matrix.length).toBe(21 + 4);
    expect(matrix[0]?.length).toBe(matrix.length);
    expect(matrix[0]?.every((dark) => dark === false)).toBe(true);
    // The finder pattern starts right after the quiet zone.
    expect(matrix[2]?.[2]).toBe(true);
  });

  it("draws two module rows per text line with half blocks, or one with full blocks", () => {
    const matrix = qrMatrix("hello", 0);
    const compact = qrBlockLines(matrix, "compact");
    expect(compact.length).toBe(Math.ceil(matrix.length / 2));
    expect(compact[0]).toMatch(/^[█▀▄ ]+$/);
    const large = qrBlockLines(matrix, "large");
    expect(large.length).toBe(matrix.length);
    expect(large[0]?.length).toBe(matrix.length * 2);
    expect(large[0]).toMatch(/^(██|  )+$/);
  });
});

describe("QrCode", () => {
  it("renders the code in blocks with a quiet zone and nothing for empty data", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([QrCode("https://www.openui.com"), TextContent("after")])',
    );
    const plain = stripAnsi(rendered.frame());
    expect(plain).toMatch(/[█▀▄]/);
    expect(plain.split("\n").length).toBeGreaterThan(12);
    expect(plain).toContain("after");
    rendered.unmount();
    const empty = await renderProgram(
      inkLibrary,
      'root = Stack([QrCode(""), TextContent("after")])',
    );
    expect(stripAnsi(empty.frame()).trim()).toBe("after");
    empty.unmount();
  });
});
