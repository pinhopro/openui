import { z } from "zod/v4";
import { Icon } from "../components/icon";
import { Image } from "../components/image";

// Verbatim copy of OptionCardSchema in packages/react-ui/src/genui-lib/OptionCards/schema.ts.
export const OptionCardSchema = z.object({
  value: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  topContent: z.union([Icon.ref, Image.ref]).optional(),
  disabled: z.boolean().optional(),
});
