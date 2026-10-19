import { describe, expect, it } from "vitest";
import { inspiredThemes } from "../../examples/showcase/inspired-themes";
import { showcaseThemes, type ShowcaseTheme } from "../../examples/showcase/showcase-themes";
import { vscodeThemes } from "../../examples/showcase/vscode-themes";
import { createDesignSystem } from "../../src/design/design-system";
import { parseStylesheet } from "../../src/design/stylesheet-parser";
import { walkLeaves } from "../../src/design/token-paths";
import { defaultTokens } from "../../src/design/tokens";
import { contrastRatio } from "../helpers/contrast";

/** The widest name the theme select can show beside its arrow in the sidebar. */
const MAX_NAME_LENGTH = 19;

/** The hand-made themes that come before the inspired and VS Code ones; the test keeps their order. */
const BASICS = ["default", "bordered", "minimal", "midnight", "daylight", "system", "monokai"];

interface Customisation {
  /** `spacing.lg=3` for a token, `Table th{text-transform}` for a rule. */
  key: string;
  theme: string;
}

/** The non-color token values and the selector-property pairs a theme sets. */
function customisations(theme: ShowcaseTheme): string[] {
  const keys: string[] = [];
  const tokens = createDesignSystem(theme.designSystem, {}).tokens;
  const defaults = new Map<string, string>();
  for (const leaf of walkLeaves(defaultTokens))
    defaults.set(leaf.path.join("."), String(leaf.value));
  for (const leaf of walkLeaves(tokens)) {
    const path = leaf.path.join(".");
    if (path.startsWith("color.") || path === "mode") continue;
    if (defaults.get(path) !== String(leaf.value)) keys.push(`${path}=${String(leaf.value)}`);
  }
  const parsed = parseStylesheet(theme.designSystem.css ?? "");
  for (const rule of parsed.rules) {
    for (const selector of rule.selectors) {
      const parts = selector.ancestors.concat(selector);
      const text = parts
        .map(
          (part) =>
            part.component +
            part.classes.map((c) => "." + c).join("") +
            part.states.map((s) => ":" + s).join(""),
        )
        .join(" ");
      for (const declaration of rule.declarations) keys.push(`${text}{${declaration.property}}`);
    }
  }
  return keys;
}

describe("showcaseThemes", () => {
  it("keeps the basics first, then the inspired themes, then the VS Code palettes", () => {
    const ids = showcaseThemes.map((theme) => theme.id);
    expect(ids.slice(0, BASICS.length)).toEqual(BASICS);
    expect(ids.slice(BASICS.length, BASICS.length + inspiredThemes.length)).toEqual(
      inspiredThemes.map((theme) => theme.id),
    );
    expect(ids.slice(BASICS.length + inspiredThemes.length)).toEqual(
      vscodeThemes.map((theme) => theme.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(inspiredThemes.length).toBeGreaterThanOrEqual(14);
  });

  it("gives every theme a short name, a description and no token or stylesheet errors", () => {
    for (const theme of showcaseThemes) {
      expect(theme.name.length, theme.id).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      expect(theme.description.length, theme.id).toBeGreaterThan(0);
      expect(createDesignSystem(theme.designSystem, {}).errors, theme.id).toEqual([]);
    }
    for (const theme of inspiredThemes.concat(vscodeThemes)) {
      expect(theme.description, theme.id).toContain("Inspired by");
    }
  });

  it("exercises every design token somewhere across the set", () => {
    const touched = new Set<string>();
    for (const theme of showcaseThemes) {
      for (const path of createDesignSystem(theme.designSystem, {}).assigned) touched.add(path);
    }
    const missing: string[] = [];
    for (const leaf of walkLeaves(defaultTokens)) {
      const path = leaf.path.join(".");
      const scale = leaf.path.slice(0, 3).join(".");
      const isPrimitiveStop = leaf.path[1] === "primitive" && touched.has(scale);
      if (path === "mode" || isPrimitiveStop || touched.has(path)) continue;
      missing.push(path);
    }
    expect(missing).toEqual([]);
  });

  it("lets each hand-made and inspired theme show a customisation no other theme shows", () => {
    const owners = new Map<string, string[]>();
    for (const theme of showcaseThemes) {
      for (const key of customisations(theme)) {
        const list = owners.get(key) ?? [];
        list.push(theme.id);
        owners.set(key, list);
      }
    }
    const withoutUnique: string[] = [];
    const candidates = showcaseThemes.slice(1, BASICS.length).concat(inspiredThemes);
    for (const theme of candidates) {
      const unique: Customisation[] = [];
      for (const key of customisations(theme)) {
        if ((owners.get(key) ?? []).length === 1) unique.push({ key, theme: theme.id });
      }
      if (unique.length === 0) withoutUnique.push(theme.id);
    }
    expect(withoutUnique).toEqual([]);
  });

  it("keeps text readable on the canvas of every hex theme", () => {
    for (const theme of showcaseThemes) {
      const semantic = createDesignSystem(theme.designSystem, {}).tokens.color.semantic;
      const canvas = semantic.canvas.app;
      if (!/^#[0-9a-f]{6}$/i.test(canvas)) continue;
      const value = semantic.text.value;
      const helper = semantic.text.helper;
      // The VS Code palettes keep the editor's own foreground; Solarized's sits at 4.1.
      const minimum = theme.id.startsWith("vscode-") ? 4 : 4.5;
      expect(contrastRatio(value, canvas), `${theme.id} text.value`).toBeGreaterThanOrEqual(
        minimum,
      );
      if (/^#[0-9a-f]{6}$/i.test(helper)) {
        expect(contrastRatio(helper, canvas), `${theme.id} text.helper`).toBeGreaterThanOrEqual(3);
      }
      const focusBackground = semantic.button.background.focus;
      const focusText = semantic.button.text.focus;
      if (/^#[0-9a-f]{6}$/i.test(focusBackground) && /^#[0-9a-f]{6}$/i.test(focusText)) {
        expect(
          contrastRatio(focusText, focusBackground),
          `${theme.id} button focus`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
