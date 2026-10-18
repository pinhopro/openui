import { Box, Text, type DOMElement } from "ink";
import { useRef } from "react";
import { useMouse } from "../mouse/use-mouse";

export interface OptionLineProps {
  /** The glyph before the label: `[x]`, `( )`, `[on ]`... */
  mark: string;
  label: string;
  description: string;
  /** Inverse video on the label while the group's cursor is here. */
  isCursor: boolean;
  /** Called when the line is clicked. */
  onPress: () => void;
}

/** `mark label` and, under it, the dim description indented past the mark; a click presses it. */
export function OptionLine({ mark, label, description, isCursor, onPress }: OptionLineProps) {
  const lineRef = useRef<DOMElement | null>(null);
  useMouse(lineRef, {
    onClick: function handleClick() {
      onPress();
    },
  });
  return (
    <Box ref={lineRef} flexDirection="column">
      <Text>
        {mark + " "}
        <Text inverse={isCursor}>{label}</Text>
      </Text>
      {description === "" ? null : (
        <Text dimColor>{" ".repeat(mark.length + 1) + description}</Text>
      )}
    </Box>
  );
}
