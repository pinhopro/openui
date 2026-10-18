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
): ButtonTextStyle {
  const bold = variant === undefined || variant === "primary";
  const color = type === "destructive" ? "red" : undefined;
  if (disabled) return { inverse: false, bold, dimColor: true, color };
  return { inverse: isFocused, bold, dimColor: false, color };
}
