import { useEffect } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CalloutSchema } from "../schemas/callout-schema";
import { useStateField } from "../use-state-field";
import { CalloutBox } from "./callout-box";

type CalloutProps = z.infer<typeof CalloutSchema>;

const AUTO_DISMISS_MS = 3000;

/**
 * A callout banner. Without a `$visible` binding it is always shown; with one
 * it shows while the binding is true and, like the React library, sets the
 * binding back to false three seconds later.
 */
function CalloutRenderer({ props }: ComponentRenderProps<CalloutProps>) {
  const field = useStateField<unknown>("visible", props.visible);
  const isBound = field.isReactive;
  const isVisible = isBound ? field.value === true || field.value === "true" : true;
  const setValue = field.setValue;

  useEffect(
    function autoDismiss() {
      if (!isBound || !isVisible) return undefined;
      const timer = setTimeout(function dismiss() {
        setValue(false);
      }, AUTO_DISMISS_MS);
      return function cancel() {
        clearTimeout(timer);
      };
    },
    [isBound, isVisible, setValue],
  );

  if (!isVisible) return null;
  return <CalloutBox variant={props.variant} title={props.title} description={props.description} />;
}

export const Callout = defineComponent({
  name: "Callout",
  props: CalloutSchema,
  description:
    "Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.",
  component: CalloutRenderer,
});
