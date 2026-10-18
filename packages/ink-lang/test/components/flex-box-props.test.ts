import { describe, expect, it } from "vitest";
import { flexBoxProps } from "../../src/components/flex-box-props";

describe("flexBoxProps", () => {
  it("defaults to a column with a medium gap", () => {
    expect(flexBoxProps({})).toEqual({
      flexDirection: "column",
      gap: 1,
      alignItems: undefined,
      justifyContent: undefined,
      flexWrap: "nowrap",
    });
  });

  it("maps every gap token to terminal cells", () => {
    const cells: number[] = [];
    for (const gap of ["none", "xs", "s", "m", "l", "xl", "2xl"]) {
      cells.push(flexBoxProps({ gap }).gap);
    }
    expect(cells).toEqual([0, 0, 1, 1, 2, 2, 3]);
  });

  it("maps direction, align, justify and wrap to Ink flex props", () => {
    expect(
      flexBoxProps({ direction: "row", align: "center", justify: "between", wrap: true }),
    ).toEqual({
      flexDirection: "row",
      gap: 1,
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
    });
    expect(flexBoxProps({ align: "end", justify: "evenly" })).toMatchObject({
      alignItems: "flex-end",
      justifyContent: "space-evenly",
    });
  });

  it("ignores values outside the schema", () => {
    expect(flexBoxProps({ direction: "diagonal", gap: "huge", align: "x", justify: "y" })).toEqual({
      flexDirection: "column",
      gap: 1,
      alignItems: undefined,
      justifyContent: undefined,
      flexWrap: "nowrap",
    });
  });
});
