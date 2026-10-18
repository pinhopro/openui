import { z } from "zod/v4";
import { PointSchema } from "./point-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/ScatterSeries.ts (ScatterSeriesSchema).
export const ScatterSeriesSchema = z.object({
  name: z.string(),
  points: z.array(PointSchema),
});
