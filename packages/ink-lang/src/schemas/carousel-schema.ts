import { z } from "zod/v4";
import { ContentChildUnion } from "./content-child-union";

// Verbatim copy of the Carousel props in packages/react-ui/src/genui-lib/Carousel/index.tsx.
export const CarouselSchema = z.object({
  children: z.array(z.array(ContentChildUnion)),
  variant: z.enum(["card", "sunk"]).optional(),
});
