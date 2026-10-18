/** The border a themed box draws; `none` draws no border at all. */
export type BorderStyleName = "none" | "single" | "double" | "round" | "bold" | "classic";

/** The CSS-like box part of a style slot: border, background and padding. */
export interface BoxStyle {
  border?: BorderStyleName;
  /** Any Ink color: a name (`cyan`), a hex value (`#38bdf8`) or `rgb(...)`. */
  borderColor?: string;
  borderDim?: boolean;
  background?: string;
  paddingX?: number;
  paddingY?: number;
}

/** How an underline is drawn where the terminal supports styled underlines (kitty, WezTerm, iTerm2, Ghostty). */
export type UnderlineStyle = "single" | "double" | "curly" | "dotted" | "dashed";

/** The CSS-like text part of a style slot. */
export interface TextStyle {
  color?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
  strikethrough?: boolean;
  underlineStyle?: UnderlineStyle;
  underlineColor?: string;
}

/** What `boxProps` hands to an Ink `Box`. */
export interface InkBoxProps {
  borderStyle: "single" | "double" | "round" | "bold" | "classic" | undefined;
  borderColor: string | undefined;
  borderDimColor: boolean | undefined;
  backgroundColor: string | undefined;
  paddingX: number | undefined;
  paddingY: number | undefined;
}

/** What `textProps` hands to an Ink `Text`. */
export interface InkTextProps {
  color: string | undefined;
  backgroundColor: string | undefined;
  bold: boolean | undefined;
  dimColor: boolean | undefined;
  italic: boolean | undefined;
  underline: boolean | undefined;
  inverse: boolean | undefined;
  strikethrough: boolean | undefined;
}

/** `base` with every field `over` names replaced. */
export function mergeBoxStyle(base: BoxStyle, over: BoxStyle | undefined): BoxStyle {
  if (over === undefined) return { ...base };
  const merged: BoxStyle = { ...base };
  if (over.border !== undefined) merged.border = over.border;
  if (over.borderColor !== undefined) merged.borderColor = over.borderColor;
  if (over.borderDim !== undefined) merged.borderDim = over.borderDim;
  if (over.background !== undefined) merged.background = over.background;
  if (over.paddingX !== undefined) merged.paddingX = over.paddingX;
  if (over.paddingY !== undefined) merged.paddingY = over.paddingY;
  return merged;
}

/** `base` with every field `over` names replaced. */
export function mergeTextStyle(base: TextStyle, over: TextStyle | undefined): TextStyle {
  if (over === undefined) return { ...base };
  const merged: TextStyle = { ...base };
  if (over.color !== undefined) merged.color = over.color;
  if (over.background !== undefined) merged.background = over.background;
  if (over.bold !== undefined) merged.bold = over.bold;
  if (over.dim !== undefined) merged.dim = over.dim;
  if (over.italic !== undefined) merged.italic = over.italic;
  if (over.underline !== undefined) merged.underline = over.underline;
  if (over.inverse !== undefined) merged.inverse = over.inverse;
  if (over.strikethrough !== undefined) merged.strikethrough = over.strikethrough;
  if (over.underlineStyle !== undefined) merged.underlineStyle = over.underlineStyle;
  if (over.underlineColor !== undefined) merged.underlineColor = over.underlineColor;
  return merged;
}

/** The Ink `Box` props for a box style. */
export function boxProps(style: BoxStyle): InkBoxProps {
  return {
    borderStyle: style.border === undefined || style.border === "none" ? undefined : style.border,
    borderColor: style.borderColor,
    borderDimColor: style.borderDim,
    backgroundColor: style.background,
    paddingX: style.paddingX,
    paddingY: style.paddingY,
  };
}

/** The Ink `Text` props for a text style. */
export function textProps(style: TextStyle): InkTextProps {
  return {
    color: style.color,
    backgroundColor: style.background,
    bold: style.bold,
    dimColor: style.dim,
    italic: style.italic,
    underline: style.underline,
    inverse: style.inverse,
    strikethrough: style.strikethrough,
  };
}
