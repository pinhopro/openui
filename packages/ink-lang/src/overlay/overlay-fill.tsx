import { Box, Text } from "ink";

export interface OverlayFillProps {
  width: number;
  height: number;
}

/**
 * Blank cells over a `width` x `height` area at the top-left of its parent,
 * painted before an overlay's content: the terminal has no transparency and
 * Ink writes only text and borders, so without it whatever lies under an
 * overlay would show through the cells its content leaves empty (padding,
 * short lines). Absolutely positioned, so it never changes the overlay's size.
 */
export function OverlayFill({ width, height }: OverlayFillProps) {
  if (width <= 0 || height <= 0) return null;
  const rows: string[] = [];
  for (let row = 0; row < height; row += 1) rows.push(" ".repeat(width));
  return (
    <Box position="absolute" top={0} left={0} width={width} height={height}>
      <Text>{rows.join("\n")}</Text>
    </Box>
  );
}
