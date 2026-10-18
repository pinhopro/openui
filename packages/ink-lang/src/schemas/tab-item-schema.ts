import { z } from "zod/v4";
import { Buttons } from "../components/buttons";
import { CardHeader } from "../components/card-header";
import { Form } from "../components/form";
import { Table } from "../components/table";
import { TextContent } from "../components/text-content";

// Copy of packages/react-ui/src/genui-lib/Tabs/schema.ts with the content union
// (react-ui's ContentChildUnion) reduced to the components this library ships.
export const TabContentChildUnion = z.union([
  TextContent.ref,
  CardHeader.ref,
  Table.ref,
  Form.ref,
  Buttons.ref,
]);

export const TabItemSchema = z.object({
  value: z.string(),
  trigger: z.string(),
  content: z.array(TabContentChildUnion),
});
