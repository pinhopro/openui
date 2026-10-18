import { describe, expect, it } from "vitest";
import {
  buildSeriesRows,
  buildSlices,
  seriesNames,
  type SeriesRow,
} from "../../src/components/chart-data";

function series(category: string, values: number[]) {
  return { type: "element", typeName: "Series", props: { category, values }, partial: false };
}

describe("buildSeriesRows", () => {
  it("joins labels with Series elements into one row per label", () => {
    const rows = buildSeriesRows(["Mon", "Tue"], [series("Views", [10, 20]), series("Users", [1])]);
    expect(rows).toEqual([
      { category: "Mon", values: { Views: 10, Users: 1 } },
      { category: "Tue", values: { Views: 20 } },
    ]);
  });

  it("reads tabular rows where the first column is the category", () => {
    const rows = buildSeriesRows(
      ["day", "views", "users"],
      [
        ["Mon", 100, 50],
        ["Tue", "200", null],
      ],
    );
    expect(rows).toEqual([
      { category: "Mon", values: { views: 100, users: 50 } },
      { category: "Tue", values: { views: 200, users: 0 } },
    ]);
  });

  it("returns no rows for missing data", () => {
    expect(buildSeriesRows(undefined, undefined)).toEqual([]);
    expect(buildSeriesRows([], [series("v", [1])])).toEqual([]);
  });
});

describe("seriesNames", () => {
  it("lists every series name once, in first-seen order", () => {
    const rows: SeriesRow[] = [
      { category: "a", values: { x: 1, y: 2 } },
      { category: "b", values: { y: 3, z: 4 } },
    ];
    expect(seriesNames(rows)).toEqual(["x", "y", "z"]);
  });
});

describe("buildSlices", () => {
  it("pairs labels with values and drops non-numbers", () => {
    expect(buildSlices(["A", "B", "C"], [1, "x", 3])).toEqual([
      { category: "A", value: 1 },
      { category: "B", value: 0 },
      { category: "C", value: 3 },
    ]);
  });

  it("accepts legacy Slice elements in the labels slot", () => {
    const slice = {
      type: "element",
      typeName: "Slice",
      props: { category: "A", value: 2 },
      partial: false,
    };
    expect(buildSlices([slice], undefined)).toEqual([{ category: "A", value: 2 }]);
  });

  it("returns nothing for missing data", () => {
    expect(buildSlices(undefined, undefined)).toEqual([]);
  });
});
