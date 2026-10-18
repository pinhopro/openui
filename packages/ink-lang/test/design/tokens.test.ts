import { describe, expect, it } from "vitest";
import { colorScale, darken, lighten } from "../../src/design/color-scale";
import { detectColorScheme } from "../../src/design/color-scheme";
import { tokensToCssVariables } from "../../src/design/css-variables";
import { defaultTokens, resolveTokens } from "../../src/design/tokens";

describe("defaultTokens", () => {
  it("names the primitive scales, the semantic groups, spacing, grid, typography and shape", () => {
    expect(Object.keys(defaultTokens.color.primitive)).toEqual([
      "primary",
      "neutral",
      "error",
      "success",
      "warning",
      "info",
      "canvas",
    ]);
    expect(defaultTokens.color.primitive.primary[500]).toBe("cyan");
    expect(Object.keys(defaultTokens.color.semantic)).toEqual([
      "canvas",
      "border",
      "text",
      "textBackground",
      "button",
      "icon",
    ]);
    expect(defaultTokens.color.semantic.text.placeholder).toBe("dim");
    expect(defaultTokens.spacing).toEqual({ xs: 0, sm: 1, md: 1, lg: 2, xl: 3 });
    expect(defaultTokens.grid).toEqual({ columns: 1, margin: 0, gutter: 1, containerMaxWidth: 0 });
    expect(defaultTokens.typography.h1.weight).toBe("bold");
    expect(defaultTokens.shape).toEqual({ fieldBorder: "none", cardBorder: "round" });
    expect(defaultTokens.mode).toBe("dark");
  });
});

describe("resolveTokens", () => {
  it("returns the defaults for an empty input", () => {
    expect(resolveTokens({}).tokens).toEqual(defaultTokens);
    expect(resolveTokens({}).errors).toEqual([]);
  });

  it("accepts nested objects, dotted paths and CSS variable names", () => {
    const resolved = resolveTokens({
      color: { semantic: { text: { value: "white" } } },
      "spacing.md": 2,
      "--color-border-focus": "#38bdf8",
    });
    expect(resolved.errors).toEqual([]);
    expect(resolved.tokens.color.semantic.text.value).toBe("white");
    expect(resolved.tokens.spacing.md).toBe(2);
    expect(resolved.tokens.color.semantic.border.focus).toBe("#38bdf8");
  });

  it("builds a scale from a single primitive color and keeps named colors flat", () => {
    const resolved = resolveTokens({
      "color.primitive.primary": "#2563eb",
      "--color-primitive-error": "red",
    });
    const primary = resolved.tokens.color.primitive.primary;
    expect(primary[500]).toBe("#2563eb");
    expect(primary[100]).not.toBe(primary[500]);
    expect(primary[900]).not.toBe(primary[500]);
    expect(resolved.tokens.color.primitive.error[100]).toBe("red");
  });

  it("applies the light or dark variant of the semantic colors", () => {
    const input = {
      mode: "light",
      light: { "color.semantic.canvas.app": "white", "color.semantic.text.value": "black" },
      dark: { "color.semantic.canvas.app": "black", "color.semantic.text.value": "white" },
    };
    const light = resolveTokens(input);
    expect(light.tokens.mode).toBe("light");
    expect(light.tokens.color.semantic.canvas.app).toBe("white");
    const dark = resolveTokens({ ...input, mode: "dark" });
    expect(dark.tokens.color.semantic.text.value).toBe("white");
    const system = resolveTokens({ ...input, mode: "system" }, { COLORFGBG: "0;15" });
    expect(system.tokens.mode).toBe("light");
  });

  it("reports unknown tokens and wrong value types instead of throwing", () => {
    const resolved = resolveTokens({
      "color.text.nope": "red",
      "spacing.md": "wide",
      shape: { fieldBorder: "dotted" },
    });
    expect(resolved.errors).toHaveLength(3);
    expect(resolved.errors[0]).toContain("color.text.nope");
    expect(resolved.tokens.spacing.md).toBe(defaultTokens.spacing.md);
  });

  it("lets the semantic shortcuts skip the semantic segment", () => {
    const resolved = resolveTokens({
      "color.text.value": "white",
      "--color-canvas-surface": "#111",
    });
    expect(resolved.errors).toEqual([]);
    expect(resolved.tokens.color.semantic.text.value).toBe("white");
    expect(resolved.tokens.color.semantic.canvas.surface).toBe("#111");
  });
});

describe("tokensToCssVariables", () => {
  it("flattens every token into a CSS custom property", () => {
    const variables = tokensToCssVariables(defaultTokens);
    expect(variables["--color-primary-500"]).toBe("cyan");
    expect(variables["--color-text-placeholder"]).toBe("dim");
    expect(variables["--color-button-background-focus"]).toBe("");
    expect(variables["--spacing-md"]).toBe("1");
    expect(variables["--grid-columns"]).toBe("1");
    expect(variables["--typography-h1-weight"]).toBe("bold");
    expect(variables["--shape-card-border"]).toBe("round");
  });
});

describe("color scale", () => {
  it("lightens and darkens hex colors and leaves named colors alone", () => {
    expect(lighten("#000000", 0.5)).toBe("#808080");
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(lighten("cyan", 0.5)).toBe("cyan");
    const scale = colorScale("#2563eb");
    expect(scale[500]).toBe("#2563eb");
    expect(scale[100]).toMatch(/^#[0-9a-f]{6}$/);
    expect(colorScale("blue")).toEqual({
      100: "blue",
      300: "blue",
      500: "blue",
      700: "blue",
      900: "blue",
    });
  });
});

describe("detectColorScheme", () => {
  it("reads the terminal background from COLORFGBG and defaults to dark", () => {
    expect(detectColorScheme({ COLORFGBG: "15;0" })).toBe("dark");
    expect(detectColorScheme({ COLORFGBG: "0;15" })).toBe("light");
    expect(detectColorScheme({ COLORFGBG: "0;default" })).toBe("dark");
    expect(detectColorScheme({})).toBe("dark");
  });
});
