import type { InkThemeOverrides } from "./theme";

/** A ready-made theme a host (or the showcase) can pick by id. */
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: InkThemeOverrides;
}

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "Default",
    description: "Cyan accent, borderless fields, inverse focus ring",
    theme: {},
  },
  {
    id: "bordered",
    name: "Bordered",
    description: "Every text field in its own rounded box; the border lights up with focus",
    theme: {
      field: {
        box: { border: "round", borderDim: true, paddingX: 1 },
        focused: { box: { borderDim: false, borderColor: "cyan" } },
      },
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "No card borders; focus shown by an underline instead of inverse video",
    theme: {
      accent: "white",
      heading: { bold: true, underline: true, color: "white" },
      focusRing: { inverse: false, underline: true, bold: true },
      field: { focused: { text: { underline: true } } },
      button: { focused: { inverse: false, underline: true, bold: true } },
      card: {
        card: { border: "none", paddingX: 0 },
        sunk: { border: "none", paddingX: 0 },
      },
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Hex colors from a dark design system: filled fields, double card borders",
    theme: {
      accent: "#38bdf8",
      danger: "#f87171",
      muted: "#94a3b8",
      success: "#4ade80",
      warning: "#fbbf24",
      heading: { bold: true, color: "#e0f2fe" },
      focusRing: { inverse: false, background: "#334155", bold: true },
      field: {
        box: { background: "#1e293b", paddingX: 1 },
        text: { color: "#f8fafc" },
        placeholder: { color: "#64748b", dim: false },
        focused: { box: { background: "#334155" } },
      },
      button: {
        primary: { bold: true, color: "#38bdf8" },
        secondary: { color: "#cbd5e1" },
        focused: { inverse: false, background: "#0ea5e9", color: "#0f172a" },
      },
      card: {
        card: { border: "double", borderColor: "#38bdf8", paddingX: 1 },
        sunk: { border: "single", borderColor: "#475569", borderDim: false, paddingX: 1 },
      },
    },
  },
];

/** The preset with that id; the default preset when none matches. */
export function findPreset(id: string): ThemePreset {
  for (const preset of themePresets) {
    if (preset.id === id) return preset;
  }
  return themePresets[0] as ThemePreset;
}
