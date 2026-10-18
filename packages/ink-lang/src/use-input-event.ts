import { useElementType } from "./element-type-context";
import { useUiEvents } from "./ui-events";

/** Reports an `input` UI event (a keystroke edit of a text editor) for the field `name`. */
export function useInputEvent(name: string): (value: unknown) => void {
  const component = useElementType();
  const emit = useUiEvents();
  return function reportInput(value: unknown): void {
    emit({ type: "input", component, name, value });
  };
}
