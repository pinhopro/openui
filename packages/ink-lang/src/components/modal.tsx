import { Box, Text, useInput } from "ink";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ModalSchema } from "../schemas/modal-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { useStateField } from "../use-state-field";
import { isPressKey } from "./button-keys";
import { displayText } from "./pad";

type ModalProps = z.infer<typeof ModalSchema>;

interface CloseButtonProps {
  onClose: () => void;
}

/** The focusable `[ x ]` in the title line; Enter, Space or Escape close the modal. */
function CloseButton({ onClose }: CloseButtonProps) {
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: "close",
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) onClose();
      },
    },
  });

  useInput(
    function handleCloseKey(input, key) {
      if (key.eventType === "release") return;
      if (key.escape || isPressKey(input, key)) onClose();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  return (
    <Box ref={focusable.ref}>
      <Text {...(focusable.isFocused ? textProps(theme.focusRing) : {})}>[ x ]</Text>
    </Box>
  );
}

/**
 * A dialog drawn in place: an accent border, the title with a close button
 * and the children. It shows while the `$open` binding is true; closing sets
 * the binding to false, like the React library.
 */
function ModalRenderer({ props, renderNode }: ComponentRenderProps<ModalProps>) {
  const theme = useTheme();
  const field = useStateField<unknown>("open", props.open);
  const isOpen = field.value === true || field.value === "true";
  const setValue = field.setValue;

  function close(): void {
    setValue(false);
  }

  if (!isOpen) return null;
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={1}>
      <Box flexDirection="row" justifyContent="space-between" gap={2}>
        <Text bold>{displayText(props.title)}</Text>
        <CloseButton onClose={close} />
      </Box>
      <Box flexDirection="column">{renderNode(props.children)}</Box>
    </Box>
  );
}

export const Modal = defineComponent({
  name: "Modal",
  props: ModalSchema,
  description:
    "Modal dialog. open is a reactive $boolean binding — set to true to open, X/Escape/backdrop auto-closes. Put Form with buttons inside children.",
  component: ModalRenderer,
});
