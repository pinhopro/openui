import { applyDeclaration, type ComputedStyle, type CssVariables } from "./declarations";
import { matches, specificity, type StyleQuery } from "./selector";
import type { StyleRule } from "./stylesheet-parser";

interface Match {
  rule: StyleRule;
  specificity: number;
}

function compareMatches(a: Match, b: Match): number {
  if (a.specificity !== b.specificity) return a.specificity - b.specificity;
  return a.rule.order - b.rule.order;
}

/** A style with nothing set. */
export function emptyStyle(): ComputedStyle {
  return {
    box: {},
    text: {},
    transform: "none",
    align: undefined,
    gap: undefined,
    marginX: undefined,
    marginY: undefined,
    width: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    height: undefined,
    minHeight: undefined,
    fontSize: undefined,
    fontFamily: undefined,
  };
}

/**
 * The style of a query: every rule with a selector that matches, applied in
 * ascending specificity and then stylesheet order, so the most specific and
 * the latest declarations win, like a CSS cascade without `!important`.
 */
export function computeStyle(
  rules: StyleRule[],
  query: StyleQuery,
  variables: CssVariables,
): ComputedStyle {
  const found: Match[] = [];
  for (const rule of rules) {
    let best = -1;
    for (const selector of rule.selectors) {
      if (!matches(selector, query)) continue;
      const score = specificity(selector);
      if (score > best) best = score;
    }
    if (best >= 0) found.push({ rule, specificity: best });
  }
  found.sort(compareMatches);
  const style = emptyStyle();
  for (const match of found) {
    for (const declaration of match.rule.declarations) {
      applyDeclaration(style, declaration.property, declaration.value, variables);
    }
  }
  return style;
}
