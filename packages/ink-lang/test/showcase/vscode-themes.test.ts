import { describe, expect, it } from "vitest";
import { showcaseThemes } from "../../examples/showcase/showcase-themes";
import { vscodeThemes } from "../../examples/showcase/vscode-themes";
import { createDesignSystem } from "../../src/design/design-system";

interface EditorColors {
  background: string;
  foreground: string;
}

/**
 * `editor.background` and `editor.foreground` as the theme files of the
 * vscode repository declare them (lower-cased), or the registry default
 * when a file leaves one out (`editor.foreground` of Quiet Light).
 */
const EDITOR_COLORS: Record<string, EditorColors> = {
  "vscode-dark-plus": { background: "#1e1e1e", foreground: "#d4d4d4" },
  "vscode-dark-modern": { background: "#1f1f1f", foreground: "#cccccc" },
  "vscode-light-plus": { background: "#ffffff", foreground: "#000000" },
  "vscode-light-modern": { background: "#ffffff", foreground: "#3b3b3b" },
  "vscode-monokai-dimmed": { background: "#1e1e1e", foreground: "#c5c8c6" },
  "vscode-solarized-dark": { background: "#002b36", foreground: "#839496" },
  "vscode-solarized-light": { background: "#fdf6e3", foreground: "#657b83" },
  "vscode-abyss": { background: "#000c18", foreground: "#6688cc" },
  "vscode-kimbie-dark": { background: "#221a0f", foreground: "#d3af86" },
  "vscode-quiet-light": { background: "#f5f5f5", foreground: "#333333" },
  "vscode-red": { background: "#390000", foreground: "#f8f8f8" },
  "vscode-tomorrow-night-blue": { background: "#002451", foreground: "#ffffff" },
  "vscode-dark-high-contrast": { background: "#000000", foreground: "#ffffff" },
  "vscode-light-high-contrast": { background: "#ffffff", foreground: "#292929" },
};

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
      expect(theme.description).toContain(".json");
    }
  });

  it("takes the editor background and foreground of each theme file", () => {
    for (const theme of vscodeThemes) {
      const expected = EDITOR_COLORS[theme.id];
      expect(expected, theme.id).toBeDefined();
      const semantic = createDesignSystem(theme.designSystem).tokens.color.semantic;
      expect(semantic.canvas.app, theme.id).toBe(expected?.background);
      expect(semantic.text.value, theme.id).toBe(expected?.foreground);
    }
  });

  it("is part of the showcase theme list after the hand-made themes", () => {
    const ids = showcaseThemes.map((theme) => theme.id);
    expect(ids.indexOf("vscode-dark-plus")).toBeGreaterThan(ids.indexOf("terminal-green"));
    expect(ids.indexOf("vscode-light-high-contrast")).toBe(ids.length - 1);
  });
});
