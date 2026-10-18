import { cssVariableName, walkLeaves } from "./token-paths";
import type { DesignTokens } from "./tokens";

/** Every token as a CSS custom property (`--color-primary-500: cyan`), values as strings. */
export function tokensToCssVariables(tokens: DesignTokens): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const leaf of walkLeaves(tokens)) {
    variables[cssVariableName(leaf.path)] = String(leaf.value);
  }
  return variables;
}
