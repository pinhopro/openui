import { Box, Text, useInput } from "ink";
import { useIsStreaming } from "../context";
import { useStyleAs } from "../design/design-system-context";
import { useFocusable } from "../focus/use-focusable";
import { textProps } from "../theme-styles";
import { isPressKey } from "./button-keys";

export interface DialogButtonProps {
  label: string;
  /** The style classes besides `Button`: the dialog's variant and `cancel` or `confirm`. */
  classes: string[];
  /** The label's color when the stylesheet sets none; undefined for the default. */
  color: string | undefined;
  /** The button's order among the dialog's stops. */
  order: number;
  onPress: () => void;
}

/** One of a dialog's buttons: a focus stop pressed with Enter, Space or a click. */
export function DialogButton({ label, classes, color, order, onPress }: DialogButtonProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: label,
    hoverFocus: true,
    order,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) onPress();
      },
    },
  });
  const states: string[] = [];
  if (focusable.isFocused) states.push("focus");
  if (focusable.isHovered) states.push("hover");
  if (focusable.isPressed) states.push("pressed");
  if (isStreaming) states.push("disabled");
  // Styled as a Button under the dialog, so `Button:focus` and `ModalDialog Button.confirm` apply.
  const style = useStyleAs("Button", classes, states);
  useInput(
    function handleKey(input, key) {
      if (isPressKey(input, key)) onPress();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  return (
    <Box ref={focusable.ref} backgroundColor={style.box.background}>
      <Text {...textProps(style.text)} color={style.text.color ?? color}>
        [ {label} ]
      </Text>
    </Box>
  );
}
