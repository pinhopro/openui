import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useTheme } from "../theme";
import { AxisLabels } from "./axis-labels";
import { formatNumber } from "./chart-text";

export interface BraillePlotProps {
  /** The canvas rows, top first. */
  lines: string[];
  yMin: number;
  yMax: number;
  /** The caption under the plot: the first and last x value or label. */
  xFirst: string;
  xLast: string;
  /** One line per series, drawn under the caption in the accent color. */
  legend: string[];
  xLabel: string | undefined;
  yLabel: string | undefined;
}

const AXIS_TICK = "┤";
const AXIS_BAR = "│";
const ELLIPSIS = "…";

function padStart(text: string, width: number): string {
  if (text.length >= width) return text;
  return " ".repeat(width - text.length) + text;
}

/**
 * The frame every braille chart shares: the y range as labels on the top and
 * bottom rows, the canvas in the accent color, the x caption, the legend and
 * the axis names.
 */
export function BraillePlot({
  lines,
  yMin,
  yMax,
  xFirst,
  xLast,
  legend,
  xLabel,
  yLabel,
}: BraillePlotProps) {
  const theme = useTheme();
  const maxText = formatNumber(yMax);
  const minText = formatNumber(yMin);
  const labelWidth = Math.max(maxText.length, minText.length);
  const rows: ReactNode[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    let label = "";
    if (index === 0) label = maxText;
    if (index === lines.length - 1) label = minText;
    const tick = label === "" ? AXIS_BAR : AXIS_TICK;
    rows.push(
      <Text key={index}>
        <Text dimColor>{padStart(label, labelWidth) + " " + tick}</Text>
        <Text color={theme.accent}>{lines[index]}</Text>
      </Text>,
    );
  }
  const legendLines: ReactNode[] = [];
  for (let index = 0; index < legend.length; index += 1) {
    legendLines.push(
      <Text key={index} color={theme.accent}>
        {padStart("", labelWidth) + "  " + legend[index]}
      </Text>,
    );
  }
  return (
    <Box flexDirection="column">
      {rows}
      <Text dimColor>
        {padStart("", labelWidth) + "  " + xFirst + " " + ELLIPSIS + " " + xLast}
      </Text>
      {legendLines}
      <AxisLabels xLabel={xLabel} yLabel={yLabel} />
    </Box>
  );
}
