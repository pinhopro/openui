import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef } from "react";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { buttonTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { useFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { ButtonSchema } from "../schemas/button-schema";
import { useTheme } from "../theme";
import { isPressKey } from "./button-keys";
import { buttonNeedsValidation } from "./button-validation";

type ButtonProps = z.infer<typeof ButtonSchema>;

function ButtonRenderer({ props }: ComponentRenderProps<ButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const formValidation = useFormValidation();
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({ isActive: !isStreaming });
  const canPress = focusable.isFocused && !isStreaming;
  const label = props.label === null || props.label === undefined ? "" : String(props.label);
  const variant = props.variant ?? "primary";
  const boxRef = useRef<DOMElement | null>(null);

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

  // A click presses the button like Enter; hovering focuses it, so the focus
  // ring doubles as the hover style. Both are off while streaming.
  useMouse(boxRef, {
    onClick: function handleClick() {
      if (isStreaming) return;
      focusable.focus();
      press();
    },
    onMouseEnter: function handleEnter() {
      if (!isStreaming) focusable.focus();
    },
  });

  const style = buttonTextStyle(
    focusable.isFocused,
    isStreaming,
    props.variant,
    props.type,
    theme.danger,
  );
  // The outer box follows the parent's alignment; the inner one hugs the
  // label so a click on blank space to its right does not press the button.
  return (
    <Box>
      <Box ref={boxRef}>
        <Text
          inverse={style.inverse}
          bold={style.bold}
          dimColor={style.dimColor}
          color={style.color}
        >
          [ {label} ]
        </Text>
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
