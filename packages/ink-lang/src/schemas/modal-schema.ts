import { z } from "zod/v4";
import { reactive } from "../reactive";
import { ContentChildUnion } from "./content-child-union";

// Copy of packages/react-ui/src/genui-lib/Modal/schema.ts; the children union lists the
// components this library ships.
export const ModalSchema = z.object({
  title: z.string(),
  open: reactive(z.boolean().optional()),
  children: z.array(ContentChildUnion),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
