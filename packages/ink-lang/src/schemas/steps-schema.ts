import { z } from "zod/v4";
import { StepsItem } from "../components/steps-item";

// Verbatim copy of the Steps props in packages/react-ui/src/genui-lib/Steps/index.tsx.
export const StepsSchema = z.object({
  items: z.array(StepsItem.ref),
});
