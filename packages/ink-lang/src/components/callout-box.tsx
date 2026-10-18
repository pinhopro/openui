import { Box, Text } from "ink";
import { useTheme } from "../theme";
import { displayText } from "./pad";
import { variantColor } from "./variant-color";

export interface CalloutBoxProps {
  variant: unknown;
  title: unknown;
  description: unknown;
}

/** A left border in the variant color, a bold title line and the description. */
export function CalloutBox({ variant, title, description }: CalloutBoxProps) {
  const theme = useTheme();
  const color = variantColor(variant, theme);
  const titleText = displayText(title);
  const descriptionText = displayText(description);
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderLeft
      borderTop={false}
      borderRight={false}
      borderBottom={false}
      borderColor={color}
      paddingLeft={1}
    >
      {titleText === "" ? null : (
        <Text bold color={color}>
          {titleText}
        </Text>
      )}
      {descriptionText === "" ? null : <Text>{descriptionText}</Text>}
    </Box>
  );
}
