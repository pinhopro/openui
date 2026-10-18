import { z } from "zod/v4";
import { AreaChart } from "../components/area-chart";
import { BarChart } from "../components/bar-chart";
import { BoldText } from "../components/bold-text";
import { Button } from "../components/button";
import { EntityList } from "../components/entity-list";
import { IconText } from "../components/icon-text";
import { Image } from "../components/image";
import { ImageText } from "../components/image-text";
import { ImageTextLarge } from "../components/image-text-large";
import { LineChart } from "../components/line-chart";
import { ListBlock } from "../components/list-block";
import { MetricIndicatorInline } from "../components/metric-indicator-inline";
import { MetricIndicatorWithStrikethrough } from "../components/metric-indicator-with-strikethrough";
import { TagBlock } from "../components/tag-block";
import { Text } from "../components/text";

// Verbatim copy of the item schemas in packages/react-ui/src/genui-lib/CompositeCardBlock/schema.ts
// (react-ui's AreaChartCondensed, BarChartCondensed and LineChartCondensed are the
// AreaChart, BarChart and LineChart components here).
export const CompositeCardBodyItemSchema = z.union([
  Text.ref,
  BoldText.ref,
  MetricIndicatorInline.ref,
  IconText.ref,
  Image.ref,
  AreaChart.ref,
  BarChart.ref,
  LineChart.ref,
  ListBlock.ref,
  TagBlock.ref,
  EntityList.ref,
]);

export const CompositeCardFooterSchema = z.object({
  price: z.union([BoldText.ref, MetricIndicatorWithStrikethrough.ref]).optional(),
  button: z.optional(Button.ref),
});

export const CompositeCardItemSchema = z.object({
  id: z.string().optional(),
  header: z
    .union([IconText.ref, ImageText.ref, ImageTextLarge.ref, Text.ref, Image.ref])
    .optional(),
  body: z.array(CompositeCardBodyItemSchema).default([]),
  footer: CompositeCardFooterSchema.optional(),
});
