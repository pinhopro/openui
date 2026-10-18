import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/Series.ts (SeriesSchema).
export const SeriesSchema = z.object({
  category: z.string(),
  values: z.array(z.number()),
});
