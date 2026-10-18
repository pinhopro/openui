import { describe, expect, it } from "vitest";
import { cellText, tableLayout } from "../../src/components/table-layout";

function col(label: string, data: unknown, type?: string) {
  return { type: "element", typeName: "Col", props: { label, data, type }, partial: false };
}

describe("cellText", () => {
  it("turns primitives into text and empty values into an empty string", () => {
    expect(cellText("Ada")).toBe("Ada");
    expect(cellText(36)).toBe("36");
    expect(cellText(true)).toBe("true");
    expect(cellText(null)).toBe("");
    expect(cellText(undefined)).toBe("");
  });

  it("returns null for an element so the caller renders it as a node", () => {
    const button = { type: "element", typeName: "Button", props: { label: "Go" }, partial: false };
    expect(cellText(button)).toBeNull();
  });
});

describe("tableLayout", () => {
  it("measures each column by its widest label or cell", () => {
    const layout = tableLayout([col("Name", ["Ada", "Grace"]), col("Age", [36, 45], "number")]);
    expect(layout.rowCount).toBe(2);
    expect(layout.columns).toEqual([
      { label: "Name", align: "left", width: 5, cells: ["Ada", "Grace"] },
      { label: "Age", align: "right", width: 3, cells: [36, 45] },
    ]);
  });

  it("takes the row count from the longest column and treats a scalar as one row", () => {
    const layout = tableLayout([col("A", ["x", "y", "z"]), col("B", "only")]);
    expect(layout.rowCount).toBe(3);
    expect(layout.columns[1]?.cells).toEqual(["only"]);
  });

  it("skips values that are not Col elements", () => {
    const layout = tableLayout([null, "text", col("A", ["x"])]);
    expect(layout.columns).toHaveLength(1);
  });

  it("ignores element cells when measuring and never goes below one cell", () => {
    const button = { type: "element", typeName: "Button", props: { label: "Go" }, partial: false };
    const layout = tableLayout([col("", [button])]);
    expect(layout.columns[0]?.width).toBe(1);
  });

  it("counts graphemes, not UTF-16 code units", () => {
    const layout = tableLayout([col("E", ["👩‍💻"])]);
    expect(layout.columns[0]?.width).toBe(1);
  });
});
