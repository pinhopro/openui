import { z } from "zod/v4";
import { ListItem } from "../components/list-item";

// Verbatim copy of the ListBlock props in packages/react-ui/src/genui-lib/ListBlock/index.tsx.
export const ListBlockSchema = z.object({
  items: z.array(ListItem.ref),
  variant: z.enum(["number", "image"]).optional(),
  size: z.enum(["default", "small"]).optional(),
});
