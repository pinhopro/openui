import { Box, Text } from "ink";

export interface OptionLineProps {
  /** The glyph before the label: `[x]`, `( )`, `[on ]`... */
  mark: string;
  label: string;
  description: string;
  /** Inverse video on the label while the group's cursor is here. */
  isCursor: boolean;
}

/** `mark label` and, under it, the dim description indented past the mark. */
export function OptionLine({ mark, label, description, isCursor }: OptionLineProps) {
  return (
    <Box flexDirection="column">
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
