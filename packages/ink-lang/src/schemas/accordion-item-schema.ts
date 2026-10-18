import { z } from "zod/v4";
import { ContentChildUnion } from "./content-child-union";

// Verbatim copy of packages/react-ui/src/genui-lib/Accordion/schema.ts.
export const AccordionItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(ContentChildUnion),
});
