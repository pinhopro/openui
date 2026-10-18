import { describe, expect, it } from "vitest";
import { readScatterDatasets } from "../../src/components/scatter-data";

function element(typeName: string, props: Record<string, unknown>) {
  return { type: "element", typeName, props, partial: false };
}

describe("readScatterDatasets", () => {
  it("reads ScatterSeries elements with Point elements into named point lists", () => {
    const datasets = readScatterDatasets([
      element("ScatterSeries", {
        name: "Sample",
        points: [element("Point", { x: 1, y: 2 }), element("Point", { x: "3", y: "4.5" })],
      }),
    ]);
    expect(datasets).toEqual([
      {
        name: "Sample",
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4.5 },
        ],
      },
    ]);
  });

  it("accepts plain objects and drops datasets without points", () => {
    const datasets = readScatterDatasets([
      { name: "Plain", points: [{ x: 0, y: 1 }] },
      { name: "Empty", points: [] },
      "junk",
    ]);
    expect(datasets).toEqual([{ name: "Plain", points: [{ x: 0, y: 1 }] }]);
  });

  it("returns nothing for a missing list", () => {
    expect(readScatterDatasets(undefined)).toEqual([]);
  });
});
