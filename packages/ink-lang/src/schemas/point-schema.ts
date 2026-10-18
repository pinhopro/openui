import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/Charts/Point.ts (PointSchema).
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});
