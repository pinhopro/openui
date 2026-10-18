import { z } from "zod/v4";
import { Buttons } from "../components/buttons";
import { CardHeader } from "../components/card-header";
import { Form } from "../components/form";
import { Stack } from "../components/stack";
import { Table } from "../components/table";
import { Tabs } from "../components/tabs";
import { TextContent } from "../components/text-content";
import { FlexPropsSchema } from "./flex-props-schema";

// Copy of packages/react-ui/src/genui-lib/Card/schema.ts with the child union reduced
// to the components this library ships (the one deliberate difference from react-ui).
export const CardChildUnion = z.union([
  TextContent.ref,
  CardHeader.ref,
  Table.ref,
  Form.ref,
  Buttons.ref,
  Tabs.ref,
  Stack.ref,
]);

export const CardSchema = z
  .object({
    children: z.array(CardChildUnion),
    variant: z.enum(["card", "sunk", "clear"]).optional(),
  })
  .merge(FlexPropsSchema);
