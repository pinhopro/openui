import type { DesignSystemInput } from "../../src/design/design-system";
import type { ShowcaseTheme } from "./showcase-themes";

/**
 * The colors of a VS Code color theme that map onto the design tokens:
 * `editor.background`, the side bar, the foreground, the description
 * foreground, the accent (focus border / button), the borders and the
 * four status colors. Hex only, the way the theme files give them.
 */
interface VscodePalette {
  mode: "light" | "dark";
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
  accentText: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface VscodeThemeSpec {
  id: string;
  name: string;
  palette: VscodePalette;
}

/** Turns a VS Code palette into the design tokens and the table styling the showcase uses. */
function vscodeDesignSystem(palette: VscodePalette): DesignSystemInput {
  return {
    mode: palette.mode,
    tokens: {
      "color.primary": palette.accent,
      "color.error": palette.error,
      "color.warning": palette.warning,
      "color.success": palette.success,
      "color.info": palette.info,
      "color.neutral": palette.muted,
      "color.canvas.app": palette.background,
      "color.canvas.surface": palette.surface,
      "color.text.value": palette.foreground,
      "color.text.label": palette.foreground,
      "color.text.helper": palette.muted,
      "color.text.placeholder": palette.muted,
      "color.border.default": palette.border,
      "color.button.background.focus": palette.accent,
      "color.button.text.focus": palette.accentText,
      "color.button.background.hover": palette.surface,
      "shape.fieldBorder": "single",
    },
    css: [
      `Table { border: solid; border-color: ${palette.border} }`,
      `Table th { color: ${palette.info} }`,
      `Table tbody tr:odd { background-color: ${palette.surface} }`,
      `FormControl .label { color: ${palette.foreground} }`,
    ].join("\n"),
  };
}

function vscodeTheme(spec: VscodeThemeSpec): ShowcaseTheme {
  return {
    id: "vscode-" + spec.id,
    name: spec.name,
    description: `Inspired by the VS Code ${spec.name} theme`,
    designSystem: vscodeDesignSystem(spec.palette),
  };
}

const SPECS: VscodeThemeSpec[] = [
  {
    id: "dark-plus",
    name: "Dark+",
    palette: {
      mode: "dark",
      background: "#1e1e1e",
      surface: "#252526",
      foreground: "#d4d4d4",
      muted: "#9d9d9d",
      accent: "#0e639c",
      accentText: "#ffffff",
      border: "#454545",
      error: "#f48771",
      warning: "#cca700",
      success: "#89d185",
      info: "#75beff",
    },
  },
  {
    id: "dark-modern",
    name: "Dark Modern",
    palette: {
      mode: "dark",
      background: "#1f1f1f",
      surface: "#181818",
      foreground: "#cccccc",
      muted: "#9d9d9d",
      accent: "#0078d4",
      accentText: "#ffffff",
      border: "#2b2b2b",
      error: "#f85149",
      warning: "#cca700",
      success: "#2ea043",
      info: "#3794ff",
    },
  },
  {
    id: "light-plus",
    name: "Light+",
    palette: {
      mode: "light",
      background: "#ffffff",
      surface: "#f3f3f3",
      foreground: "#000000",
      muted: "#717171",
      accent: "#007acc",
      accentText: "#ffffff",
      border: "#c8c8c8",
      error: "#a1260d",
      warning: "#bf8803",
      success: "#388a34",
      info: "#1a85ff",
    },
  },
  {
    id: "light-modern",
    name: "Light Modern",
    palette: {
      mode: "light",
      background: "#ffffff",
      surface: "#f8f8f8",
      foreground: "#3b3b3b",
      muted: "#616161",
      accent: "#005fb8",
      accentText: "#ffffff",
      border: "#e5e5e5",
      error: "#f85149",
      warning: "#bf8803",
      success: "#1a7f37",
      info: "#1a85ff",
    },
  },
  {
    id: "monokai-dimmed",
    name: "Monokai Dimmed",
    palette: {
      mode: "dark",
      background: "#1e1e1e",
      surface: "#272727",
      foreground: "#c5c8c6",
      muted: "#8b8b8b",
      accent: "#4d6c9a",
      accentText: "#ffffff",
      border: "#3e3e3e",
      error: "#c15b5b",
      warning: "#d0b344",
      success: "#9aa83a",
      info: "#6089b4",
    },
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    palette: {
      mode: "dark",
      background: "#002b36",
      surface: "#073642",
      foreground: "#93a1a1",
      muted: "#586e75",
      accent: "#268bd2",
      accentText: "#fdf6e3",
      border: "#586e75",
      error: "#dc322f",
      warning: "#b58900",
      success: "#859900",
      info: "#2aa198",
    },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    palette: {
      mode: "light",
      background: "#fdf6e3",
      surface: "#eee8d5",
      foreground: "#657b83",
      muted: "#93a1a1",
      accent: "#268bd2",
      accentText: "#fdf6e3",
      border: "#93a1a1",
      error: "#dc322f",
      warning: "#b58900",
      success: "#859900",
      info: "#2aa198",
    },
  },
  {
    id: "abyss",
    name: "Abyss",
    palette: {
      mode: "dark",
      background: "#000c18",
      surface: "#051336",
      foreground: "#6688cc",
      muted: "#4c5a7a",
      accent: "#2277ff",
      accentText: "#ffffff",
      border: "#2b3c5d",
      error: "#ff6b6b",
      warning: "#ffb454",
      success: "#22aa44",
      info: "#80a4ff",
    },
  },
  {
    id: "kimbie-dark",
    name: "Kimbie Dark",
    palette: {
      mode: "dark",
      background: "#221a0f",
      surface: "#362712",
      foreground: "#d3af86",
      muted: "#a57a4c",
      accent: "#f79a32",
      accentText: "#221a0f",
      border: "#5e452b",
      error: "#dc3958",
      warning: "#f79a32",
      success: "#889b4a",
      info: "#7e602c",
    },
  },
  {
    id: "quiet-light",
    name: "Quiet Light",
    palette: {
      mode: "light",
      background: "#f5f5f5",
      surface: "#e8e8e8",
      foreground: "#333333",
      muted: "#777777",
      accent: "#705697",
      accentText: "#ffffff",
      border: "#c4c4c4",
      error: "#c62828",
      warning: "#b57d2d",
      success: "#4b8b3b",
      info: "#4b69c6",
    },
  },
  {
    id: "red",
    name: "Red",
    palette: {
      mode: "dark",
      background: "#390000",
      surface: "#580000",
      foreground: "#f8f8f8",
      muted: "#e7c0c0",
      accent: "#883333",
      accentText: "#f8f8f8",
      border: "#a04141",
      error: "#ff5555",
      warning: "#ffb454",
      success: "#a6e22e",
      info: "#aaaaff",
    },
  },
  {
    id: "tomorrow-night-blue",
    name: "Tomorrow Night Blue",
    palette: {
      mode: "dark",
      background: "#002451",
      surface: "#001c40",
      foreground: "#ffffff",
      muted: "#7285b7",
      accent: "#bbdaff",
      accentText: "#002451",
      border: "#003f8e",
      error: "#ff9da4",
      warning: "#ffc58f",
      success: "#d1f1a9",
      info: "#99ffff",
    },
  },
  {
    id: "dark-high-contrast",
    name: "Dark High Contrast",
    palette: {
      mode: "dark",
      background: "#000000",
      surface: "#000000",
      foreground: "#ffffff",
      muted: "#a5a5a5",
      accent: "#f38518",
      accentText: "#000000",
      border: "#6fc3df",
      error: "#f48771",
      warning: "#ffd700",
      success: "#89d185",
      info: "#75beff",
    },
  },
  {
    id: "light-high-contrast",
    name: "Light High Contrast",
    palette: {
      mode: "light",
      background: "#ffffff",
      surface: "#ffffff",
      foreground: "#292929",
      muted: "#292929",
      accent: "#0f4a85",
      accentText: "#ffffff",
      border: "#0f4a85",
      error: "#b5200d",
      warning: "#bf8803",
      success: "#374e06",
      info: "#0f4a85",
    },
  },
];

/** The VS Code built-in color themes, approximated onto the design tokens. */
export const vscodeThemes: ShowcaseTheme[] = SPECS.map(vscodeTheme);
