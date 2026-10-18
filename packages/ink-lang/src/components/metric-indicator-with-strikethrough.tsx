import { Box, Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { MetricIndicatorWithStrikethroughSchema } from "../schemas/metric-indicator-schema";
import { MetricTrend } from "./metric-trend";
import { displayText } from "./pad";

type MetricIndicatorWithStrikethroughProps = z.infer<typeof MetricIndicatorWithStrikethroughSchema>;

/** `value  previous  +12%` with the previous value struck through, and the subtext under it. */
function MetricIndicatorWithStrikethroughRenderer({
  props,
}: ComponentRenderProps<MetricIndicatorWithStrikethroughProps>) {
  const previous = displayText(props.previousValue);
  const subtext = displayText(props.subtext);
  const hasTrend = props.trend !== undefined && props.trend !== null;
  return (
    <Box flexDirection="column">
      <Text>
        <Text bold>{displayText(props.value)}</Text>
        {previous === "" ? null : (
          <Text dimColor strikethrough>
            {"  " + previous}
          </Text>
        )}
        {hasTrend ? "  " : null}
        <MetricTrend trend={props.trend} />
      </Text>
      {subtext === "" ? null : <Text dimColor>{subtext}</Text>}
    </Box>
  );
}

export const MetricIndicatorWithStrikethrough = defineComponent({
  name: "MetricIndicatorWithStrikethrough",
  props: MetricIndicatorWithStrikethroughSchema,
  description:
    "Headline metric value with an optional struck-through previousValue, a +/- percentage trend, and subtext below.",
  component: MetricIndicatorWithStrikethroughRenderer,
});
