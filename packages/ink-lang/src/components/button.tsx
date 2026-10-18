import type { ActionPlan } from "@openuidev/lang-core";
import { Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { buttonTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { useFormValidation } from "../form-validation-context";
import { defineComponent, type ComponentRenderProps } from "../library";
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

  useInput(
    function handleButtonKey(input, key) {
      if (!isPressKey(input, key)) return;
      const action = props.action as unknown as ActionPlan | null | undefined;
      // Like the React default library: primary buttons validate the form first.
      if (formValidation !== null && variant === "primary" && buttonNeedsValidation(action)) {
        if (!formValidation.validateForm()) return;
      }
      void triggerAction(label, formName, action);
    },
    { isActive: canPress },
  );

  const style = buttonTextStyle(
    focusable.isFocused,
    isStreaming,
    props.variant,
    props.type,
    theme.danger,
  );
  return (
    <Text inverse={style.inverse} bold={style.bold} dimColor={style.dimColor} color={style.color}>
      [ {label} ]
    </Text>
  );
}

export const Button = defineComponent({
  name: "Button",
  props: ButtonSchema,
  description: "Clickable button",
  component: ButtonRenderer,
});
