import { describe, expect, it } from "vitest";
import { buttonTextStyle } from "../../src/focus/focus-style";

describe("buttonTextStyle", () => {
  it("renders an idle primary button bold and plain", () => {
    expect(buttonTextStyle(false, false, undefined, undefined)).toEqual({
      inverse: false,
      bold: true,
      dimColor: false,
      color: undefined,
    });
  });

  it("inverts the focused button", () => {
    expect(buttonTextStyle(true, false, "primary", undefined).inverse).toBe(true);
  });

  it("dims a disabled button and never inverts it", () => {
    expect(buttonTextStyle(true, true, "primary", undefined)).toMatchObject({
      inverse: false,
      dimColor: true,
    });
  });

  it("renders secondary and tertiary buttons without bold", () => {
    expect(buttonTextStyle(false, false, "secondary", undefined).bold).toBe(false);
    expect(buttonTextStyle(false, false, "tertiary", undefined).bold).toBe(false);
  });

  it("colors a destructive button red", () => {
    expect(buttonTextStyle(false, false, "primary", "destructive").color).toBe("red");
    expect(buttonTextStyle(false, false, "primary", "normal").color).toBeUndefined();
  });
});
