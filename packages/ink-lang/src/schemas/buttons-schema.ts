import { z } from "zod/v4";
import { Button } from "../components/button";

// Verbatim copy of packages/react-ui/src/genui-lib/Buttons/schema.ts.
export const ButtonsSchema = z.object({
  buttons: z.array(Button.ref),
  direction: z.enum(["row", "column"]).optional(),
});
