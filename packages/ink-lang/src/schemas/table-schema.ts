import { z } from "zod/v4";
import { Col } from "../components/col";

// Verbatim copy of the Table props in packages/react-ui/src/genui-lib/Table/index.tsx.
export const TableSchema = z.object({
  columns: z.array(Col.ref),
});
