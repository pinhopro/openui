import { describe, expect, it } from "vitest";
import { boxProps, mergeBoxStyle, mergeTextStyle, textProps } from "../src/theme-styles";

describe("mergeBoxStyle and mergeTextStyle", () => {
  it("overrides the fields the override names and keeps the rest", () => {
    expect(mergeBoxStyle({ border: "single", paddingX: 1 }, { border: "round" })).toEqual({
      border: "round",
      paddingX: 1,
    });
    expect(mergeBoxStyle({ border: "single" }, undefined)).toEqual({ border: "single" });
    expect(mergeTextStyle({ bold: true, color: "red" }, { color: "blue", dim: true })).toEqual({
      bold: true,
      color: "blue",
      dim: true,
    });
  });
});

describe("boxProps", () => {
  it("maps a box style to Ink Box props, with no border for none", () => {
    expect(boxProps({ border: "none", background: "blue" })).toEqual({
      borderStyle: undefined,
      borderColor: undefined,
      borderDimColor: undefined,
      backgroundColor: "blue",
      paddingX: undefined,
      paddingY: undefined,
    });
    expect(
      boxProps({ border: "round", borderColor: "red", borderDim: true, paddingX: 1, paddingY: 0 }),
    ).toEqual({
      borderStyle: "round",
      borderColor: "red",
      borderDimColor: true,
      backgroundColor: undefined,
      paddingX: 1,
      paddingY: 0,
    });
  });
});

describe("textProps", () => {
  it("maps a text style to Ink Text props", () => {
    expect(textProps({ color: "red", dim: true, underline: true })).toEqual({
      color: "red",
      backgroundColor: undefined,
      bold: undefined,
      dimColor: true,
      italic: undefined,
      underline: true,
      inverse: undefined,
      strikethrough: undefined,
    });
  });
});
