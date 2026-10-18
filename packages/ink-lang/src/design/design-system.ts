import type { InkTheme } from "../theme";
import type { BoxStyle, TextStyle } from "../theme-styles";
import { computeStyle } from "./cascade";
import type { EnvironmentLike } from "./color-scheme";
import { tokensToCssVariables } from "./css-variables";
import type { ComputedStyle, CssVariables } from "./declarations";
import { defaultStylesheet } from "./default-stylesheet";
import type { StyleQuery } from "./selector";
import { parseStylesheet, type StyleRule } from "./stylesheet-parser";
import { resolveTokens, type ColorModeInput, type DesignTokens, type TokenInput } from "./tokens";

/** What a host passes as `designSystem`: tokens, a stylesheet of the CSS subset and a mode. */
export interface DesignSystemInput {
  tokens?: TokenInput;
  css?: string;
  /** `light`, `dark` or `system` (the terminal's background); overrides `tokens.mode`. */
  mode?: ColorModeInput;
}

/** A resolved design system: the tokens, their CSS variables, the cascade and the theme slots. */
export interface DesignSystem {
  tokens: DesignTokens;
  variables: CssVariables;
  rules: StyleRule[];
  /** Token and stylesheet problems, one line each; the rest still applies. */
  errors: string[];
  /** The style slots the components read, computed from the cascade. */
  theme: InkTheme;
  /** The computed style of any component part and state. */
  style: (query: StyleQuery) => ComputedStyle;
}

type StyleOf = (query: StyleQuery) => ComputedStyle;

function query(component: string, classes: string[] = [], states: string[] = []): StyleQuery {
  return { component, classes, states, ancestors: [] };
}

function textOf(
  style: StyleOf,
  component: string,
  classes: string[] = [],
  states: string[] = [],
): TextStyle {
  return style(query(component, classes, states)).text;
}

function boxOf(
  style: StyleOf,
  component: string,
  classes: string[] = [],
  states: string[] = [],
): BoxStyle {
  return style(query(component, classes, states)).box;
}

/** The theme slots implied by the cascade, so the components keep reading slots. */
function themeFromCascade(tokens: DesignTokens, style: StyleOf): InkTheme {
  const primitive = tokens.color.primitive;
  return {
    accent: primitive.primary[500],
    danger: primitive.error[500],
    muted: primitive.neutral[500],
    success: primitive.success[500],
    warning: primitive.warning[500],
    heading: textOf(style, "CardHeader", ["title"]),
    subtext: textOf(style, "CardHeader", ["subtitle"]),
    focusRing: textOf(style, "*", [], ["cursor"]),
    field: {
      box: boxOf(style, "Input"),
      text: textOf(style, "Input"),
      placeholder: textOf(style, "Input", ["placeholder"]),
      focused: {
        box: boxOf(style, "Input", [], ["focus"]),
        text: textOf(style, "Input", [], ["focus"]),
      },
    },
    button: {
      primary: textOf(style, "Button"),
      secondary: textOf(style, "Button", ["secondary"]),
      tertiary: textOf(style, "Button", ["tertiary"]),
      destructive: textOf(style, "Button", ["destructive"]),
      focused: textOf(style, "Button", [], ["focus"]),
      disabled: textOf(style, "Button", [], ["disabled"]),
    },
    card: {
      card: boxOf(style, "Card"),
      sunk: boxOf(style, "Card", ["sunk"]),
      clear: boxOf(style, "Card", ["clear"]),
    },
  };
}

/**
 * Resolves the tokens (with their light or dark block), generates the
 * default stylesheet from them, appends the host stylesheet and builds the
 * theme slots from the resulting cascade.
 */
export function createDesignSystem(
  input: DesignSystemInput,
  env: EnvironmentLike = process.env,
): DesignSystem {
  const tokenInput: TokenInput = { ...(input.tokens ?? {}) };
  if (input.mode !== undefined) tokenInput["mode"] = input.mode;
  const resolved = resolveTokens(tokenInput, env);
  const tokens = resolved.tokens;
  const variables = tokensToCssVariables(tokens);
  const base = parseStylesheet(defaultStylesheet(tokens));
  const host = parseStylesheet(input.css ?? "");
  const rules: StyleRule[] = base.rules.slice();
  for (const hostRule of host.rules) {
    rules.push({ ...hostRule, order: hostRule.order + base.rules.length });
  }
  const errors = resolved.errors.concat(base.errors, host.errors);

  function style(target: StyleQuery): ComputedStyle {
    return computeStyle(rules, target, variables);
  }

  return { tokens, variables, rules, errors, theme: themeFromCascade(tokens, style), style };
}

/** The design system of the default tokens and no host stylesheet. */
export const defaultDesignSystem: DesignSystem = createDesignSystem({}, {});
