import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { defaultTheme, resolveTheme } from "../src/theme";
import { findPreset, themePresets } from "../src/theme-presets";
import { INVERSE_ON, RED_ON, stripAnsi, UNDERLINE_ON } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const MAGENTA_ON = "\u001b[35m";
const BLUE_BG_ON = "\u001b[44m";
const YELLOW_ON = "\u001b[33m";

describe("resolveTheme", () => {
  it("fills every slot from the default theme and derives the styles from the palette", () => {
    expect(resolveTheme(undefined)).toEqual(defaultTheme);
    const themed = resolveTheme({ danger: "magenta" });
    expect(themed.danger).toBe("magenta");
    expect(themed.accent).toBe(defaultTheme.accent);
    expect(themed.button.destructive.color).toBe("magenta");
  });

  it("defaults success to green and warning to yellow", () => {
    expect(defaultTheme.success).toBe("green");
    expect(defaultTheme.warning).toBe("yellow");
  });
});

describe("theme in the renderer", () => {
  it("colors a destructive button with the theme's danger color", async () => {
    const program = 'root = Stack([d])\nd = Button("Delete", null, "primary", "destructive")';
    const rendered = await renderProgram(inkLibrary, program, { theme: { danger: "magenta" } });
    const line = rendered
      .frame()
      .split("\n")
      .find(function hasDelete(candidate) {
        return stripAnsi(candidate).includes("[ Delete ]");
      });
    expect(line).toContain(MAGENTA_ON);
    expect(line).not.toContain(RED_ON);
    rendered.unmount();
  });

  it("colors the card border and the heading with the theme's accent", async () => {
    const program = 'root = Stack([Card([CardHeader("Title", "Sub")])])';
    const rendered = await renderProgram(inkLibrary, program, { theme: { accent: "yellow" } });
    expect(rendered.frame()).toContain(YELLOW_ON);
    rendered.unmount();
  });
});

describe("theme style slots", () => {
  it("derives the default styles from the palette, so an accent override reaches the heading", () => {
    const theme = resolveTheme({ accent: "yellow" });
    expect(theme.heading.color).toBe("yellow");
    expect(theme.card.card.borderColor).toBe("yellow");
    expect(theme.button.destructive.color).toBe("red");
  });

  it("merges a style slot field by field and keeps the rest of the defaults", () => {
    const theme = resolveTheme({ field: { box: { border: "round" } } });
    expect(theme.field.box.border).toBe("round");
    expect(theme.field.placeholder).toEqual(defaultTheme.field.placeholder);
    expect(theme.focusRing).toEqual(defaultTheme.focusRing);
  });

  it("draws a bordered input with a background when the field slot asks for it", async () => {
    const program = 'root = Stack([Input("q", "Search")])';
    const rendered = await renderProgram(inkLibrary, program, {
      theme: { field: { box: { border: "round", background: "blue" } } },
    });
    const frame = rendered.frame();
    expect(stripAnsi(frame)).toContain("╭");
    expect(stripAnsi(frame)).toContain("Search");
    expect(frame).toContain(BLUE_BG_ON);
    rendered.unmount();
  });

  it("styles buttons and cards from their slots", async () => {
    const program = 'root = Stack([Card([CardHeader("Title")]), Button("Go", @ToAssistant("Go"))])';
    const rendered = await renderProgram(inkLibrary, program, {
      theme: { button: { primary: { color: "magenta" } }, card: { card: { border: "double" } } },
    });
    const lines = rendered.frame().split("\n");
    const buttonLine = lines.find(function hasGo(line) {
      return stripAnsi(line).includes("[ Go ]");
    });
    expect(buttonLine).toContain(MAGENTA_ON);
    expect(stripAnsi(rendered.frame())).toContain("╔");
    rendered.unmount();
  });

  it("draws the focus ring the theme asks for instead of inverse video", async () => {
    const program =
      'root = Stack([RadioGroup("billing", [RadioItem("Monthly", "", "m"), RadioItem("Yearly", "", "y")])])';
    const rendered = await renderProgram(inkLibrary, program, {
      theme: { focusRing: { underline: true, inverse: false } },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    const frame = rendered.frame();
    expect(frame).toContain(UNDERLINE_ON);
    expect(frame).not.toContain(INVERSE_ON);
    rendered.unmount();
  });
});

describe("theme presets", () => {
  it("ships named presets that all resolve", () => {
    const ids: string[] = [];
    for (const preset of themePresets) {
      ids.push(preset.id);
      expect(resolveTheme(preset.theme).field.box).toBeDefined();
    }
    expect(ids).toEqual(["default", "bordered", "minimal", "midnight"]);
    expect(resolveTheme(findPreset("bordered").theme).field.box.border).toBe("round");
    expect(resolveTheme(findPreset("midnight").theme).field.box.background).toBeDefined();
  });
});
