import { z } from "zod/v4";
import { reactive } from "../reactive";
import { ContentChildUnion } from "./content-child-union";

// Verbatim copy of packages/react-ui/src/genui-lib/Modal/schema.ts.
export const ModalSchema = z.object({
  title: z.string(),
  open: reactive(z.boolean().optional()),
  children: z.array(ContentChildUnion),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
