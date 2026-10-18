import type { BorderStyleName, BoxStyle, TextStyle, UnderlineStyle } from "../theme-styles";
import type { TextTransform } from "./tokens";

export type TextAlign = "left" | "center" | "right";

/** The style a component ends up with: its box, its text and the layout values. */
export interface ComputedStyle {
  box: BoxStyle;
  text: TextStyle;
  transform: TextTransform;
  align: TextAlign | undefined;
  gap: number | undefined;
  marginX: number | undefined;
  marginY: number | undefined;
  width: number | undefined;
  minWidth: number | undefined;
  maxWidth: number | undefined;
  height: number | undefined;
  minHeight: number | undefined;
  /** Kitty text sizing scale (1 is normal); other terminals fall back to bold. */
  fontSize: number | undefined;
  /** A hint for terminals that take OSC 50; most ignore it. */
  fontFamily: string | undefined;
}

export type CssVariables = Record<string, string>;

const CELLS_PER_REM = 2;
const PIXELS_PER_CELL = 8;
const PIXELS_PER_FONT_STEP = 16;
const MAX_FONT_SCALE = 7;

/** `var(--name, fallback)` resolved against the variables; anything else as written. */
export function resolveValue(value: string, variables: CssVariables): string {
  const match = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)$/.exec(value.trim());
  if (match === null) return value.trim();
  const found = variables[match[1] as string];
  if (found !== undefined) return found;
  return match[2] === undefined ? "" : resolveValue(match[2], variables);
}

/** A length in cells: `2`, `2ch`, `16px` (8 per cell), `1rem` (2 cells); null when unreadable. */
export function parseLength(value: string): number | null {
  const match = /^(-?\d+(?:\.\d+)?)(px|ch|em|rem)?$/.exec(value.trim());
  if (match === null) return null;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === "px") return Math.round(amount / PIXELS_PER_CELL);
  if (unit === "rem" || unit === "em") return Math.round(amount * CELLS_PER_REM);
  return Math.round(amount);
}

const FONT_KEYWORDS: Record<string, number> = {
  "xx-small": 1,
  "x-small": 1,
  small: 1,
  medium: 1,
  large: 2,
  "x-large": 3,
  "xx-large": 4,
  "xxx-large": 5,
};

/** A font scale: `2em`, `48px` (16 per step), `x-large`...; null when unreadable. */
export function parseFontScale(value: string): number | null {
  const keyword = FONT_KEYWORDS[value];
  if (keyword !== undefined) return keyword;
  const match = /^(\d+(?:\.\d+)?)(px|em|rem)?$/.exec(value.trim());
  if (match === null) return null;
  const amount = Number(match[1]);
  const scale = match[2] === "px" ? amount / PIXELS_PER_FONT_STEP : amount;
  return Math.min(MAX_FONT_SCALE, Math.max(1, Math.round(scale)));
}

function borderStyleFor(word: string): BorderStyleName | null {
  if (word === "none" || word === "hidden") return "none";
  if (word === "solid" || word === "single") return "single";
  if (word === "double") return "double";
  if (word === "round" || word === "rounded") return "round";
  if (word === "bold" || word === "thick") return "bold";
  if (word === "dashed" || word === "dotted" || word === "classic") return "classic";
  return null;
}

function underlineStyleFor(word: string): UnderlineStyle | null {
  if (word === "solid") return "single";
  if (word === "double") return "double";
  if (word === "wavy") return "curly";
  if (word === "dotted") return "dotted";
  if (word === "dashed") return "dashed";
  return null;
}

/** Applies a color word to a text style: `dim` and `inverse` are attributes, empty clears. */
function applyTextColor(text: TextStyle, value: string): void {
  if (value === "" || value === "inherit" || value === "unset" || value === "transparent") {
    delete text.color;
    return;
  }
  if (value === "dim") {
    delete text.color;
    text.dim = true;
    return;
  }
  if (value === "inverse") {
    delete text.color;
    text.inverse = true;
    return;
  }
  text.color = value;
}

function applyBorderColor(box: BoxStyle, value: string): void {
  if (value === "" || value === "inherit" || value === "unset") {
    delete box.borderColor;
    delete box.borderDim;
    return;
  }
  if (value === "dim") {
    box.borderDim = true;
    delete box.borderColor;
    return;
  }
  box.borderColor = value;
  delete box.borderDim;
}

function applyBackground(style: ComputedStyle, value: string): void {
  if (value === "" || value === "transparent" || value === "none" || value === "unset") {
    delete style.box.background;
    delete style.text.background;
    return;
  }
  style.box.background = value;
  style.text.background = value;
}

function applyBorderShorthand(box: BoxStyle, value: string): boolean {
  let sawStyle = false;
  for (const word of value.split(/\s+/)) {
    if (word === "") continue;
    const style = borderStyleFor(word);
    if (style !== null) {
      box.border = style;
      sawStyle = true;
      continue;
    }
    if (parseLength(word) !== null) continue;
    applyBorderColor(box, word);
  }
  return sawStyle;
}

interface Sides {
  vertical: number;
  horizontal: number;
}

/** `1`, `1 2` (vertical horizontal) or the four-value form, in cells; null when unreadable. */
function parseSides(value: string): Sides | null {
  const parts: number[] = [];
  for (const word of value.split(/\s+/)) {
    if (word === "") continue;
    const length = parseLength(word);
    if (length === null) return null;
    parts.push(length);
  }
  if (parts.length === 0) return null;
  const vertical = parts[0] as number;
  const horizontal = parts.length > 1 ? (parts[1] as number) : vertical;
  return { vertical, horizontal };
}

function applyWeight(text: TextStyle, value: string): boolean {
  if (value === "bold" || value === "bolder") {
    text.bold = true;
    return true;
  }
  if (value === "normal" || value === "lighter") {
    text.bold = false;
    return true;
  }
  const weight = Number(value);
  if (!Number.isFinite(weight)) return false;
  text.bold = weight >= 600;
  return true;
}

/** `underline`, `line-through`, `none`, plus an optional style and color word. */
function applyDecoration(text: TextStyle, value: string): void {
  const words = value.split(/\s+/);
  text.underline = words.includes("underline");
  text.strikethrough = words.includes("line-through");
  for (const word of words) {
    if (word === "underline" || word === "line-through" || word === "none" || word === "") continue;
    const style = underlineStyleFor(word);
    if (style !== null) {
      text.underlineStyle = style;
      continue;
    }
    text.underlineColor = word;
  }
}

function applyFilter(text: TextStyle, value: string): void {
  const match = /invert\(\s*([\d.]+)(%?)\s*\)/.exec(value);
  if (match === null) {
    text.inverse = false;
    return;
  }
  const amount = Number(match[1]) / (match[2] === "%" ? 100 : 1);
  text.inverse = amount >= 0.5;
}

const HORIZONTAL_PADDING = ["padding-x", "padding-inline", "padding-left", "padding-right"];
const VERTICAL_PADDING = ["padding-y", "padding-block", "padding-top", "padding-bottom"];
const HORIZONTAL_MARGIN = ["margin-x", "margin-inline", "margin-left", "margin-right"];
const VERTICAL_MARGIN = ["margin-y", "margin-block", "margin-top", "margin-bottom"];

type LengthKey =
  "gap" | "marginX" | "marginY" | "width" | "minWidth" | "maxWidth" | "height" | "minHeight";

function unreadable(name: string, value: string): string {
  return `${name}: cannot read "${value}"`;
}

function applyLength(
  style: ComputedStyle,
  key: LengthKey,
  name: string,
  value: string,
): string | null {
  const length = parseLength(value);
  if (length === null) return unreadable(name, value);
  style[key] = length;
  return null;
}

/**
 * Applies one declaration of the CSS subset to a computed style. Returns an
 * error line for a property it does not know or a value it cannot read.
 */
export function applyDeclaration(
  style: ComputedStyle,
  property: string,
  rawValue: string,
  variables: CssVariables,
): string | null {
  const value = resolveValue(rawValue, variables);
  const name = property.toLowerCase();
  if (name === "color") {
    applyTextColor(style.text, value);
    return null;
  }
  if (name === "background-color" || name === "background") {
    applyBackground(style, value);
    return null;
  }
  // A terminal has no room outside the box, so an outline draws as the border.
  if (name === "border-style" || name === "outline-style") {
    const border = borderStyleFor(value);
    if (border === null) return unreadable(name, value);
    style.box.border = border;
    return null;
  }
  if (name === "border-color" || name === "outline-color") {
    applyBorderColor(style.box, value);
    return null;
  }
  if (name === "border" || name === "outline") {
    if (!applyBorderShorthand(style.box, value)) return unreadable(name, value);
    return null;
  }
  if (name === "border-width" || name === "outline-width") {
    if (parseLength(value) === null) return unreadable(name, value);
    return null;
  }
  if (name === "border-radius") {
    const radius = parseLength(value);
    if (radius === null) return unreadable(name, value);
    if (style.box.border === "single" && radius > 0) style.box.border = "round";
    if (style.box.border === "round" && radius <= 0) style.box.border = "single";
    return null;
  }
  if (name === "padding") {
    const sides = parseSides(value);
    if (sides === null) return unreadable(name, value);
    style.box.paddingY = sides.vertical;
    style.box.paddingX = sides.horizontal;
    return null;
  }
  if (HORIZONTAL_PADDING.includes(name) || VERTICAL_PADDING.includes(name)) {
    const length = parseLength(value);
    if (length === null) return unreadable(name, value);
    if (HORIZONTAL_PADDING.includes(name)) style.box.paddingX = length;
    else style.box.paddingY = length;
    return null;
  }
  if (name === "margin") {
    const sides = parseSides(value);
    if (sides === null) return unreadable(name, value);
    style.marginY = sides.vertical;
    style.marginX = sides.horizontal;
    return null;
  }
  if (HORIZONTAL_MARGIN.includes(name)) return applyLength(style, "marginX", name, value);
  if (VERTICAL_MARGIN.includes(name)) return applyLength(style, "marginY", name, value);
  if (name === "gap") {
    if (value === "") return null;
    return applyLength(style, "gap", name, value);
  }
  if (name === "width") return applyLength(style, "width", name, value);
  if (name === "min-width") return applyLength(style, "minWidth", name, value);
  if (name === "max-width") return applyLength(style, "maxWidth", name, value);
  if (name === "height") return applyLength(style, "height", name, value);
  if (name === "min-height") return applyLength(style, "minHeight", name, value);
  if (name === "text-align") {
    if (value === "left" || value === "start") style.align = "left";
    else if (value === "center") style.align = "center";
    else if (value === "right" || value === "end") style.align = "right";
    else return unreadable(name, value);
    return null;
  }
  if (name === "font-weight") {
    if (!applyWeight(style.text, value)) return unreadable(name, value);
    return null;
  }
  if (name === "font-style") {
    style.text.italic = value === "italic" || value === "oblique";
    return null;
  }
  if (name === "font-size") {
    const scale = parseFontScale(value);
    if (scale === null) return unreadable(name, value);
    style.fontSize = scale;
    return null;
  }
  if (name === "font-family") {
    const first = value.split(",")[0] ?? "";
    style.fontFamily = first.trim().replace(/^["']|["']$/g, "");
    return null;
  }
  if (name === "text-decoration" || name === "text-decoration-line") {
    applyDecoration(style.text, value);
    return null;
  }
  if (name === "text-decoration-style") {
    const underline = underlineStyleFor(value);
    if (underline === null) return unreadable(name, value);
    style.text.underlineStyle = underline;
    return null;
  }
  if (name === "text-decoration-color") {
    style.text.underlineColor = value;
    return null;
  }
  if (name === "text-transform") {
    if (value !== "none" && value !== "uppercase" && value !== "lowercase") {
      return unreadable(name, value);
    }
    style.transform = value;
    return null;
  }
  if (name === "opacity") {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return unreadable(name, value);
    style.text.dim = amount < 1;
    return null;
  }
  if (name === "filter") {
    applyFilter(style.text, value);
    return null;
  }
  return `${name}: unknown property`;
}
