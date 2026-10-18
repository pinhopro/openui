import { useComponentStyle } from "./design/design-system-context";
import { boxProps, textProps, type InkBoxProps, type InkTextProps } from "./theme-styles";

/** The Ink props a text field draws with, for its focus state. */
export interface FieldInkStyles {
  box: InkBoxProps;
  text: InkTextProps;
  placeholder: InkTextProps;
}

/**
 * The field's style from the cascade for its focus state, as Ink props: the
 * component's own rules (`Input`, `Input:focus`, `Table td Input`) and its
 * `::placeholder` part.
 */
export function useFieldStyles(isFocused: boolean, disabled = false): FieldInkStyles {
  const states: string[] = [];
  if (isFocused) states.push("focus");
  if (disabled) states.push("disabled");
  const own = useComponentStyle([], states);
  const placeholder = useComponentStyle(["placeholder"], states);
  return {
    box: boxProps(own.box),
    text: textProps(own.text),
    placeholder: textProps(placeholder.text),
  };
}
