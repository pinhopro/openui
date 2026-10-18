import { describe, expect, it } from "vitest";
import { showcaseThemes } from "../../examples/showcase/showcase-themes";
import { vscodeThemes } from "../../examples/showcase/vscode-themes";
import { createDesignSystem } from "../../src/design/design-system";

describe("vscodeThemes", () => {
  it("brings every VS Code built-in theme, each with its own id and mode", () => {
    const names = vscodeThemes.map((theme) => theme.name);
    expect(names).toEqual([
      "Dark+",
      "Dark Modern",
      "Light+",
      "Light Modern",
      "Monokai Dimmed",
      "Solarized Dark",
      "Solarized Light",
      "Abyss",
      "Kimbie Dark",
      "Quiet Light",
      "Red",
      "Tomorrow Night Blue",
      "Dark High Contrast",
      "Light High Contrast",
    ]);
    const ids = new Set(vscodeThemes.map((theme) => theme.id));
    expect(ids.size).toBe(vscodeThemes.length);
    for (const theme of vscodeThemes) {
      expect(theme.description).toContain("VS Code");
      expect(theme.designSystem.mode === "light" || theme.designSystem.mode === "dark").toBe(true);
    }
  });

  it("resolves each palette into a full design system with its editor background as the canvas", () => {
    for (const theme of vscodeThemes) {
      const tokens = createDesignSystem(theme.designSystem).tokens;
      expect(tokens.mode).toBe(theme.designSystem.mode);
      expect(tokens.color.semantic.canvas.app).toMatch(/^#[0-9a-f]{6}$/);
      expect(tokens.color.semantic.text.value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("is part of the showcase theme list after the hand-made themes", () => {
    const ids = showcaseThemes.map((theme) => theme.id);
    expect(ids.indexOf("vscode-dark-plus")).toBeGreaterThan(ids.indexOf("monokai"));
    expect(ids.indexOf("vscode-light-high-contrast")).toBe(ids.length - 1);
  });
});
