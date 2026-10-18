import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useTheme } from "../theme";
import { AxisLabels } from "./axis-labels";
import { buildSeriesRows, seriesNames } from "./chart-data";
import { formatNumber, padEnd, sparkline } from "./chart-text";

export interface SeriesSparklinesProps {
  labels: unknown;
  series: unknown;
  xLabel: string | undefined;
  yLabel: string | undefined;
}

/** One sparkline per series with its range, and the first and last label underneath. */
export function SeriesSparklines({ labels, series, xLabel, yLabel }: SeriesSparklinesProps) {
  const theme = useTheme();
  const rows = buildSeriesRows(labels, series);
  const names = seriesNames(rows);
  if (rows.length === 0 || names.length === 0) return null;
  let nameWidth = 0;
  for (const name of names) {
    if (name.length > nameWidth) nameWidth = name.length;
  }
  const lines: ReactNode[] = [];
  for (const name of names) {
    const values: number[] = [];
    for (const row of rows) {
      const value = row.values[name];
      if (value !== undefined) values.push(value);
    }
    if (values.length === 0) continue;
    let min = values[0] ?? 0;
    let max = values[0] ?? 0;
    for (const value of values) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
    lines.push(
      <Text key={name}>
        {padEnd(name, nameWidth)} <Text color={theme.accent}>{sparkline(values)}</Text>{" "}
        <Text dimColor>
          {formatNumber(min)}..{formatNumber(max)}
        </Text>
      </Text>,
    );
  }
  const first = rows[0]?.category ?? "";
  const last = rows[rows.length - 1]?.category ?? "";
  return (
    <Box flexDirection="column">
      {lines}
      <Text dimColor>
        {padEnd("", nameWidth)} {first} … {last}
      </Text>
      <AxisLabels xLabel={xLabel} yLabel={yLabel} />
    </Box>
  );
}
