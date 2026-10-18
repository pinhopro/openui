import { SelectItem } from "../components/select-item";
import { createSelectSchema } from "./select-schema";

// ink-lang only: react-ui ships no Combobox. It takes Select's exact shape (built by the
// verbatim createSelectSchema) so the same SelectItem options serve both components.
export const ComboboxSchema = createSelectSchema(SelectItem);
