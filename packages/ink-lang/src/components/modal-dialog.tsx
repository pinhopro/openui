import type { ActionPlan } from "@openuidev/lang-core";
import { Box, Text, useInput } from "ink";
import { useContext, useEffect, useId } from "react";
import type { z } from "zod/v4";
import { useIsStreaming, useTriggerAction } from "../context";
import { useComponentStyle, useStyleAs } from "../design/design-system-context";
import { useFocusCommands } from "../focus/focus-commands";
import { LayerIdContext, ModalLayerContext } from "../focus/modal-layer";
import { useFocusable } from "../focus/use-focusable";
import { useFormName } from "../form-name-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { ModalDialogSchema } from "../schemas/modal-dialog-schema";
import { useTheme } from "../theme";
import { boxProps, textProps } from "../theme-styles";
import { useStateField } from "../use-state-field";
import { isPressKey } from "./button-keys";
import { displayText } from "./pad";
import { variantColor } from "./variant-color";

type ModalDialogProps = z.infer<typeof ModalDialogSchema>;

const MARKS: Record<string, string> = {
  info: "ⓘ",
  success: "✓",
  warning: "!",
  destructive: "⚠",
  neutral: "•",
};

interface DialogButtonProps {
  label: string;
  classes: string[];
  color: string | undefined;
  onPress: () => void;
}

/** One of the dialog's buttons: a focus stop pressed with Enter, Space or a click. */
function DialogButton({ label, classes, color, onPress }: DialogButtonProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: label,
    hoverFocus: true,
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) onPress();
      },
    },
  });
  const states: string[] = [];
  if (focusable.isFocused) states.push("focus");
  if (focusable.isHovered) states.push("hover");
  if (focusable.isPressed) states.push("pressed");
  if (isStreaming) states.push("disabled");
  // Styled as a Button under the dialog, so `Button:focus` and `ModalDialog Button.confirm` apply.
  const style = useStyleAs("Button", classes, states);
  useInput(
    function handleKey(input, key) {
      if (isPressKey(input, key)) onPress();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  return (
    <Box ref={focusable.ref} backgroundColor={style.box.background}>
      <Text {...textProps(style.text)} color={style.text.color ?? color}>
        [ {label} ]
      </Text>
    </Box>
  );
}

/**
 * A dialog with a variant mark, a title, a body and up to two buttons.
 * While shown it is the only active layer: nothing outside it takes focus or
 * the mouse. Cancel closes it; confirm fires its action (or sends the label
 * to the assistant) and closes it. Without an `open` binding it is always
 * shown and the buttons only fire.
 */
function ModalDialogRenderer({ props }: ComponentRenderProps<ModalDialogProps>) {
  const theme = useTheme();
  const triggerAction = useTriggerAction();
  const formName = useFormName();
  const field = useStateField<unknown>("open", props.open);
  const hasBinding = props.open !== undefined && props.open !== null;
  const isOpen = !hasBinding || field.value === true || field.value === "true";
  const setValue = field.setValue;
  const layerId = useId();
  const layers = useContext(ModalLayerContext);
  const openLayer = layers.open;
  const focusFirst = useFocusCommands().focusFirst;
  const variant = props.variant;
  const color = variant === "destructive" ? theme.danger : variantColor(variant, theme);
  const dialogStyle = useComponentStyle([variant]);
  const titleStyle = useComponentStyle([variant, "title"]);
  const bodyStyle = useComponentStyle([variant, "body"]);

  useEffect(
    function holdLayer() {
      if (!isOpen) return undefined;
      const closeLayer = openLayer(layerId);
      const timer = setTimeout(focusFirst, 0);
      return function release() {
        clearTimeout(timer);
        closeLayer();
      };
    },
    [focusFirst, isOpen, layerId, openLayer],
  );

  function close(): void {
    if (hasBinding) setValue(false);
  }

  function cancel(): void {
    const action = props.cancelAction as unknown as ActionPlan | null | undefined;
    if (action !== undefined && action !== null) {
      void triggerAction(displayText(props.cancelLabel), formName, action);
    }
    close();
  }

  function confirm(): void {
    void triggerAction(
      displayText(props.confirmLabel),
      formName,
      props.confirmAction as unknown as ActionPlan | null | undefined,
    );
    close();
  }

  if (!isOpen) return null;
  const cancelLabel = displayText(props.cancelLabel);
  const confirmLabel = displayText(props.confirmLabel);
  const box = boxProps(dialogStyle.box);
  return (
    <LayerIdContext.Provider value={layerId}>
      <Box
        flexDirection="column"
        borderStyle={box.borderStyle ?? "round"}
        borderColor={box.borderColor ?? color}
        backgroundColor={box.backgroundColor}
        paddingX={box.paddingX ?? 1}
        paddingY={box.paddingY}
      >
        <Text>
          <Text color={color} bold>
            {(MARKS[variant] ?? MARKS["neutral"]) + " "}
          </Text>
          <Text {...textProps(titleStyle.text)} bold={titleStyle.text.bold ?? true}>
            {displayText(props.title)}
          </Text>
        </Text>
        <Text {...textProps(bodyStyle.text)}>{displayText(props.body)}</Text>
        <Box flexDirection="row" gap={1} marginTop={1}>
          {cancelLabel === "" ? null : (
            <DialogButton
              label={cancelLabel}
              classes={[variant, "cancel"]}
              color={undefined}
              onPress={cancel}
            />
          )}
          {confirmLabel === "" ? null : (
            <DialogButton
              label={confirmLabel}
              classes={[variant, "confirm"]}
              color={color}
              onPress={confirm}
            />
          )}
        </Box>
      </Box>
    </LayerIdContext.Provider>
  );
}

export const ModalDialog = defineComponent({
  name: "ModalDialog",
  props: ModalDialogSchema,
  description:
    'A dialog that blocks everything behind it: a variant mark ("info" | "success" | "warning" | "destructive" | "neutral"), a title, a body and up to two buttons. Give it a $open binding to show and hide it; the confirm button fires confirmAction or sends its label to the assistant.',
  component: ModalDialogRenderer,
});
