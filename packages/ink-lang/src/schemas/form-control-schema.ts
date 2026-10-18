import { z } from "zod/v4";
import { CheckBoxGroup } from "../components/check-box-group";
import { Chips } from "../components/chips";
import { DatePicker } from "../components/date-picker";
import { OptionCards } from "../components/option-cards";
import { RadioGroup } from "../components/radio-group";
import { Select } from "../components/select";
import { Slider } from "../components/slider";
import { TextArea } from "../components/text-area";
import { Input } from "../components/text-input";

// Verbatim copy of packages/react-ui/src/genui-lib/FormControl/schema.ts.
export const FormControlSchema = z.object({
  label: z.string(),
  input: z.union([
    Input.ref,
    TextArea.ref,
    Select.ref,
    DatePicker.ref,
    Slider.ref,
    CheckBoxGroup.ref,
    RadioGroup.ref,
    Chips.ref,
    OptionCards.ref,
  ]),
  hint: z.string().optional(),
});
