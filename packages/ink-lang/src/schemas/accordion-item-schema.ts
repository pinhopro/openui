import { z } from "zod/v4";
import { ContentChildUnion } from "./content-child-union";

// Copy of packages/react-ui/src/genui-lib/Accordion/schema.ts; the content union lists
// the components this library ships.
export const AccordionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
});
