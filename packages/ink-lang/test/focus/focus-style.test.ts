import { describe, expect, it } from "vitest";
import { buttonTextStyle, pagerTextStyle } from "../../src/focus/focus-style";
import { defaultTheme } from "../../src/theme";

const buttons = defaultTheme.button;

describe("buttonTextStyle", () => {
  it("renders an idle primary button bold and plain", () => {
    expect(buttonTextStyle(false, false, undefined, undefined, buttons)).toEqual({ bold: true });
  });

  it("inverts the focused button", () => {
    expect(buttonTextStyle(true, false, "primary", undefined, buttons).inverse).toBe(true);
  });

  it("dims a disabled button and never inverts it", () => {
    const style = buttonTextStyle(true, true, "primary", undefined, buttons);
    expect(style.dim).toBe(true);
    expect(style.inverse).toBeUndefined();
  });

  it("renders secondary and tertiary buttons without bold", () => {
    expect(buttonTextStyle(false, false, "secondary", undefined, buttons).bold).toBeUndefined();
    expect(buttonTextStyle(false, false, "tertiary", undefined, buttons).bold).toBeUndefined();
  });

  it("colors a destructive button with the theme's danger color", () => {
    expect(buttonTextStyle(false, false, "primary", "destructive", buttons).color).toBe("red");
    expect(buttonTextStyle(false, false, "primary", "normal", buttons).color).toBeUndefined();
  });

  it("takes every style from the theme's button slots", () => {
    const themed = {
      ...buttons,
      primary: { color: "magenta" },
      focused: { underline: true, inverse: false },
    };
    expect(buttonTextStyle(true, false, "primary", undefined, themed)).toEqual({
      color: "magenta",
      underline: true,
      inverse: false,
    });
  });
});

describe("pagerTextStyle", () => {
  it("renders an idle enabled control plain", () => {
    expect(pagerTextStyle(false, false, buttons)).toEqual({});
  });

  it("inverts the focused control", () => {
    expect(pagerTextStyle(true, false, buttons).inverse).toBe(true);
  });

  it("dims a disabled control but keeps the focus ring so Tab stays visible", () => {
    expect(pagerTextStyle(true, true, buttons)).toEqual({ dim: true, inverse: true });
    expect(pagerTextStyle(false, true, buttons)).toEqual({ dim: true });
  });
});
