import { Text } from "ink";
import { displayText } from "./pad";

export interface ImagePlaceholderProps {
  alt: unknown;
  src: unknown;
  /** Extra dim text after the label (a gallery item's details). */
  details?: unknown;
}

const IMAGE_MARK = "▣";

/** The label of an image placeholder: the alt text, or the url when there is none. */
export function imageLabel(alt: unknown, src: unknown): string {
  const altText = displayText(alt);
  if (altText !== "") return altText;
  return displayText(src);
}

/** Images are never fetched: a dim line names the picture instead. */
export function ImagePlaceholder({ alt, src, details }: ImagePlaceholderProps) {
  const label = imageLabel(alt, src);
  const extra = displayText(details);
  return (
    <Text dimColor>
      {IMAGE_MARK + " " + label}
      {extra === "" ? "" : "  " + extra}
    </Text>
  );
}
