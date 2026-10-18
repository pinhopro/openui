import { Text } from "ink";
import { useTheme } from "../theme";

export interface SubtextProps {
  text: string;
  /** `metric` colors a leading `+` green and a leading `-` red. */
  variant: unknown;
}

/** The dim second line of Text and BoldText. */
export function Subtext({ text, variant }: SubtextProps) {
  const theme = useTheme();
  if (variant === "metric") {
    if (text.startsWith("+")) return <Text color={theme.success}>{text}</Text>;
    if (text.startsWith("-")) return <Text color={theme.danger}>{text}</Text>;
  }
  return <Text dimColor>{text}</Text>;
}
