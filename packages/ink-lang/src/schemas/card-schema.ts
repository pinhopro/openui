import { z } from "zod/v4";
import { Carousel } from "../components/carousel";
import { Stack } from "../components/stack";
import { Tabs } from "../components/tabs";
import { ContentChildUnion } from "./content-child-union";
import { FlexPropsSchema } from "./flex-props-schema";

// Verbatim copy of packages/react-ui/src/genui-lib/Card/schema.ts.
export const CardChildUnion = z.union([
  ...ContentChildUnion.options,
  Tabs.ref,
  Carousel.ref,
  Stack.ref,
]);

export const CardSchema = z
  .object({
    children: z.array(CardChildUnion),
    variant: z.enum(["card", "sunk", "clear"]).optional(),
  })
  .merge(FlexPropsSchema);
