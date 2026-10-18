import { Text } from "ink";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { MetricIndicatorInlineSchema } from "../schemas/metric-indicator-schema";
import { MetricTrend } from "./metric-trend";
import { displayText } from "./pad";

type MetricIndicatorInlineProps = z.infer<typeof MetricIndicatorInlineSchema>;

/** `value  +12%  subtext` on one line. */
function MetricIndicatorInlineRenderer({
  props,
}: ComponentRenderProps<MetricIndicatorInlineProps>) {
  const subtext = displayText(props.subtext);
  const hasTrend = props.trend !== undefined && props.trend !== null;
  return (
    <Text>
      <Text bold>{displayText(props.value)}</Text>
      {hasTrend ? "  " : null}
      <MetricTrend trend={props.trend} />
      {subtext === "" ? null : <Text dimColor>{"  " + subtext}</Text>}
    </Text>
  );
}

export const MetricIndicatorInline = defineComponent({
  name: "MetricIndicatorInline",
  props: MetricIndicatorInlineSchema,
  description:
    "Headline metric value with an optional +/- percentage trend and subtext, all on one line.",
  component: MetricIndicatorInlineRenderer,
});
