/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import { isPressKey } from "../../src/components/button-keys";
import { useIsStreaming, useTriggerAction } from "../../src/context";
import { useComponentStyle } from "../../src/design/design-system-context";
import { useFocusable } from "../../src/focus/use-focusable";
import { textProps } from "../../src/theme-styles";

export interface ChatGlyphButtonProps {
  /** The one-cell symbol drawn: `✆`, `⌕`, `⋮`, `☺`, `⊕`, `➤`... */
  glyph: string;
  /** The accessible name: what the host receives and what identifies the stop. */
  name: string;
  /** The action to fire; without one the name is sent to the assistant. */
  action?: unknown;
  /** Extra classes beside `button`: `send`, `mic`... */
  classes?: string[];
  /** Where this button sits in its component's Tab sequence (see `useFocusable`'s `order`). */
  order?: number;
}

/**
 * An icon button drawn as a bare glyph with a cell of padding, the way a
 * chat app draws its toolbar icons. A focus stop pressed with Enter, Space
 * or a click; the stylesheet addresses it as `.button` under the chat
 * component that renders it (`ChatHeader .button:focus`).
 */
export function ChatGlyphButton({ glyph, name, action, classes, order }: ChatGlyphButtonProps) {
  const isStreaming = useIsStreaming();
  const triggerAction = useTriggerAction();

  function press(): void {
    void triggerAction(name, undefined, action as ActionPlan | null | undefined);
  }

  const focusable = useFocusable({
    isActive: !isStreaming,
    name,
    order,
    hoverFocus: true,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) press();
      },
    },
  });
  useInput(
    function handleKey(input, key) {
      if (isPressKey(input, key)) press();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  const states: string[] = [];
  if (focusable.isFocused) states.push("focus");
  if (focusable.isHovered) states.push("hover");
  if (focusable.isPressed) states.push("pressed");
  const style = useComponentStyle(["button"].concat(classes ?? []), states);
  return (
    <Box ref={focusable.ref} backgroundColor={style.box.background}>
      <Text {...textProps(style.text)}>{" " + glyph + " "}</Text>
    </Box>
  );
}
