import { createContext, useContext } from "react";
import { mergeBoxStyle, mergeTextStyle, type BoxStyle, type TextStyle } from "./theme-styles";

/** The named colors every default style derives from; any Ink color value works. */
export interface InkPalette {
  /** Card borders, headings and inline code. */
  accent: string;
  /** Destructive buttons and error lines. */
  danger: string;
  /** Secondary text such as hints and status lines. */
  muted: string;
  /** Success tags, callouts and upward metric trends. */
  success: string;
  /** Warning tags and callouts. */
  warning: string;
}

/** The text fields: Input, TextArea, Select, Combobox and DatePicker. */
export interface FieldTheme {
  /** The box around the field (no border by default). */
  box: BoxStyle;
  /** The typed or picked value. */
  text: TextStyle;
  /** The placeholder while the field is empty. */
  placeholder: TextStyle;
  /** Merged over `box` and `text` while the field has focus. */
  focused: FieldFocusTheme;
}

export interface FieldFocusTheme {
  box: BoxStyle;
  text: TextStyle;
}

/** Buttons, icon buttons, the table pager and the retry control. */
export interface ButtonTheme {
  primary: TextStyle;
  secondary: TextStyle;
  tertiary: TextStyle;
  /** Merged over the variant for `type: "destructive"`. */
  destructive: TextStyle;
  /** Merged over the rest while focused (or hovered). */
  focused: TextStyle;
  /** Merged over the rest while streaming or inert. */
  disabled: TextStyle;
}

/** The three Card variants. */
export interface CardTheme {
  card: BoxStyle;
  sunk: BoxStyle;
  clear: BoxStyle;
}

/** The whole theme: the palette plus one CSS-like style slot per part of the UI. */
export interface InkTheme extends InkPalette {
  /** CardHeader titles. */
  heading: TextStyle;
  /** Subtitles, hints and other secondary lines. */
  subtext: TextStyle;
  /** The option, row, tab or cell under the focus cursor. */
  focusRing: TextStyle;
  field: FieldTheme;
  button: ButtonTheme;
  card: CardTheme;
}

/** What a host passes as `theme`: any subset of the slots, merged over the defaults. */
export interface InkThemeOverrides {
  accent?: string;
  danger?: string;
  muted?: string;
  success?: string;
  warning?: string;
  heading?: TextStyle;
  subtext?: TextStyle;
  focusRing?: TextStyle;
  field?: FieldThemeOverrides;
  button?: ButtonThemeOverrides;
  card?: CardThemeOverrides;
}

export interface FieldThemeOverrides {
  box?: BoxStyle;
  text?: TextStyle;
  placeholder?: TextStyle;
  focused?: FieldFocusThemeOverrides;
}

export interface FieldFocusThemeOverrides {
  box?: BoxStyle;
  text?: TextStyle;
}

export interface ButtonThemeOverrides {
  primary?: TextStyle;
  secondary?: TextStyle;
  tertiary?: TextStyle;
  destructive?: TextStyle;
  focused?: TextStyle;
  disabled?: TextStyle;
}

export interface CardThemeOverrides {
  card?: BoxStyle;
  sunk?: BoxStyle;
  clear?: BoxStyle;
}

export const defaultPalette: InkPalette = {
  accent: "cyan",
  danger: "red",
  muted: "gray",
  success: "green",
  warning: "yellow",
};

/** The default styles for a palette: what the renderer drew before themes had slots. */
export function defaultStyles(palette: InkPalette): InkTheme {
  return {
    ...palette,
    heading: { bold: true, color: palette.accent },
    subtext: { dim: true },
    focusRing: { inverse: true },
    field: {
      box: { border: "none" },
      text: {},
      placeholder: { dim: true },
      focused: { box: {}, text: {} },
    },
    button: {
      primary: { bold: true },
      secondary: {},
      tertiary: {},
      destructive: { color: palette.danger },
      focused: { inverse: true },
      disabled: { dim: true },
    },
    card: {
      card: { border: "round", borderColor: palette.accent, paddingX: 1 },
      sunk: { border: "single", borderDim: true, paddingX: 1 },
      clear: { border: "none", paddingX: 0 },
    },
  };
}

export const defaultTheme: InkTheme = defaultStyles(defaultPalette);

/**
 * The theme a host asked for: the palette it gave merged over the default
 * one, the default styles derived from that palette, and every style slot it
 * gave merged field by field over those.
 */
export function resolveTheme(overrides: InkThemeOverrides | undefined): InkTheme {
  if (overrides === undefined) return defaultTheme;
  const palette: InkPalette = {
    accent: overrides.accent ?? defaultPalette.accent,
    danger: overrides.danger ?? defaultPalette.danger,
    muted: overrides.muted ?? defaultPalette.muted,
    success: overrides.success ?? defaultPalette.success,
    warning: overrides.warning ?? defaultPalette.warning,
  };
  const base = defaultStyles(palette);
  const field = overrides.field ?? {};
  const focused = field.focused ?? {};
  const button = overrides.button ?? {};
  const card = overrides.card ?? {};
  return {
    ...palette,
    heading: mergeTextStyle(base.heading, overrides.heading),
    subtext: mergeTextStyle(base.subtext, overrides.subtext),
    focusRing: mergeTextStyle(base.focusRing, overrides.focusRing),
    field: {
      box: mergeBoxStyle(base.field.box, field.box),
      text: mergeTextStyle(base.field.text, field.text),
      placeholder: mergeTextStyle(base.field.placeholder, field.placeholder),
      focused: {
        box: mergeBoxStyle(base.field.focused.box, focused.box),
        text: mergeTextStyle(base.field.focused.text, focused.text),
      },
    },
    button: {
      primary: mergeTextStyle(base.button.primary, button.primary),
      secondary: mergeTextStyle(base.button.secondary, button.secondary),
      tertiary: mergeTextStyle(base.button.tertiary, button.tertiary),
      destructive: mergeTextStyle(base.button.destructive, button.destructive),
      focused: mergeTextStyle(base.button.focused, button.focused),
      disabled: mergeTextStyle(base.button.disabled, button.disabled),
    },
    card: {
      card: mergeBoxStyle(base.card.card, card.card),
      sunk: mergeBoxStyle(base.card.sunk, card.sunk),
      clear: mergeBoxStyle(base.card.clear, card.clear),
    },
  };
}

/** The box and text of a field for its focus state: the focused slot merged over the base. */
export function fieldStyles(theme: InkTheme, isFocused: boolean): FieldFocusTheme {
  if (!isFocused) return { box: theme.field.box, text: theme.field.text };
  return {
    box: mergeBoxStyle(theme.field.box, theme.field.focused.box),
    text: mergeTextStyle(theme.field.text, theme.field.focused.text),
  };
}

export const ThemeContext = createContext<InkTheme>(defaultTheme);

export function useTheme(): InkTheme {
  return useContext(ThemeContext);
}
