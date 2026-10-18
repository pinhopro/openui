import { z } from "zod/v4";

// Verbatim copy of packages/react-ui/src/genui-lib/CodeBlock/schema.ts.
export const CodeBlockSchema = z.object({
  language: z.string(),
  codeString: z.string(),
});
