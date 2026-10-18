import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { buttonTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { useFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ButtonSchema } from "../schemas/button-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { isPressKey } from "./button-keys";
import { buttonNeedsValidation } from "./button-validation";

type ButtonProps = z.infer<typeof ButtonSchema>;

function ButtonRenderer({ props }: ComponentRenderProps<ButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const formValidation = useFormValidation();
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const label = props.label === null || props.label === undefined ? "" : String(props.label);
  const variant = props.variant ?? "primary";
  // A click presses the button like Enter; hovering focuses it, so the focus
  // ring doubles as the hover style. Both are off while streaming.
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: label,
    hoverFocus: true,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) press();
      },
    },
  });
  const canPress = focusable.isFocused && !isStreaming;

  function press(): void {
    const action = props.action as unknown as ActionPlan | null | undefined;
    // Like the React default library: primary buttons validate the form first.
    if (formValidation !== null && variant === "primary" && buttonNeedsValidation(action)) {
      if (!formValidation.validateForm()) return;
    }
    void triggerAction(label, formName, action);
  }

  useInput(
    function handleButtonKey(input, key) {
      if (isPressKey(input, key)) press();
    },
    { isActive: canPress },
  );

  const style = textProps(
    buttonTextStyle(focusable.isFocused, isStreaming, props.variant, props.type, theme.button),
  );
  // The outer box follows the parent's alignment; the inner one hugs the
  // label so a click on blank space to its right does not press the button.
  return (
    <Box>
      <Box ref={focusable.ref}>
        <Text {...style}>[ {label} ]</Text>
      </Box>
    </Box>
  );
}

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "Clickable button",
  component: ButtonRenderer,
});
