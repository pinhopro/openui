import { describe, expect, it } from "vitest";
import { filterOptions, listWindow } from "../../src/components/combobox-options";
import type { SelectOption } from "../../src/components/select-options";

const options: SelectOption[] = [
  { value: "us-east-1", label: "US East" },
  { value: "eu-west-1", label: "EU West" },
  { value: "ap-south-1", label: "Asia Pacific" },
];

describe("filterOptions", () => {
  it("keeps every option for an empty query", () => {
    expect(filterOptions(options, "")).toEqual(options);
  });

  it("matches the label case-insensitively anywhere in the text", () => {
    expect(filterOptions(options, "west")).toEqual([{ value: "eu-west-1", label: "EU West" }]);
    expect(filterOptions(options, "PAC")).toEqual([{ value: "ap-south-1", label: "Asia Pacific" }]);
  });

  it("matches the value too", () => {
    expect(filterOptions(options, "south")).toEqual([
      { value: "ap-south-1", label: "Asia Pacific" },
    ]);
  });

  it("ignores surrounding whitespace in the query", () => {
    expect(filterOptions(options, "  eu ")).toEqual([{ value: "eu-west-1", label: "EU West" }]);
  });

  it("returns nothing when no option matches", () => {
    expect(filterOptions(options, "zzz")).toEqual([]);
  });
});

describe("listWindow", () => {
  it("shows everything when the list fits", () => {
    expect(listWindow(3, 0, 5)).toEqual({ start: 0, end: 3, hiddenAfter: 0 });
  });

  it("starts at the top while the cursor is inside the first page", () => {
    expect(listWindow(12, 4, 5)).toEqual({ start: 0, end: 5, hiddenAfter: 7 });
  });

  it("scrolls so the cursor stays on the last visible row", () => {
    expect(listWindow(12, 7, 5)).toEqual({ start: 3, end: 8, hiddenAfter: 4 });
    expect(listWindow(12, 11, 5)).toEqual({ start: 7, end: 12, hiddenAfter: 0 });
  });

  it("is empty for an empty list", () => {
    expect(listWindow(0, 0, 5)).toEqual({ start: 0, end: 0, hiddenAfter: 0 });
  });
});
