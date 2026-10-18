import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import { defaultStylesheet } from "../../src/design/default-stylesheet";
import { createDesignSystem } from "../../src/design/design-system";
import { defaultTokens } from "../../src/design/tokens";
import { stripAnsi } from "../helpers/ansi";
import { KEYS } from "../helpers/keys";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const MAGENTA_ON = "\u001b[35m";
const WHITE_ON = "\u001b[37m";

describe("defaultStylesheet", () => {
  it("only declares the tokens that are set, so the terminal's own colors stay", () => {
    const css = defaultStylesheet(defaultTokens);
    expect(css).toContain("Input::placeholder");
    expect(css).toContain("var(--color-text-placeholder)");
    expect(css).not.toContain("color: var(--color-text-value)");
    expect(css).toContain(":cursor { filter: invert(1) }");
  });
});

describe("createDesignSystem", () => {
  it("reproduces the default theme slots from the default tokens", () => {
    const system = createDesignSystem({});
    expect(system.errors).toEqual([]);
    expect(system.theme.accent).toBe("cyan");
    expect(system.theme.field.box.border).toBe("none");
    expect(system.theme.field.placeholder).toEqual({ dim: true });
    expect(system.theme.button.primary).toEqual({ bold: true });
    expect(system.theme.button.focused.inverse).toBe(true);
    expect(system.theme.button.disabled.dim).toBe(true);
    expect(system.theme.card.card).toMatchObject({ border: "round", borderColor: "cyan" });
    expect(system.theme.card.clear.border).toBe("none");
    expect(system.theme.heading).toMatchObject({ bold: true, color: "cyan" });
    expect(system.theme.subtext).toMatchObject({ dim: true });
    expect(system.theme.focusRing).toEqual({ inverse: true });
  });

  it("turns tokens into slots: borders, focus colors and backgrounds", () => {
    const system = createDesignSystem({
      tokens: {
        "shape.fieldBorder": "round",
        "--color-border-focus": "#38bdf8",
        "color.canvas.surface": "#1e293b",
        "color.primary": "#2563eb",
      },
    });
    expect(system.errors).toEqual([]);
    expect(system.theme.field.box).toMatchObject({ border: "round", background: "#1e293b" });
    expect(system.theme.field.focused.box.borderColor).toBe("#38bdf8");
    expect(system.theme.accent).toBe("#2563eb");
    expect(system.theme.card.card.borderColor).toBe("#2563eb");
  });

  it("lets the stylesheet override the token-derived rules and reports bad css", () => {
    const system = createDesignSystem({
      css: "Button { color: magenta } FormControl .label { color: white } broken {",
    });
    expect(system.theme.button.primary).toEqual({ bold: true, color: "magenta" });
    const label = system.style({
      component: "FormControl",
      classes: ["label"],
      states: [],
      ancestors: [],
    });
    expect(label.text).toMatchObject({ color: "white", bold: true });
    expect(system.errors).toHaveLength(1);
  });

  it("picks the light or dark token block from the mode", () => {
    const tokens = {
      light: { "color.text.value": "black" },
      dark: { "color.text.value": "white" },
    };
    expect(createDesignSystem({ tokens, mode: "light" }).theme.field.text.color).toBe("black");
    expect(createDesignSystem({ tokens, mode: "dark" }).theme.field.text.color).toBe("white");
    expect(createDesignSystem({ tokens, mode: "system" }, { COLORFGBG: "0;15" }).tokens.mode).toBe(
      "light",
    );
  });

  it("exposes the tokens as CSS variables for the stylesheet", () => {
    const system = createDesignSystem({ tokens: { "spacing.lg": 4 } });
    expect(system.variables["--spacing-lg"]).toBe("4");
  });
});

describe("designSystem in the renderer", () => {
  it("draws the program with the design system's tokens and css", async () => {
    const program = 'root = Stack([Card([CardHeader("Title")]), Input("q", "Search")])';
    const rendered = await renderProgram(inkLibrary, program, {
      designSystem: {
        tokens: { "shape.fieldBorder": "round", "color.text.value": "white" },
        css: "CardHeader .title { color: magenta }",
      },
    });
    const frame = rendered.frame();
    expect(stripAnsi(frame)).toContain("╭");
    expect(frame).toContain(MAGENTA_ON);
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("a");
    await settle();
    expect(rendered.frame()).toContain(WHITE_ON);
    rendered.unmount();
  });

  it("merges an explicit theme over the design system", async () => {
    const program = 'root = Stack([Button("Go", @ToAssistant("Go"))])';
    const rendered = await renderProgram(inkLibrary, program, {
      designSystem: { css: "Button { color: magenta }" },
      theme: { button: { primary: { color: "white" } } },
    });
    expect(rendered.frame()).toContain(WHITE_ON);
    expect(rendered.frame()).not.toContain(MAGENTA_ON);
    rendered.unmount();
  });
});
