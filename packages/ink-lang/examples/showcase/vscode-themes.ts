import type { DesignSystemInput } from "../../src/design/design-system";
import type { ShowcaseTheme } from "./showcase-themes";

/**
 * The colors of a VS Code color theme that map onto the design tokens, read
 * from the theme files of the vscode repository (`extensions/theme-defaults/
 * themes/*.json` and the built-in theme extensions) and, where a file leaves
 * a key out, from the registry defaults for its kind of theme
 * (`src/vs/platform/theme/common/colors/*.ts`, `src/vs/workbench/common/theme.ts`).
 * Translucent defaults are blended over the editor background.
 *
 * - `background`: `editor.background`
 * - `surface`: `sideBar.background`
 * - `foreground`: `editor.foreground`
 * - `muted`: `descriptionForeground` (the default is the foreground at 70%)
 * - `placeholder`: `input.placeholderForeground` (the default is the foreground at 50%)
 * - `accent` and `accentText`: `button.background` and `button.foreground`; the high
 *   contrast themes use `focusBorder`, since their buttons are black on black
 * - `hover`: `button.hoverBackground` when the file sets it, else `list.hoverBackground`
 * - `border`: `panel.border` (`contrastBorder` in high contrast)
 * - `error`, `warning`, `success`, `info`: the terminal ansi red, yellow, green and
 *   blue when the file defines them, else `errorForeground`, `editorWarning.foreground`,
 *   `gitDecoration.addedResourceForeground` and `textLink.foreground` or their defaults
 */
interface VscodePalette {
  mode: "light" | "dark";
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  placeholder: string;
  accent: string;
  accentText: string;
  hover: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface VscodeThemeSpec {
  id: string;
  name: string;
  /** The theme file the palette was read from. */
  source: string;
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
      "color.canvas": palette.background,
      "color.canvas.app": palette.background,
      "color.canvas.surface": palette.surface,
      "color.text.value": palette.foreground,
      "color.text.label": palette.foreground,
      "color.text.helper": palette.muted,
      "color.text.placeholder": palette.placeholder,
      "color.border.default": palette.border,
      "color.border.hover": palette.accent,
      "color.button.background.focus": palette.accent,
      "color.button.text.focus": palette.accentText,
      "color.button.background.hover": palette.hover,
      "color.button.text.hover": palette.foreground,
      "shape.fieldBorder": "single",
    },
    css: [
      `Table { border: solid; border-color: ${palette.border} }`,
      `Table th { color: ${palette.info} }`,
      `Table tbody tr:odd { background-color: ${palette.surface} }`,
      `FormControl .label { color: ${palette.foreground} }`,
      `Tooltip .bubble { background-color: ${palette.surface}; border-color: ${palette.border} }`,
    ].join("\n"),
  };
}

function vscodeTheme(spec: VscodeThemeSpec): ShowcaseTheme {
  return {
    id: "vscode-" + spec.id,
    name: spec.name,
    description: `Inspired by the VS Code ${spec.name} theme (${spec.source})`,
    designSystem: vscodeDesignSystem(spec.palette),
  };
}

/** `extensions/theme-defaults/themes/dark_vs.json` plus the dark registry defaults. */
const DARK_PLUS: VscodePalette = {
  mode: "dark",
  background: "#1e1e1e",
  surface: "#252526",
  foreground: "#d4d4d4",
  muted: "#989898",
  placeholder: "#a6a6a6",
  accent: "#0e639c",
  accentText: "#ffffff",
  hover: "#2a2d2e",
  border: "#404040",
  error: "#f48771",
  warning: "#cca700",
  success: "#81b88b",
  info: "#3794ff",
};

/** `extensions/theme-defaults/themes/dark_modern.json`. */
const DARK_MODERN: VscodePalette = {
  mode: "dark",
  background: "#1f1f1f",
  surface: "#181818",
  foreground: "#cccccc",
  muted: "#9d9d9d",
  placeholder: "#989898",
  accent: "#0078d4",
  accentText: "#ffffff",
  hover: "#026ec1",
  border: "#2b2b2b",
  error: "#f85149",
  warning: "#cca700",
  success: "#81b88b",
  info: "#4daafc",
};

/** `extensions/theme-defaults/themes/light_vs.json` plus the light registry defaults. */
const LIGHT_PLUS: VscodePalette = {
  mode: "light",
  background: "#ffffff",
  surface: "#f3f3f3",
  foreground: "#000000",
  muted: "#717171",
  placeholder: "#767676",
  accent: "#007acc",
  accentText: "#ffffff",
  hover: "#e8e8e8",
  border: "#d3d3d3",
  error: "#a1260d",
  warning: "#bf8803",
  success: "#587c0c",
  info: "#006ab1",
};

/** `extensions/theme-defaults/themes/light_modern.json`. */
const LIGHT_MODERN: VscodePalette = {
  mode: "light",
  background: "#ffffff",
  surface: "#f8f8f8",
  foreground: "#3b3b3b",
  muted: "#3b3b3b",
  placeholder: "#767676",
  accent: "#005fb8",
  accentText: "#ffffff",
  hover: "#0258a8",
  border: "#e5e5e5",
  error: "#f85149",
  warning: "#bf8803",
  success: "#587c0c",
  info: "#005fb8",
};

/** `extensions/theme-monokai-dimmed/themes/dimmed-monokai-color-theme.json`. */
const MONOKAI_DIMMED: VscodePalette = {
  mode: "dark",
  background: "#1e1e1e",
  surface: "#272727",
  foreground: "#c5c8c6",
  muted: "#989898",
  placeholder: "#757575",
  accent: "#565656",
  accentText: "#ffffff",
  hover: "#444444",
  border: "#404040",
  error: "#c4265e",
  warning: "#b3b42b",
  success: "#86b42b",
  info: "#6a7ec8",
};

/** `extensions/theme-solarized-dark/themes/solarized-dark-color-theme.json`. */
const SOLARIZED_DARK: VscodePalette = {
  mode: "dark",
  background: "#002b36",
  surface: "#00212b",
  foreground: "#839496",
  muted: "#8f9c9f",
  placeholder: "#627a7d",
  accent: "#197271",
  accentText: "#ffffff",
  hover: "#004454",
  border: "#2b2b4a",
  error: "#dc322f",
  warning: "#b58900",
  success: "#859900",
  info: "#268bd2",
};

/** `extensions/theme-solarized-light/themes/solarized-light-color-theme.json`. */
const SOLARIZED_LIGHT: VscodePalette = {
  mode: "light",
  background: "#fdf6e3",
  surface: "#eee8d5",
  foreground: "#657b83",
  muted: "#717171",
  placeholder: "#8f9b9a",
  accent: "#ac9d57",
  accentText: "#002b36",
  hover: "#dfca88",
  border: "#ddd6c1",
  error: "#dc322f",
  warning: "#b58900",
  success: "#859900",
  info: "#268bd2",
};

/** `extensions/theme-abyss/themes/abyss-color-theme.json`. */
const ABYSS: VscodePalette = {
  mode: "dark",
  background: "#000c18",
  surface: "#060621",
  foreground: "#6688cc",
  muted: "#8f9296",
  placeholder: "#666c72",
  accent: "#2b3c5d",
  accentText: "#ffffff",
  hover: "#061940",
  border: "#2b2b4a",
  error: "#ff9da4",
  warning: "#ffeead",
  success: "#d1f1a9",
  info: "#bbdaff",
};

/** `extensions/theme-kimbie-dark/themes/kimbie-dark-color-theme.json`. */
const KIMBIE_DARK: VscodePalette = {
  mode: "dark",
  background: "#221a0f",
  surface: "#362712",
  foreground: "#d3af86",
  muted: "#999793",
  placeholder: "#77736e",
  accent: "#6e583b",
  accentText: "#ffffff",
  hover: "#51412c",
  border: "#433e37",
  error: "#f48771",
  warning: "#cca700",
  success: "#81b88b",
  info: "#3794ff",
};

/** `extensions/theme-quietlight/themes/quietlight-color-theme.json`. */
const QUIET_LIGHT: VscodePalette = {
  mode: "light",
  background: "#f5f5f5",
  surface: "#f2f2f2",
  foreground: "#333333",
  muted: "#717171",
  placeholder: "#ababab",
  accent: "#705697",
  accentText: "#ffffff",
  hover: "#e0e0e0",
  border: "#cccccc",
  error: "#f1897f",
  warning: "#bf8803",
  success: "#587c0c",
  info: "#006ab1",
};

/** `extensions/theme-red/themes/Red-color-theme.json`. */
const RED: VscodePalette = {
  mode: "dark",
  background: "#390000",
  surface: "#330000",
  foreground: "#f8f8f8",
  muted: "#a08f8f",
  placeholder: "#836666",
  accent: "#883333",
  accentText: "#f8f8f8",
  hover: "#800000",
  border: "#522d2d",
  error: "#ffeaea",
  warning: "#cca700",
  success: "#81b88b",
  info: "#3794ff",
};

/** `extensions/theme-tomorrow-night-blue/themes/tomorrow-night-blue-color-theme.json`. */
const TOMORROW_NIGHT_BLUE: VscodePalette = {
  mode: "dark",
  background: "#002451",
  surface: "#001c40",
  foreground: "#ffffff",
  muted: "#8f9aa7",
  placeholder: "#66788f",
  accent: "#0e639c",
  accentText: "#ffffff",
  hover: "#1a3a63",
  border: "#2d4461",
  error: "#ff9da4",
  warning: "#ffeead",
  success: "#d1f1a9",
  info: "#bbdaff",
};

/** `extensions/theme-defaults/themes/hc_black.json` plus the hcDark registry defaults. */
const DARK_HIGH_CONTRAST: VscodePalette = {
  mode: "dark",
  background: "#000000",
  surface: "#000000",
  foreground: "#ffffff",
  muted: "#b3b3b3",
  placeholder: "#b3b3b3",
  accent: "#f38518",
  accentText: "#000000",
  hover: "#1a1a1a",
  border: "#6fc3df",
  error: "#f48771",
  warning: "#ffd370",
  success: "#a1e3ad",
  info: "#21a6ff",
};

/** `extensions/theme-defaults/themes/hc_light.json` plus the hcLight registry defaults. */
const LIGHT_HIGH_CONTRAST: VscodePalette = {
  mode: "light",
  background: "#ffffff",
  surface: "#ffffff",
  foreground: "#292929",
  muted: "#696969",
  placeholder: "#696969",
  accent: "#0f4a85",
  accentText: "#ffffff",
  hover: "#e7edf3",
  border: "#0f4a85",
  error: "#b5200d",
  warning: "#895503",
  success: "#374e06",
  info: "#0f4a85",
};

const SPECS: VscodeThemeSpec[] = [
  { id: "dark-plus", name: "Dark+", source: "dark_plus.json", palette: DARK_PLUS },
  { id: "dark-modern", name: "Dark Modern", source: "dark_modern.json", palette: DARK_MODERN },
  { id: "light-plus", name: "Light+", source: "light_plus.json", palette: LIGHT_PLUS },
  { id: "light-modern", name: "Light Modern", source: "light_modern.json", palette: LIGHT_MODERN },
  {
    id: "monokai-dimmed",
    name: "Monokai Dimmed",
    source: "dimmed-monokai-color-theme.json",
    palette: MONOKAI_DIMMED,
  },
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    source: "solarized-dark-color-theme.json",
    palette: SOLARIZED_DARK,
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    source: "solarized-light-color-theme.json",
    palette: SOLARIZED_LIGHT,
  },
  { id: "abyss", name: "Abyss", source: "abyss-color-theme.json", palette: ABYSS },
  {
    id: "kimbie-dark",
    name: "Kimbie Dark",
    source: "kimbie-dark-color-theme.json",
    palette: KIMBIE_DARK,
  },
  {
    id: "quiet-light",
    name: "Quiet Light",
    source: "quietlight-color-theme.json",
    palette: QUIET_LIGHT,
  },
  { id: "red", name: "Red", source: "Red-color-theme.json", palette: RED },
  {
    id: "tomorrow-night-blue",
    name: "Tomorrow Night Blue",
    source: "tomorrow-night-blue-color-theme.json",
    palette: TOMORROW_NIGHT_BLUE,
  },
  {
    id: "dark-high-contrast",
    name: "Dark High Contrast",
    source: "hc_black.json",
    palette: DARK_HIGH_CONTRAST,
  },
  {
    id: "light-high-contrast",
    name: "Light High Contrast",
    source: "hc_light.json",
    palette: LIGHT_HIGH_CONTRAST,
  },
];

/** The VS Code built-in color themes, read from their theme files onto the design tokens. */
export const vscodeThemes: ShowcaseTheme[] = SPECS.map(vscodeTheme);
