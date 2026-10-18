import { z } from "zod/v4";
import { TabItem } from "../components/tab-item";

// Verbatim copy of the Tabs props in packages/react-ui/src/genui-lib/Tabs/index.tsx.
export const TabsSchema = z.object({
  items: z.array(TabItem.ref),
});
