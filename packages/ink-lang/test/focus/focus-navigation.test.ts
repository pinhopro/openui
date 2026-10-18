import { describe, expect, it } from "vitest";
import { nextInDirection, type NavigationCandidate } from "../../src/focus/focus-navigation";
import type { CellRect } from "../../src/mouse/hit-test";

function rect(x: number, y: number, width = 6, height = 1): CellRect {
  return { x, y, width, height };
}

function candidate(id: string, x: number, y: number, width = 6, height = 1): NavigationCandidate {
  return { id, rect: rect(x, y, width, height) };
}

describe("nextInDirection", () => {
  const one = candidate("one", 0, 0);
  const two = candidate("two", 8, 0);
  const three = candidate("three", 0, 2);
  const four = candidate("four", 20, 2);
  const all = [one, two, three, four];

  it("moves right and left along a row", () => {
    expect(nextInDirection(one.rect, all, "right")).toBe("two");
    expect(nextInDirection(two.rect, all, "left")).toBe("one");
    expect(nextInDirection(two.rect, all, "right")).toBeNull();
  });

  it("moves down and up to the candidate that overlaps the column, else the nearest", () => {
    expect(nextInDirection(one.rect, all, "down")).toBe("three");
    expect(nextInDirection(three.rect, all, "up")).toBe("one");
    expect(nextInDirection(two.rect, all, "down")).toBe("three");
    expect(nextInDirection(four.rect, all, "up")).toBe("two");
    expect(nextInDirection(one.rect, all, "up")).toBeNull();
  });

  it("prefers the nearest candidate in the direction over a farther overlapping one", () => {
    const near = candidate("near", 30, 1);
    const farOverlap = candidate("far", 0, 5);
    expect(nextInDirection(one.rect, [near, farOverlap], "down")).toBe("near");
  });

  it("starts from the first or last candidate in reading order when nothing is focused", () => {
    expect(nextInDirection(null, all, "down")).toBe("one");
    expect(nextInDirection(null, all, "right")).toBe("one");
    expect(nextInDirection(null, all, "up")).toBe("four");
    expect(nextInDirection(null, all, "left")).toBe("four");
    expect(nextInDirection(null, [], "down")).toBeNull();
  });

  it("ignores candidates without a size", () => {
    const hidden = candidate("hidden", 0, 1, 0, 0);
    expect(nextInDirection(one.rect, [hidden, three], "down")).toBe("three");
  });
});
