import { fieldStyles, useTheme } from "./theme";
import { boxProps, textProps, type InkBoxProps, type InkTextProps } from "./theme-styles";

/** The Ink props a text field draws with, for its focus state. */
export interface FieldInkStyles {
  box: InkBoxProps;
  text: InkTextProps;
  placeholder: InkTextProps;
}

/** The theme's field slot resolved for `isFocused`, as Ink props. */
export function useFieldStyles(isFocused: boolean): FieldInkStyles {
  const theme = useTheme();
  const styles = fieldStyles(theme, isFocused);
  return {
    box: boxProps(styles.box),
    text: textProps(styles.text),
    placeholder: textProps(theme.field.placeholder),
  };
}
