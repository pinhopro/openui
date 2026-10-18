import { Text } from "ink";
import { useTheme } from "../theme";
import { formatNumber } from "./chart-text";

export interface MetricTrendProps {
  trend: unknown;
}

/** `+12%` in the success color for an upward trend, `-12%` in the danger color for a downward one. */
export function MetricTrend({ trend }: MetricTrendProps) {
  const theme = useTheme();
  if (typeof trend !== "object" || trend === null) return null;
  const record = trend as Record<string, unknown>;
  const value = typeof record["value"] === "number" ? record["value"] : undefined;
  if (value === undefined) return null;
  const isDown = record["direction"] === "down";
  const sign = isDown ? "-" : "+";
  return (
    <Text color={isDown ? theme.danger : theme.success}>
      {sign + formatNumber(Math.abs(value)) + "%"}
    </Text>
  );
}
