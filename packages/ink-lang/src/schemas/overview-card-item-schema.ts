import { z } from "zod/v4";
import { IconText } from "../components/icon-text";
import { ImageText } from "../components/image-text";
import { MetricIndicatorInline } from "../components/metric-indicator-inline";
import { Text } from "../components/text";

// Verbatim copy of OverviewCardItemSchema in packages/react-ui/src/genui-lib/OverviewCardBlock/schema.ts.
export const OverviewCardItemSchema = z.object({
  id: z.string().optional(),
  top: z.union([IconText.ref, ImageText.ref, Text.ref]),
  bottom: z.optional(MetricIndicatorInline.ref),
});
