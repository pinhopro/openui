import { Box, Text } from "ink";
import { displayText } from "./pad";
import { Subtext } from "./subtext";

export interface TextWithSubtextProps {
  value: unknown;
  subtext: unknown;
  subtextVariant: unknown;
  bold: boolean;
}

/** The value line (bold for BoldText) and, under it, the subtext. */
export function TextWithSubtext({ value, subtext, subtextVariant, bold }: TextWithSubtextProps) {
  const subtextText = displayText(subtext);
  return (
    <Box flexDirection="column">
      <Text bold={bold}>{displayText(value)}</Text>
      {subtextText === "" ? null : <Subtext text={subtextText} variant={subtextVariant} />}
    </Box>
  );
}
