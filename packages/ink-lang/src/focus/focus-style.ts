import type { ButtonTheme } from "../theme";
import { mergeTextStyle, type TextStyle } from "../theme-styles";

/**
 * The text style of a button for its state: the variant's style, the
 * destructive style over it for that type, then the disabled or focused
 * style on top (a disabled button never shows the focus ring).
 */
export function buttonTextStyle(
  isFocused: boolean,
  disabled: boolean,
  variant: string | undefined,
  type: string | undefined,
  theme: ButtonTheme,
): TextStyle {
  let style: TextStyle;
  if (variant === "secondary") style = theme.secondary;
  else if (variant === "tertiary") style = theme.tertiary;
  else style = theme.primary;
  if (type === "destructive") style = mergeTextStyle(style, theme.destructive);
  if (disabled) return mergeTextStyle(style, theme.disabled);
  if (isFocused) return mergeTextStyle(style, theme.focused);
  return style;
}

/**
 * The text style of a pager control (`[ prev ]`, `[ next ]`): the secondary
 * style, dim when disabled. Unlike a button it keeps the focus ring while
 * disabled, so Tab never lands on an invisible control at the end of a table.
 */
export function pagerTextStyle(
  isFocused: boolean,
  disabled: boolean,
  theme: ButtonTheme,
): TextStyle {
  let style = theme.secondary;
  if (disabled) style = mergeTextStyle(style, theme.disabled);
  if (isFocused) style = mergeTextStyle(style, theme.focused);
  return style;
}
