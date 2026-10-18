import { Box, Text, useFocusManager, type DOMElement } from "ink";
import { useContext, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useComponentStyle } from "../design/design-system-context";
import { FocusRegistryContext } from "../focus/focus-registry";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TooltipSchema } from "../schemas/tooltip-schema";
import { boxProps, textProps } from "../theme-styles";
import { displayText } from "./pad";

type TooltipProps = z.infer<typeof TooltipSchema>;

/** True when `element` is `ancestor` or sits inside it. */
function isInside(element: DOMElement | null, ancestor: DOMElement | null): boolean {
  if (ancestor === null) return false;
  let current: DOMElement | undefined = element ?? undefined;
  while (current !== undefined) {
    if (current === ancestor) return true;
    current = current.parentNode;
  }
  return false;
}

/**
 * A trigger with an explanation that shows while the trigger has focus (its
 * own focus stop, or a focusable inside it) or the pointer is over it. The
 * bubble sits above, below, left or right of the trigger; `.bubble` and the
 * variant class (`Tooltip.light .bubble`) address it in the stylesheet.
 */
function TooltipRenderer({ props, renderNode }: ComponentRenderProps<TooltipProps>) {
  const isStreaming = useIsStreaming();
  const text = displayText(props.text);
  const placement = props.placement ?? "bottom";
  const variant = props.variant ?? "dark";
  const focusable = useFocusable({ isActive: !isStreaming, name: text });
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();
  const bubble = useComponentStyle([variant, "bubble"]);
  const activeEntry =
    registry === null || manager.activeId === undefined ? null : registry.find(manager.activeId);
  const focusWithin =
    activeEntry !== null && isInside(activeEntry.ref.current, focusable.ref.current);
  const isOpen = focusable.isFocused || focusWithin || focusable.isHovered;

  const trigger = <Box>{renderNode(props.trigger)}</Box>;
  if (!isOpen || text === "") return <Box ref={focusable.ref}>{trigger}</Box>;

  const box = boxProps(bubble.box);
  const isVertical = placement === "top" || placement === "bottom";
  // Above or below, the bubble is a small bordered box; beside the trigger it
  // stays on the trigger's line as an arrowed label, so the row keeps one height.
  const bubbleNode: ReactNode = isVertical ? (
    <Box
      borderStyle={box.borderStyle ?? "round"}
      borderColor={box.borderColor}
      borderDimColor={box.borderDimColor ?? variant === "dark"}
      backgroundColor={box.backgroundColor}
      paddingX={box.paddingX ?? 1}
    >
      <Text {...textProps(bubble.text)}>{text}</Text>
    </Box>
  ) : (
    <Box backgroundColor={box.backgroundColor}>
      <Text {...textProps(bubble.text)} dimColor={bubble.text.dim ?? variant === "dark"}>
        {placement === "right" ? "◂ " + text : text + " ▸"}
      </Text>
    </Box>
  );
  const first = placement === "top" || placement === "left" ? bubbleNode : trigger;
  const second = placement === "top" || placement === "left" ? trigger : bubbleNode;
  return (
    <Box ref={focusable.ref} flexDirection={isVertical ? "column" : "row"} gap={isVertical ? 0 : 1}>
      {first}
      {second}
    </Box>
  );
}

export const Tooltip = defineComponent({
  name: "Tooltip",
  props: TooltipSchema,
  description:
    'A short explanation shown beside its trigger while the trigger is focused or hovered. placement: "top" | "bottom" (default) | "left" | "right"; variant: "dark" (default) | "light".',
  component: TooltipRenderer,
});
