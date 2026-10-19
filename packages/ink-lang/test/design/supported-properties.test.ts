import { describe, expect, it } from "vitest";
import { emptyStyle } from "../../src/design/cascade";
import { applyDeclaration } from "../../src/design/declarations";
import { SUPPORTED_PROPERTIES } from "../../src/design/supported-properties";

/** A value every property reads without an error. */
const SAMPLE_VALUES: Record<string, string> = {
  color: "red",
  "background-color": "blue",
  background: "blue",
  border: "solid red",
  "border-style": "double",
  "border-color": "red",
  "border-width": "1",
  "border-radius": "4px",
  outline: "solid red",
  "outline-style": "double",
  "outline-color": "red",
  "outline-width": "1",
  "text-align": "center",
  "font-weight": "bold",
  "font-style": "italic",
  "font-size": "x-large",
  "font-family": "monospace",
  "text-decoration": "underline",
  "text-decoration-line": "underline",
  "text-decoration-style": "wavy",
  "text-decoration-color": "red",
  "text-transform": "uppercase",
  opacity: "0.5",
  filter: "invert(1)",
};

describe("SUPPORTED_PROPERTIES", () => {
  it("lists every property applyDeclaration accepts, each exactly once", () => {
    expect(new Set(SUPPORTED_PROPERTIES).size).toBe(SUPPORTED_PROPERTIES.length);
    for (const property of SUPPORTED_PROPERTIES) {
      const value = SAMPLE_VALUES[property] ?? "1";
      expect(applyDeclaration(emptyStyle(), property, value, {}), property).toBeNull();
    }
  });

  it("leaves out what applyDeclaration rejects", () => {
    expect(applyDeclaration(emptyStyle(), "z-index", "1", {})).toContain("unknown property");
    expect(SUPPORTED_PROPERTIES).not.toContain("z-index");
  });
});
