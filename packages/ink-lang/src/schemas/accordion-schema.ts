import { z } from "zod/v4";
import { AccordionItem } from "../components/accordion-item";

// Verbatim copy of the Accordion props in packages/react-ui/src/genui-lib/Accordion/index.tsx.
export const AccordionSchema = z.object({
  items: z.array(AccordionItem.ref),
});
