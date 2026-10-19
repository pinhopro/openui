import type { BorderStyleName } from "../theme-styles";
import { colorScale, type ColorScale } from "./color-scale";
import { detectColorScheme, type EnvironmentLike } from "./color-scheme";
import { cssVariableName, walkLeaves } from "./token-paths";

export type { ColorScale } from "./color-scale";

export type ColorMode = "light" | "dark";
export type ColorModeInput = ColorMode | "system";

export interface PrimitiveColors {
  primary: ColorScale;
  neutral: ColorScale;
  error: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  info: ColorScale;
  canvas: ColorScale;
}

export interface CanvasColors {
  app: string;
  surface: string;
  disabled: string;
  content: string;
}

export interface BorderColors {
  default: string;
  hover: string;
  focus: string;
  error: string;
  success: string;
  disabled: string;
}

export interface TextColors {
  value: string;
  label: string;
  helper: string;
  placeholder: string;
  action: string;
  disabled: string;
  error: string;
  success: string;
}

export interface StateColors {
  default: string;
  focus: string;
  hover: string;
  pressed: string;
  disabled: string;
}

export interface ButtonColors {
  background: StateColors;
  text: StateColors;
}

export interface IconColors {
  default: string;
  hover: string;
  pressed: string;
  disabled: string;
}

export interface SemanticColors {
  canvas: CanvasColors;
  border: BorderColors;
  text: TextColors;
  textBackground: TextColors;
  button: ButtonColors;
  icon: IconColors;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface Grid {
  /** Cards per row in grid layouts; 1 stacks them. */
  columns: number;
  /** Cells on each side of the root. */
  margin: number;
  /** Cells between grid cells. */
  gutter: number;
  /** Widest the root grows, in cells; 0 is unbounded. */
  containerMaxWidth: number;
}

export type FontWeight = "normal" | "bold";
export type TextTransform = "none" | "uppercase" | "lowercase";

export interface TypeStyle {
  weight: FontWeight;
  italic: boolean;
  underline: boolean;
  transform: TextTransform;
  /** A color, or an empty string for the terminal's default. */
  color: string;
}

export interface Typography {
  display: TypeStyle;
  h1: TypeStyle;
  h2: TypeStyle;
  h3: TypeStyle;
  h4: TypeStyle;
  h5: TypeStyle;
  h6: TypeStyle;
  body: TypeStyle;
  label: TypeStyle;
  helper: TypeStyle;
}

export interface Shape {
  fieldBorder: BorderStyleName;
  cardBorder: BorderStyleName;
}

/**
 * Every design token the renderer knows. Colors take any Ink value (a name,
 * `#hex`, `rgb(...)`), the keyword `dim` (dim text) or an empty string for
 * the terminal's own color. Spacing and grid are in cells.
 */
export interface DesignTokens {
  mode: ColorMode;
  color: {
    primitive: PrimitiveColors;
    semantic: SemanticColors;
  };
  spacing: Spacing;
  grid: Grid;
  typography: Typography;
  shape: Shape;
}

/** What a host or a program passes: nested objects, dotted paths or CSS variable names. */
export type TokenInput = Record<string, unknown>;

export interface ResolvedTokens {
  tokens: DesignTokens;
  /** One line per token that was unknown or had the wrong kind of value. */
  errors: string[];
  /**
   * The dotted paths the input set, in input order: a leaf
   * (`color.semantic.text.value`) or a whole primitive scale
   * (`color.primitive.primary`). Derived tokens are not listed.
   */
  assigned: string[];
}

const BORDER_STYLES: string[] = ["none", "single", "double", "round", "bold", "classic"];
const WEIGHTS: string[] = ["normal", "bold"];
const TRANSFORMS: string[] = ["none", "uppercase", "lowercase"];
const PRIMITIVES = ["primary", "neutral", "error", "success", "warning", "info", "canvas"];

function flat(color: string): ColorScale {
  return { 100: color, 300: color, 500: color, 700: color, 900: color };
}

function type(weight: FontWeight, extra?: Partial<TypeStyle>): TypeStyle {
  return { weight, italic: false, underline: false, transform: "none", color: "", ...extra };
}

/** The terminal-native defaults: ANSI names, no backgrounds, the look the renderer always had. */
export const defaultTokens: DesignTokens = {
  mode: "dark",
  color: {
    primitive: {
      primary: flat("cyan"),
      neutral: flat("gray"),
      error: flat("red"),
      success: flat("green"),
      warning: flat("yellow"),
      info: flat("blue"),
      canvas: flat(""),
    },
    semantic: {
      canvas: { app: "", surface: "", disabled: "", content: "" },
      border: {
        default: "",
        hover: "",
        focus: "cyan",
        error: "red",
        success: "green",
        disabled: "dim",
      },
      text: {
        value: "",
        label: "",
        helper: "dim",
        placeholder: "dim",
        action: "cyan",
        disabled: "dim",
        error: "red",
        success: "green",
      },
      textBackground: {
        value: "",
        label: "",
        helper: "",
        placeholder: "",
        action: "",
        disabled: "",
        error: "",
        success: "",
      },
      button: {
        background: { default: "", focus: "", hover: "", pressed: "", disabled: "" },
        text: { default: "", focus: "", hover: "", pressed: "", disabled: "dim" },
      },
      icon: { default: "", hover: "", pressed: "", disabled: "dim" },
    },
  },
  spacing: { xs: 0, sm: 1, md: 1, lg: 2, xl: 2 },
  grid: { columns: 1, margin: 0, gutter: 1, containerMaxWidth: 0 },
  typography: {
    display: type("bold"),
    h1: type("bold", { underline: true }),
    h2: type("bold"),
    h3: type("bold"),
    h4: type("bold", { color: "cyan" }),
    h5: type("bold"),
    h6: type("bold", { color: "dim" }),
    body: type("normal"),
    label: type("bold"),
    helper: type("normal", { color: "dim" }),
  },
  shape: { fieldBorder: "none", cardBorder: "round" },
};

function cloneTokens(): DesignTokens {
  return JSON.parse(JSON.stringify(defaultTokens)) as DesignTokens;
}

interface Assignment {
  path: string[];
  value: unknown;
}

/** The index of every known leaf by its CSS variable name and dotted name. */
function knownPaths(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const leaf of walkLeaves(defaultTokens)) {
    index.set(cssVariableName(leaf.path), leaf.path);
    index.set(leaf.path.join("."), leaf.path);
  }
  for (const primitive of PRIMITIVES) {
    const path = ["color", "primitive", primitive];
    index.set("--color-" + primitive, path);
    index.set("color.primitive." + primitive, path);
    index.set("color." + primitive, path);
  }
  return index;
}

const KNOWN = knownPaths();

/** The known path for a dotted name, trying the `semantic` and `primitive` shortcuts. */
function lookupDotted(name: string): string[] | null {
  const direct = KNOWN.get(name);
  if (direct !== undefined) return direct;
  const segments = name.split(".");
  if (segments[0] === "color" && segments.length > 1) {
    for (const group of ["semantic", "primitive"]) {
      const withGroup = KNOWN.get([segments[0], group].concat(segments.slice(1)).join("."));
      if (withGroup !== undefined) return withGroup;
    }
  }
  return null;
}

/** Every assignment an input holds, nested objects flattened to paths. */
function collectAssignments(input: TokenInput, prefix: string[], into: Assignment[]): void {
  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith("--")) {
      into.push({ path: [key], value });
      continue;
    }
    const segments = prefix.concat(key.split("."));
    const isScaleShortcut =
      segments.length === 3 && segments[0] === "color" && typeof value === "string";
    if (value !== null && typeof value === "object" && !Array.isArray(value) && !isScaleShortcut) {
      collectAssignments(value as TokenInput, segments, into);
      continue;
    }
    into.push({ path: segments, value });
  }
}

function enumFor(leafName: string, path: string[]): string[] | null {
  if (path[0] === "shape") return BORDER_STYLES;
  if (path[0] === "typography" && leafName === "weight") return WEIGHTS;
  if (path[0] === "typography" && leafName === "transform") return TRANSFORMS;
  return null;
}

function assign(tokens: DesignTokens, path: string[], value: unknown): string | null {
  const name = path.join(".");
  // A whole primitive scale from one color.
  if (path.length === 3 && path[0] === "color" && path[1] === "primitive") {
    if (typeof value !== "string") return `${name}: expected a color`;
    (tokens.color.primitive as unknown as Record<string, ColorScale>)[path[2] as string] =
      colorScale(value);
    return null;
  }
  let node: Record<string, unknown> = tokens as unknown as Record<string, unknown>;
  for (let index = 0; index < path.length - 1; index += 1) {
    const next = node[path[index] as string];
    if (next === null || typeof next !== "object") return `${name}: unknown token`;
    node = next as Record<string, unknown>;
  }
  const leafName = path[path.length - 1] as string;
  const current = node[leafName];
  if (current === undefined || typeof current === "object") return `${name}: unknown token`;
  const allowed = enumFor(leafName, path);
  if (allowed !== null) {
    if (typeof value !== "string" || !allowed.includes(value)) {
      return `${name}: expected one of ${allowed.join(", ")}`;
    }
    node[leafName] = value;
    return null;
  }
  if (typeof current === "number") {
    const parsed = typeof value === "string" ? Number(value) : value;
    if (typeof parsed !== "number" || !Number.isFinite(parsed)) return `${name}: expected a number`;
    node[leafName] = parsed;
    return null;
  }
  if (typeof current === "boolean") {
    if (typeof value !== "boolean") return `${name}: expected true or false`;
    node[leafName] = value;
    return null;
  }
  if (typeof value !== "string") return `${name}: expected a string`;
  node[leafName] = value;
  return null;
}

function applyInput(
  tokens: DesignTokens,
  input: TokenInput,
  errors: string[],
  assigned: Set<string>,
): void {
  const assignments: Assignment[] = [];
  collectAssignments(input, [], assignments);
  for (const assignment of assignments) {
    const first = assignment.path[0] as string;
    const path = first.startsWith("--")
      ? (KNOWN.get(first) ?? null)
      : lookupDotted(assignment.path.join("."));
    if (path === null) {
      errors.push(`${assignment.path.join(".")}: unknown token`);
      continue;
    }
    const error = assign(tokens, path, assignment.value);
    if (error !== null) errors.push(error);
    else assigned.add(path.join("."));
  }
}

/** Semantic tokens that follow a primitive stop unless the input sets them. */
const DERIVED: Array<[string, () => string[]]> = [
  ["color.semantic.text.action", () => ["primary", "500"]],
  ["color.semantic.text.error", () => ["error", "500"]],
  ["color.semantic.text.success", () => ["success", "500"]],
  ["color.semantic.border.focus", () => ["primary", "500"]],
  ["color.semantic.border.error", () => ["error", "500"]],
  ["color.semantic.border.success", () => ["success", "500"]],
  ["typography.h4.color", () => ["primary", "500"]],
];

function deriveSemantics(tokens: DesignTokens, assigned: Set<string>): void {
  const primitives = tokens.color.primitive as unknown as Record<string, Record<string, string>>;
  for (const [target, source] of DERIVED) {
    if (assigned.has(target)) continue;
    const [scale, stop] = source();
    const value = primitives[scale as string]?.[stop as string];
    if (value === undefined) continue;
    const path = target.split(".");
    let node: Record<string, unknown> = tokens as unknown as Record<string, unknown>;
    for (let index = 0; index < path.length - 1; index += 1) {
      node = node[path[index] as string] as Record<string, unknown>;
    }
    node[path[path.length - 1] as string] = value;
  }
}

function pickMode(input: TokenInput, env: EnvironmentLike): ColorMode {
  const mode = input["mode"];
  if (mode === "light" || mode === "dark") return mode;
  if (mode === "system") return detectColorScheme(env);
  return defaultTokens.mode;
}

/**
 * The defaults with `input` applied: nested objects, dotted paths
 * (`color.text.value`) and CSS variable names (`--color-text-value`) all
 * work, a primitive given as one color becomes a scale, and the `light` or
 * `dark` block matching `mode` (`system` asks the terminal) is applied last.
 */
export function resolveTokens(
  input: TokenInput,
  env: EnvironmentLike = process.env,
): ResolvedTokens {
  const tokens = cloneTokens();
  const errors: string[] = [];
  const mode = pickMode(input, env);
  tokens.mode = mode;
  const base: TokenInput = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "mode" || key === "light" || key === "dark") continue;
    base[key] = value;
  }
  const assigned = new Set<string>();
  applyInput(tokens, base, errors, assigned);
  const variant = input[mode];
  if (variant !== null && typeof variant === "object" && !Array.isArray(variant)) {
    applyInput(tokens, variant as TokenInput, errors, assigned);
  }
  deriveSemantics(tokens, assigned);
  return { tokens, errors, assigned: Array.from(assigned) };
}
