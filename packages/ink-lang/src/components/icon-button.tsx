import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { useComponentStyle } from "../design/design-system-context";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { IconButtonSchema } from "../schemas/icon-button-schema";
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

  const states: string[] = [];
  if (focusable.isFocused) states.push("focus");
  if (focusable.isHovered) states.push("hover");
  if (focusable.isPressed) states.push("pressed");
  if (isStreaming) states.push("disabled");
  const computed = useComponentStyle([props.variant ?? "primary"], states);
  const style = textProps(computed.text);
  const icon = iconText(props.icon);
  const label = icon === "" ? name : icon + " " + name;
  return (
    <Box>
      <Box ref={focusable.ref} backgroundColor={computed.box.background}>
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
