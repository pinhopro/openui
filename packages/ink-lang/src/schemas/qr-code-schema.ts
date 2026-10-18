import { z } from "zod/v4";

// ink-lang only: react-ui has no QrCode component.
export const QrCodeSchema = z.object({
  data: z.string().describe("The text or URL to encode"),
  size: z
    .enum(["compact", "large"])
    .optional()
    .describe(
      '"compact" (default) packs two module rows per line; "large" draws one module per line',
    ),
});
