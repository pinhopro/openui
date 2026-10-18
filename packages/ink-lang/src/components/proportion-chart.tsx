import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { buildSlices } from "./chart-data";
import { formatNumber, padEnd, percentages, proportionSegments } from "./chart-text";

const BAR_WIDTH = 30;
const SLICE_COLORS = ["cyan", "green", "yellow", "magenta", "blue", "red", "white"];

export interface ProportionChartProps {
  labels: unknown;
  values: unknown;
}

function colorAt(index: number): string {
  return SLICE_COLORS[index % SLICE_COLORS.length] ?? "white";
}

/** A single stacked bar with one colored segment per slice, and a legend with percentages. */
export function ProportionChart({ labels, values }: ProportionChartProps) {
  const slices = buildSlices(labels, values);
  if (slices.length === 0) return null;
  const amounts: number[] = [];
  const categories: string[] = [];
  for (const slice of slices) {
    amounts.push(slice.value);
    categories.push(slice.category);
  }
  const cells = proportionSegments(amounts, BAR_WIDTH);
  const shares = percentages(amounts);
  let labelWidth = 0;
  for (const category of categories) {
    if (category.length > labelWidth) labelWidth = category.length;
  }
  const segments: ReactNode[] = [];
  const legend: ReactNode[] = [];
  for (let index = 0; index < slices.length; index += 1) {
    const slice = slices[index];
    if (slice === undefined) continue;
    segments.push(
      <Text key={index} color={colorAt(index)}>
        {"█".repeat(cells[index] ?? 0)}
      </Text>,
    );
    legend.push(
      <Text key={index}>
        <Text color={colorAt(index)}>■</Text> {padEnd(slice.category, labelWidth)}{" "}
        {String(shares[index] ?? 0)}% <Text dimColor>({formatNumber(slice.value)})</Text>
      </Text>,
    );
  }
  return (
    <Box flexDirection="column">
      <Text>{segments}</Text>
      {legend}
    </Box>
  );
}
