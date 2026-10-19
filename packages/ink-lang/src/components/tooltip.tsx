import { Box, Text, useFocusManager, type DOMElement } from "ink";
import { useContext, useEffect, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useComponentStyle } from "../design/design-system-context";
import { FocusRegistryContext } from "../focus/focus-registry";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useOverlay } from "../overlay/use-overlay";
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
 * A trigger with an explanation that shows while the trigger has focus or
 * the pointer is over it. A trigger that is a focus stop itself (a button)
 * keeps the Tab order as it is; a trigger that is not (an icon) makes the
 * tooltip the stop, so the keyboard can still reveal it. The bubble is a
 * small bordered box floating over the program above, below, left or right
 * of the trigger (flipped when that side has no room, a one-row label beside
 * the trigger when the program is too short for it), so opening it never
 * moves the layout; `.bubble` and the variant class (`Tooltip.light .bubble`)
 * address it in the stylesheet.
 */
function TooltipRenderer({ props, renderNode }: ComponentRenderProps<TooltipProps>) {
  const isStreaming = useIsStreaming();
  const text = displayText(props.text);
  const placement = props.placement ?? "bottom";
  const variant = props.variant ?? "dark";
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();
  const [hasStopInside, setHasStopInside] = useState(false);
  const focusable = useFocusable({ isActive: !isStreaming && !hasStopInside, name: text });

  // The trigger registers before this effect runs (children first), so the
  // registry already says whether a stop of its own sits inside the box.
  useEffect(function detectStopInside() {
    if (registry === null) return;
    let found = false;
    for (const entry of registry.entries()) {
      if (entry.ref === focusable.ref || !entry.isActive) continue;
      if (isInside(entry.ref.current, focusable.ref.current)) found = true;
    }
    setHasStopInside(found);
  });
  const bubble = useComponentStyle([variant, "bubble"]);
  const activeEntry =
    registry === null || manager.activeId === undefined ? null : registry.find(manager.activeId);
  const focusWithin =
    activeEntry !== null && isInside(activeEntry.ref.current, focusable.ref.current);
  const isOpen = focusable.isFocused || focusWithin || focusable.isHovered;

  // Everything the bubble needs is read here: the render functions call no hooks.
  const box = boxProps(bubble.box);
  const textStyle = textProps(bubble.text);
  function renderBubble(): ReactNode {
    return (
      <Box
        borderStyle={box.borderStyle ?? "round"}
        borderColor={box.borderColor}
        borderDimColor={box.borderDimColor ?? variant === "dark"}
        backgroundColor={box.backgroundColor}
        paddingX={box.paddingX ?? 1}
      >
        <Text {...textStyle}>{text}</Text>
      </Box>
    );
  }
  // Where the bordered bubble has no room (a program a row or two high), a
  // one-row label on the trigger's row says the same.
  function renderLabel(): ReactNode {
    return (
      <Box backgroundColor={box.backgroundColor} paddingX={1}>
        <Text {...textStyle} wrap="truncate">
          {text}
        </Text>
      </Box>
    );
  }
  useOverlay({
    kind: "tooltip",
    anchorRef: focusable.ref,
    placement,
    gap: placement === "left" || placement === "right" ? 1 : 0,
    isOpen: isOpen && text !== "",
    render: renderBubble,
    renderCompact: renderLabel,
  });

  // The outer box may be stretched across its container; the inner one is as
  // wide as the trigger, so focus, hover and the bubble's placement all use
  // the trigger's own cells.
  return (
    <Box>
      <Box ref={focusable.ref}>{renderNode(props.trigger)}</Box>
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
