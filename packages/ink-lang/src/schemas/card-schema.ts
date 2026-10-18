import { z } from "zod/v4";
import { Carousel } from "../components/carousel";
import { Stack } from "../components/stack";
import { Tabs } from "../components/tabs";
import { ContentChildUnion } from "./content-child-union";
import { FlexPropsSchema } from "./flex-props-schema";

// Copy of packages/react-ui/src/genui-lib/Card/schema.ts; the child union lists the
// components this library ships (the one deliberate difference from react-ui).
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
