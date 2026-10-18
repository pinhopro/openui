import { describe, expect, it } from "vitest";
import { computeStyle, emptyStyle } from "../../src/design/cascade";
import { applyDeclaration, resolveValue } from "../../src/design/declarations";
import { matches, parseSelector, specificity } from "../../src/design/selector";
import { parseStylesheet } from "../../src/design/stylesheet-parser";

describe("parseStylesheet", () => {
  it("reads rules with several selectors and declarations, skipping comments", () => {
    const parsed = parseStylesheet(`
      /* fields */
      Input, TextArea:focus { color: white; border-color: var(--color-border-focus) }
      Button.secondary::placeholder { font-weight: bold; }
    `);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rules).toHaveLength(2);
    expect(parsed.rules[0]?.selectors.map((s) => s.component)).toEqual(["Input", "TextArea"]);
    expect(parsed.rules[0]?.declarations).toEqual([
      { property: "color", value: "white" },
      { property: "border-color", value: "var(--color-border-focus)" },
    ]);
    expect(parsed.rules[1]?.selectors[0]).toEqual({
      component: "Button",
      classes: ["secondary", "placeholder"],
      states: [],
      ancestors: [],
    });
  });

  it("reports a rule it cannot read and keeps the others", () => {
    const parsed = parseStylesheet("Input { color: red } garbage { Button { bold }");
    expect(parsed.rules).toHaveLength(1);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });
});

describe("parseSelector", () => {
  it("reads the component, classes, parts and states", () => {
    expect(parseSelector("*")).toEqual({ component: "*", classes: [], states: [], ancestors: [] });
    expect(parseSelector("Input:focus:disabled")).toEqual({
      component: "Input",
      classes: [],
      states: ["focus", "disabled"],
      ancestors: [],
    });
    expect(parseSelector("FormControl .label")).toEqual({
      component: "FormControl",
      classes: ["label"],
      states: [],
      ancestors: [],
    });
    expect(parseSelector("Card.sunk")).toMatchObject({ component: "Card", classes: ["sunk"] });
    expect(parseSelector(":cursor")).toMatchObject({ component: "*", states: ["cursor"] });
  });

  it("reads descendant selectors and matches them against the ancestors in order", () => {
    const selector = parseSelector("Table tbody tr:odd td.number Input:focus");
    expect(selector).toMatchObject({ component: "Input", classes: [], states: ["focus"] });
    const chain: string[] = [];
    for (const ancestor of selector.ancestors) {
      chain.push(
        ancestor.component + ":" + ancestor.states.join(",") + "." + ancestor.classes.join(","),
      );
    }
    expect(chain).toEqual(["Table:.", "tbody:.", "tr:odd.", "td:.number"]);
    const inTable = {
      component: "Input",
      classes: [],
      states: ["focus"],
      ancestors: ["Stack", "Table", "tbody", "tr", "td"],
    };
    expect(matches(parseSelector("Table Input"), inTable)).toBe(true);
    expect(matches(parseSelector("Table td Input:focus"), inTable)).toBe(true);
    expect(matches(parseSelector("Form Input"), inTable)).toBe(false);
    expect(matches(parseSelector("td Table Input"), inTable)).toBe(false);
    expect(specificity(parseSelector("Table td Input:focus"))).toBe(4);
  });

  it("matches a query by component, classes and states, and ranks by specificity", () => {
    const query = {
      component: "Button",
      classes: ["secondary"],
      states: ["focus"],
      ancestors: [],
    };
    expect(matches(parseSelector("Button"), query)).toBe(true);
    expect(matches(parseSelector("*"), query)).toBe(true);
    expect(matches(parseSelector("Button.secondary:focus"), query)).toBe(true);
    expect(matches(parseSelector("Button.primary"), query)).toBe(false);
    expect(matches(parseSelector("Button:disabled"), query)).toBe(false);
    expect(matches(parseSelector("Input"), query)).toBe(false);
    expect(specificity(parseSelector("*"))).toBe(0);
    expect(specificity(parseSelector("Button"))).toBe(1);
    expect(specificity(parseSelector("Button.secondary:focus"))).toBe(3);
  });
});

describe("resolveValue", () => {
  it("resolves var() against the variables, with a fallback", () => {
    const variables = { "--color-text-value": "white", "--spacing-md": "2" };
    expect(resolveValue("var(--color-text-value)", variables)).toBe("white");
    expect(resolveValue("var(--missing, red)", variables)).toBe("red");
    expect(resolveValue("var(--missing)", variables)).toBe("");
    expect(resolveValue("#fff", variables)).toBe("#fff");
  });
});

describe("applyDeclaration", () => {
  const none = {};

  function applied(property: string, value: string) {
    const style = emptyStyle();
    const error = applyDeclaration(style, property, value, none);
    return { style, error };
  }

  it("maps colors, the dim and inverse keywords and empty values", () => {
    expect(applied("color", "red").style.text.color).toBe("red");
    expect(applied("color", "dim").style.text).toEqual({ dim: true });
    expect(applied("color", "inverse").style.text).toEqual({ inverse: true });
    expect(applied("color", "").style.text).toEqual({});
    expect(applied("background-color", "#111").style).toMatchObject({
      box: { background: "#111" },
      text: { background: "#111" },
    });
  });

  it("maps borders, radius and padding to the box", () => {
    expect(applied("border-style", "solid").style.box.border).toBe("single");
    expect(applied("border", "double #fff").style.box).toEqual({
      border: "double",
      borderColor: "#fff",
    });
    expect(applied("border", "none").style.box.border).toBe("none");
    expect(applied("border-color", "dim").style.box).toEqual({ borderDim: true });
    const rounded = emptyStyle();
    applyDeclaration(rounded, "border-style", "solid", none);
    applyDeclaration(rounded, "border-radius", "4px", none);
    expect(rounded.box.border).toBe("round");
    expect(applied("padding", "1 2").style.box).toEqual({ paddingY: 1, paddingX: 2 });
    expect(applied("padding-x", "8px").style.box).toEqual({ paddingX: 1 });
    expect(applied("padding", "1rem").style.box).toEqual({ paddingX: 2, paddingY: 2 });
  });

  it("maps text alignment, outline, margin and the size properties", () => {
    expect(applied("text-align", "center").style.align).toBe("center");
    expect(applied("text-align", "end").style.align).toBe("right");
    expect(applied("outline", "double #fff").style.box).toEqual({
      border: "double",
      borderColor: "#fff",
    });
    expect(applied("margin", "1 2").style).toMatchObject({ marginY: 1, marginX: 2 });
    expect(applied("margin-left", "3").style.marginX).toBe(3);
    expect(applied("width", "40ch").style.width).toBe(40);
    expect(applied("min-width", "16px").style.minWidth).toBe(2);
    expect(applied("height", "3").style.height).toBe(3);
    expect(applied("min-height", "2").style.minHeight).toBe(2);
  });

  it("maps font size to a text scale, keeps the font family as a hint and reads underline styles", () => {
    expect(applied("font-size", "2em").style.fontSize).toBe(2);
    expect(applied("font-size", "48px").style.fontSize).toBe(3);
    expect(applied("font-size", "x-large").style.fontSize).toBe(3);
    expect(applied("font-size", "medium").style.fontSize).toBe(1);
    expect(applied("font-family", '"JetBrains Mono", monospace').style.fontFamily).toBe(
      "JetBrains Mono",
    );
    expect(applied("text-decoration", "underline wavy red").style.text).toEqual({
      underline: true,
      strikethrough: false,
      underlineStyle: "curly",
      underlineColor: "red",
    });
    expect(applied("text-decoration-style", "dotted").style.text.underlineStyle).toBe("dotted");
    expect(applied("text-decoration-color", "#f00").style.text.underlineColor).toBe("#f00");
  });

  it("maps typography, opacity, filter, gap and max-width", () => {
    expect(applied("font-weight", "bold").style.text.bold).toBe(true);
    expect(applied("font-weight", "700").style.text.bold).toBe(true);
    expect(applied("font-weight", "normal").style.text.bold).toBe(false);
    expect(applied("font-style", "italic").style.text.italic).toBe(true);
    expect(applied("text-decoration", "underline").style.text.underline).toBe(true);
    expect(applied("text-decoration", "line-through").style.text.strikethrough).toBe(true);
    expect(applied("text-transform", "uppercase").style.transform).toBe("uppercase");
    expect(applied("opacity", "0.5").style.text.dim).toBe(true);
    expect(applied("filter", "invert(1)").style.text.inverse).toBe(true);
    expect(applied("gap", "var(--spacing-lg)").style.gap).toBeUndefined();
    expect(applied("gap", "2").style.gap).toBe(2);
    expect(applied("max-width", "80ch").style.maxWidth).toBe(80);
  });

  it("reports unknown properties", () => {
    expect(applied("float", "left").error).toContain("float");
  });
});

describe("computeStyle", () => {
  const css = `
    * { color: var(--color-text-value) }
    Button { font-weight: bold; color: cyan }
    Button:focus { filter: invert(1) }
    Button.secondary { font-weight: normal }
    Button:disabled { opacity: 0.5; filter: none }
    Input::placeholder { color: dim }
  `;
  const rules = parseStylesheet(css).rules;
  const variables = { "--color-text-value": "white" };

  it("applies matching rules by specificity, then by order", () => {
    const idle = computeStyle(
      rules,
      { component: "Button", classes: [], states: [], ancestors: [] },
      variables,
    );
    expect(idle.text).toEqual({ color: "cyan", bold: true });
    const focused = computeStyle(
      rules,
      { component: "Button", classes: [], states: ["focus"], ancestors: [] },
      variables,
    );
    expect(focused.text.inverse).toBe(true);
    const secondary = computeStyle(
      rules,
      { component: "Button", classes: ["secondary"], states: ["focus"], ancestors: [] },
      variables,
    );
    expect(secondary.text).toEqual({ color: "cyan", bold: false, inverse: true });
    const disabled = computeStyle(
      rules,
      { component: "Button", classes: [], states: ["focus", "disabled"], ancestors: [] },
      variables,
    );
    expect(disabled.text.inverse).toBe(false);
    expect(disabled.text.dim).toBe(true);
  });

  it("falls back to the universal rules for other components and parts", () => {
    const other = computeStyle(
      rules,
      { component: "TextContent", classes: [], states: [], ancestors: [] },
      variables,
    );
    expect(other.text).toEqual({ color: "white" });
    const placeholder = computeStyle(
      rules,
      { component: "Input", classes: ["placeholder"], states: [], ancestors: [] },
      variables,
    );
    expect(placeholder.text).toEqual({ dim: true });
  });
});
