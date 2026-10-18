import type { ActionPlan } from "@openuidev/lang-core";
import { Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { buttonTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { IconButtonSchema } from "../schemas/icon-button-schema";
import { useTheme } from "../theme";
import { isPressKey } from "./button-keys";
import { iconText } from "./icon";
import { displayText } from "./pad";

type IconButtonProps = z.infer<typeof IconButtonSchema>;

/** `[ <icon> name ]`: the icon has no glyph in a terminal, so the accessible name shows too. */
function IconButtonRenderer({ props }: ComponentRenderProps<IconButtonProps>) {
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({ isActive: !isStreaming });
  const name = displayText(props.name);

  useInput(
    function handleIconButtonKey(input, key) {
      if (!isPressKey(input, key)) return;
      void triggerAction(name, formName, props.action as unknown as ActionPlan | null | undefined);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const style = buttonTextStyle(
    focusable.isFocused,
    isStreaming,
    props.variant,
    undefined,
    theme.danger,
  );
  const icon = iconText(props.icon);
  const label = icon === "" ? name : icon + " " + name;
  return (
    <Text inverse={style.inverse} bold={style.bold} dimColor={style.dimColor}>
      [ {label} ]
    </Text>
  );
}

export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description:
    "Icon-only button. name is the accessible label and the action label; icon is an Icon; action fires on click.",
  component: IconButtonRenderer,
});
