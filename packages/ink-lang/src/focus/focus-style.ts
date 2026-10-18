/** The Ink Text styles a Button takes from its focus and disabled state. */
export interface ButtonTextStyle {
  inverse: boolean;
  bold: boolean;
  dimColor: boolean;
  color: string | undefined;
}

/**
 * Focus ring for a button: inverse video when focused, dim when disabled,
 * bold for the primary variant, red for the destructive type.
 */
export function buttonTextStyle(
  isFocused: boolean,
  disabled: boolean,
  variant: string | undefined,
  type: string | undefined,
  dangerColor = "red",
): ButtonTextStyle {
  const bold = variant === undefined || variant === "primary";
  const color = type === "destructive" ? dangerColor : undefined;
  if (disabled) return { inverse: false, bold, dimColor: true, color };
  return { inverse: isFocused, bold, dimColor: false, color };
}

/**
 * Focus ring for a pager control (`[ prev ]`, `[ next ]`): inverse when focused,
 * dim when disabled. Unlike a button it keeps the ring while disabled, so Tab
 * never lands on an invisible control at the end of a table.
 */
export function pagerTextStyle(isFocused: boolean, disabled: boolean): ButtonTextStyle {
  return { inverse: isFocused, bold: false, dimColor: disabled, color: undefined };
}
