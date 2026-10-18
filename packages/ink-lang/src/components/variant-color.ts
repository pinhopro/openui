import type { InkTheme } from "../theme";

/**
 * The theme color of a semantic variant shared by Tag, Callout, TextCallout and
 * the icon badges: info is the accent, error and danger the danger color,
 * neutral the muted color; anything unknown has no color.
 */
export function variantColor(variant: unknown, theme: InkTheme): string | undefined {
  if (variant === "info") return theme.accent;
  if (variant === "success") return theme.success;
  if (variant === "warning") return theme.warning;
  if (variant === "error" || variant === "danger") return theme.danger;
  if (variant === "neutral") return theme.muted;
  return undefined;
}
