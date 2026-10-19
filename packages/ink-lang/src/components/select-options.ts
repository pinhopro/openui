import { isElementValue } from "../element-node";

/** What a Select shows while nothing is picked and the model gave no placeholder. */
export const SELECT_PLACEHOLDER = "Select...";

export interface SelectOption {
  value: string;
  label: string;
}

/** The SelectItem elements of a Select as options; anything else the model wrote is skipped. */
export function selectOptions(items: unknown): SelectOption[] {
  const options: SelectOption[] = [];
  if (!Array.isArray(items)) return options;
  for (const item of items) {
    if (!isElementValue(item)) continue;
    const value = item.props["value"];
    if (typeof value !== "string" || value === "") continue;
    const label = item.props["label"];
    const shownLabel = typeof label === "string" && label !== "" ? label : value;
    options.push({ value, label: shownLabel });
  }
  return options;
}

/** The index of the option holding `value`, or -1. */
export function indexOfOption(options: SelectOption[], value: unknown): number {
  for (let index = 0; index < options.length; index += 1) {
    if (options[index]?.value === value) return index;
  }
  return -1;
}
