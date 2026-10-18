import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { defaultTheme, resolveTheme } from "../src/theme";
import { RED_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

const MAGENTA_ON = "\u001b[35m";
const YELLOW_ON = "\u001b[33m";

describe("resolveTheme", () => {
  it("fills every slot from the default theme", () => {
    expect(resolveTheme(undefined)).toEqual(defaultTheme);
    expect(resolveTheme({ danger: "magenta" })).toEqual({ ...defaultTheme, danger: "magenta" });
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
