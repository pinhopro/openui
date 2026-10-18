import type { DesignSystemInput } from "../../src/design/design-system";

/** A design system the showcase can switch to. */
export interface ShowcaseTheme {
  id: string;
  name: string;
  description: string;
  designSystem: DesignSystemInput;
}

const SLATE = {
  "color.primary": "#38bdf8",
  "color.error": "#f87171",
  "color.success": "#4ade80",
  "color.warning": "#fbbf24",
  "color.neutral": "#94a3b8",
  "color.canvas.app": "#0f172a",
  "color.canvas.surface": "#1e293b",
  "color.text.value": "#f8fafc",
  "color.text.label": "#e2e8f0",
  "color.text.helper": "#94a3b8",
  "color.text.placeholder": "#64748b",
  "color.border.default": "#475569",
  "color.button.background.focus": "#0ea5e9",
  "color.button.text.focus": "#0f172a",
  "color.button.background.hover": "#334155",
  "shape.fieldBorder": "round",
  "shape.cardBorder": "double",
};

export const showcaseThemes: ShowcaseTheme[] = [
  {
    id: "default",
    name: "Default",
    description: "Terminal colors, borderless fields, inverse focus",
    designSystem: {},
  },
  {
    id: "bordered",
    name: "Bordered",
    description: "Fields in rounded boxes that light up on focus",
    designSystem: { tokens: { "shape.fieldBorder": "round", "spacing.sm": 1 } },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "No card borders; underline instead of inverse",
    designSystem: {
      tokens: { "color.primary": "white", "shape.cardBorder": "none" },
      css: [
        ":cursor { filter: none; text-decoration: underline; font-weight: bold }",
        "Button:focus { filter: none; text-decoration: underline; font-weight: bold }",
        "Card.sunk { border: none; padding: 0 }",
        "CardHeader .title { text-decoration: underline }",
      ].join("\n"),
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark slate hex tokens: filled fields, double card borders",
    designSystem: { tokens: SLATE, mode: "dark" },
  },
  {
    id: "daylight",
    name: "Daylight",
    description: "A light design system: dark text on a white canvas",
    designSystem: {
      mode: "light",
      tokens: {
        "color.primary": "#2563eb",
        "color.error": "#dc2626",
        "color.success": "#16a34a",
        "color.warning": "#d97706",
        "color.neutral": "#64748b",
        "color.canvas.app": "#ffffff",
        "color.canvas.surface": "#f1f5f9",
        "color.text.value": "#0f172a",
        "color.text.label": "#1e293b",
        "color.text.helper": "#475569",
        "color.text.placeholder": "#94a3b8",
        "color.border.default": "#cbd5e1",
        "color.button.background.focus": "#2563eb",
        "color.button.text.focus": "#ffffff",
        "shape.fieldBorder": "round",
      },
    },
  },
  {
    id: "system",
    name: "System",
    description: "Follows the terminal background (COLORFGBG): light or dark tokens",
    designSystem: {
      mode: "system",
      tokens: {
        "color.primary": "#8b5cf6",
        "shape.fieldBorder": "round",
        light: { "color.text.value": "#1e1b4b", "color.canvas.surface": "#ede9fe" },
        dark: { "color.text.value": "#ede9fe", "color.canvas.surface": "#2e1065" },
      },
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    description: "The editor palette: lime primary, pink errors, striped tables",
    designSystem: {
      tokens: {
        "color.primary": "#a6e22e",
        "color.error": "#f92672",
        "color.warning": "#e6db74",
        "color.info": "#66d9ef",
        "color.neutral": "#75715e",
        "color.canvas.app": "#272822",
        "color.canvas.surface": "#3e3d32",
        "color.text.value": "#f8f8f2",
        "color.text.helper": "#a59f85",
        "color.text.placeholder": "#75715e",
        "color.border.default": "#49483e",
        "shape.fieldBorder": "single",
        "typography.h4.transform": "uppercase",
      },
      css: [
        "Table { border: solid; border-color: #49483e }",
        "Table th { color: #66d9ef }",
        "Table tbody tr:odd { background-color: #3e3d32 }",
        "Button:hover { background-color: #49483e }",
        "FormControl .label { color: #e6db74 }",
      ].join("\n"),
    },
  },
];
