import { z } from "zod/v4";
import { actionPropSchema } from "./action-schema";

// Verbatim copy of the ListItem props in packages/react-ui/src/genui-lib/ListItem/index.tsx.
export const ListItemSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
  actionLabel: z.string().optional(),
  action: actionPropSchema.optional(),
});
