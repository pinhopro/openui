import { describe, expect, it } from "vitest";
import { textContentStyle } from "../../src/components/text-content-style";

describe("textContentStyle", () => {
  it("renders the default size plain", () => {
    expect(textContentStyle(undefined)).toEqual({ bold: false, dimColor: false, underline: false });
    expect(textContentStyle("default")).toEqual({ bold: false, dimColor: false, underline: false });
  });

  it("dims small text and bolds heavy and large text", () => {
    expect(textContentStyle("small")).toEqual({ bold: false, dimColor: true, underline: false });
    expect(textContentStyle("small-heavy")).toEqual({
      bold: true,
      dimColor: true,
      underline: false,
    });
    expect(textContentStyle("large")).toEqual({ bold: true, dimColor: false, underline: false });
    expect(textContentStyle("large-heavy")).toEqual({
      bold: true,
      dimColor: false,
      underline: true,
    });
  });
});
