import { Text } from "ink";

export interface AxisLabelsProps {
  xLabel: string | undefined;
  yLabel: string | undefined;
}

/** The dim axis caption under a chart, when the program named the axes. */
export function AxisLabels({ xLabel, yLabel }: AxisLabelsProps) {
  const parts: string[] = [];
  if (xLabel !== undefined && xLabel !== "") parts.push(`x: ${xLabel}`);
  if (yLabel !== undefined && yLabel !== "") parts.push(`y: ${yLabel}`);
  if (parts.length === 0) return null;
  return <Text dimColor>{parts.join("   ")}</Text>;
}
