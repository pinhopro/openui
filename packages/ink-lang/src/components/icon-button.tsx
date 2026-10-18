import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { buttonTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { IconButtonSchema } from "../schemas/icon-button-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
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
  const name = displayText(props.name);

  function press(): void {
    void triggerAction(name, formName, props.action as unknown as ActionPlan | null | undefined);
  }

  const focusable = useFocusable({
    isActive: !isStreaming,
    name,
    hoverFocus: true,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) press();
      },
    },
  });

  useInput(
    function handleIconButtonKey(input, key) {
      if (isPressKey(input, key)) press();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const style = textProps(
    buttonTextStyle(focusable.isFocused, isStreaming, props.variant, undefined, theme.button),
  );
  const icon = iconText(props.icon);
  const label = icon === "" ? name : icon + " " + name;
  return (
    <Box>
      <Box ref={focusable.ref}>
        <Text {...style}>[ {label} ]</Text>
      </Box>
    </Box>
  );
}

export const IconButton = defineComponent({
  name: "IconButton",
  props: IconButtonSchema,
  description:
    "Icon-only button. name is the accessible label and the action label; icon is an Icon; action fires on click.",
  component: IconButtonRenderer,
});
