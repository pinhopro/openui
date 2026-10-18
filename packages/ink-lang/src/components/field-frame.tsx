import { Box, type DOMElement } from "ink";
import type { ReactNode, RefObject } from "react";
import { useFieldStyles } from "../use-field-styles";

export interface FieldFrameProps {
  /** The focusable's ref: the frame is the box the mouse hits. */
  boxRef: RefObject<DOMElement | null>;
  isFocused: boolean;
  column?: boolean;
  children: ReactNode;
}

/** The themed box around a text field: border, background and padding from the field slot. */
export function FieldFrame({ boxRef, isFocused, column, children }: FieldFrameProps) {
  const styles = useFieldStyles(isFocused);
  return (
    <Box
      ref={boxRef}
      flexDirection={column === true ? "column" : "row"}
      borderStyle={styles.box.borderStyle}
      borderColor={styles.box.borderColor}
      borderDimColor={styles.box.borderDimColor}
      backgroundColor={styles.box.backgroundColor}
      paddingX={styles.box.paddingX}
      paddingY={styles.box.paddingY}
    >
      {children}
    </Box>
  );
}
