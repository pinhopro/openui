import type { ActionPlan } from "@openuidev/lang-core";
import { Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { buttonTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ButtonSchema } from "../schemas/button-schema";
import { useTheme } from "../theme";
import { isPressKey } from "./button-keys";

type ButtonProps = z.infer<typeof ButtonSchema>;

function ButtonRenderer({ props }: ComponentRenderProps<ButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({ isActive: !isStreaming });
  const canPress = focusable.isFocused && !isStreaming;
  const label = props.label === null || props.label === undefined ? "" : String(props.label);

  useInput(
    function handleButtonKey(input, key) {
      if (!isPressKey(input, key)) return;
      const action = props.action as unknown as ActionPlan | null | undefined;
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
