import { describe, expect, it } from "vitest";
import { pageBounds, pageSummary } from "../../src/components/table-paging";

describe("pageBounds", () => {
  it("covers every row of a table that fits in one page", () => {
    expect(pageBounds(7, 10, 0)).toEqual({ page: 0, pageCount: 1, start: 0, end: 7 });
  });

  it("splits a long table into full pages and a remainder", () => {
    expect(pageBounds(42, 10, 0)).toEqual({ page: 0, pageCount: 5, start: 0, end: 10 });
    expect(pageBounds(42, 10, 1)).toEqual({ page: 1, pageCount: 5, start: 10, end: 20 });
    expect(pageBounds(42, 10, 4)).toEqual({ page: 4, pageCount: 5, start: 40, end: 42 });
  });

  it("clamps a page past either end", () => {
    expect(pageBounds(42, 10, 9)).toEqual({ page: 4, pageCount: 5, start: 40, end: 42 });
    expect(pageBounds(42, 10, -1)).toEqual({ page: 0, pageCount: 5, start: 0, end: 10 });
  });

  it("gives one empty page for an empty table", () => {
    expect(pageBounds(0, 10, 3)).toEqual({ page: 0, pageCount: 1, start: 0, end: 0 });
  });
});

describe("pageSummary", () => {
  it("counts rows from one", () => {
    expect(pageSummary({ page: 0, pageCount: 5, start: 0, end: 10 }, 42)).toBe("rows 1-10 of 42");
    expect(pageSummary({ page: 4, pageCount: 5, start: 40, end: 42 }, 42)).toBe("rows 41-42 of 42");
  });
});
