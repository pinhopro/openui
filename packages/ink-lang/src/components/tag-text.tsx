import { Text } from "ink";
import { useTheme } from "../theme";
import { iconText } from "./icon";
import { displayText } from "./pad";
import { variantColor } from "./variant-color";

export interface TagTextProps {
  text: unknown;
  icon?: unknown;
  variant?: unknown;
}

/** `[text]`, colored by variant; the icon name goes before the text. */
export function TagText({ text, icon, variant }: TagTextProps) {
  const theme = useTheme();
  const color = variantColor(variant, theme);
  const iconPart = iconText(icon);
  const label = displayText(text);
  const inner = iconPart === "" ? label : iconPart + " " + label;
  return <Text color={color}>{"[" + inner + "]"}</Text>;
}
