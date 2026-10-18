import { describe, expect, it } from "vitest";
import { indexOfOption, selectOptions } from "../../src/components/select-options";

function item(value: unknown, label?: unknown) {
  return { type: "element", typeName: "SelectItem", props: { value, label }, partial: false };
}

describe("selectOptions", () => {
  it("reads value and label from SelectItem elements", () => {
    expect(selectOptions([item("us", "US East"), item("eu", "EU West")])).toEqual([
      { value: "us", label: "US East" },
      { value: "eu", label: "EU West" },
    ]);
  });

  it("falls back to the value when the label is missing or empty", () => {
    expect(selectOptions([item("us"), item("eu", "")])).toEqual([
      { value: "us", label: "us" },
      { value: "eu", label: "eu" },
    ]);
  });

  it("skips values that are not SelectItem elements or have no value", () => {
    expect(selectOptions([null, "text", item(""), item(3, "three"), item("ok", "Ok")])).toEqual([
      { value: "ok", label: "Ok" },
    ]);
  });

  it("is empty for a non-array", () => {
    expect(selectOptions(undefined)).toEqual([]);
  });
});

describe("indexOfOption", () => {
  it("finds the option holding the value and is -1 otherwise", () => {
    const options = selectOptions([item("us", "US"), item("eu", "EU")]);
    expect(indexOfOption(options, "eu")).toBe(1);
    expect(indexOfOption(options, "")).toBe(-1);
    expect(indexOfOption(options, undefined)).toBe(-1);
  });
});
