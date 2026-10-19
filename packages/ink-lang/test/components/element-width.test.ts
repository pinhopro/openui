import type { ElementNode } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { elementWidth } from "../../src/components/element-width";

function element(typeName: string, props: Record<string, unknown>): ElementNode {
  return { type: "element", typeName, props, partial: false };
}

function item(value: string, label: string): ElementNode {
  return element("SelectItem", { value, label });
}

describe("elementWidth", () => {
  it("gives an Input its prompt, the longer of value and placeholder, and the cursor cell", () => {
    expect(elementWidth(element("Input", { name: "q", placeholder: "Search" }))).toBe(
      "> ".length + "Search".length + 1,
    );
    expect(elementWidth(element("Input", { name: "q", placeholder: "Q", value: "abc" }))).toBe(
      "> abc".length + 1,
    );
    expect(elementWidth(element("Input", { name: "q", placeholder: "Search", value: "ab" }))).toBe(
      "> ".length + "Search".length + 1,
    );
  });

  it("reads the current value of a field through the reader instead of its declared prop", () => {
    const binding = { __reactive: "assign", target: "q", expr: null };
    const input = element("Input", { name: "q", placeholder: "Q", value: binding });
    function readField(name: string, declared: unknown): unknown {
      return name === "q" && declared === binding ? "a longer search query" : undefined;
    }
    expect(elementWidth(input, readField)).toBe("> a longer search query".length + 1);
  });

  it("gives a Select its prompt, the chevron and the widest of its labels and placeholder", () => {
    const select = element("Select", {
      name: "plan",
      items: [item("a", "Option A"), item("b", "A longer option")],
      placeholder: "Pick",
    });
    expect(elementWidth(select)).toBe("> ▾ ".length + "A longer option".length);
  });

  it("gives a Combobox room for its filter line and for its widest option line", () => {
    const combobox = element("Combobox", {
      name: "city",
      items: [item("rio", "Rio"), item("sp", "São Paulo")],
      placeholder: "Search a city",
    });
    expect(elementWidth(combobox)).toBe("> ".length + "Search a city".length + 1);
    const wide = element("Combobox", { name: "city", items: [item("x", "A very long label")] });
    expect(elementWidth(wide)).toBe("  ● ".length + "A very long label".length);
  });

  it("gives a TextArea its prompt, the longer of value and placeholder, and the cursor cell", () => {
    expect(
      elementWidth(element("TextArea", { name: "t", value: "hello", placeholder: "Hi" })),
    ).toBe("> hello".length + 1);
  });
});
