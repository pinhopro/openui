import { describe, expect, it } from "vitest";
import {
  normalizeSelection,
  selectionForValidation,
  storedSelection,
  toggleSelection,
} from "../src/components/selection-field";

describe("normalizeSelection", () => {
  it("prefers the stored value over the default", () => {
    expect(normalizeSelection("multiple", ["a"], ["b"])).toEqual(["a"]);
    expect(normalizeSelection("single", "a", "b")).toEqual(["a"]);
  });

  it("falls back to the default and accepts a string for a multiple group", () => {
    expect(normalizeSelection("multiple", undefined, "b")).toEqual(["b"]);
    expect(normalizeSelection("single", undefined, ["b", "c"])).toEqual(["b"]);
    expect(normalizeSelection("multiple", undefined, undefined)).toEqual([]);
  });

  it("treats an empty stored value as nothing selected", () => {
    expect(normalizeSelection("single", "", "b")).toEqual([]);
    expect(normalizeSelection("multiple", [], ["b"])).toEqual([]);
  });
});

describe("toggleSelection", () => {
  it("replaces or clears the single value", () => {
    expect(toggleSelection("single", [], "a")).toEqual(["a"]);
    expect(toggleSelection("single", ["a"], "b")).toEqual(["b"]);
    expect(toggleSelection("single", ["a"], "a")).toEqual([]);
  });

  it("adds and removes values of a multiple group", () => {
    expect(toggleSelection("multiple", ["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelection("multiple", ["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("stored and validation values", () => {
  it("stores a string for single and a list for multiple", () => {
    expect(storedSelection("single", ["a"])).toBe("a");
    expect(storedSelection("single", [])).toBeUndefined();
    expect(storedSelection("multiple", [])).toEqual([]);
  });

  it("gives validation undefined when nothing is selected", () => {
    expect(selectionForValidation("multiple", [])).toBeUndefined();
    expect(selectionForValidation("multiple", ["a"])).toEqual(["a"]);
  });
});
