import { Box, Text, useInput } from "ink";
import { useRef } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { SliderSchema } from "../schemas/slider-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { horizontalStep } from "./arrow-keys";
import { formatNumber } from "./chart-text";
import { displayText } from "./pad";
import { sliderTrack, sliderValue, stepSliderValue } from "./slider-track";

type SliderProps = z.infer<typeof SliderSchema>;

const TRACK_WIDTH = 22;
const DEFAULT_STEP = 1;

/**
 * A focusable track: Left and Right move the value by `step` (one when not
 * given), clamped to min and max. The stored value is `[value]` like in the
 * React library.
 */
function SliderRenderer({ props }: ComponentRenderProps<SliderProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({ isActive: !isStreaming });
  const min = typeof props.min === "number" ? props.min : 0;
  const max = typeof props.max === "number" ? props.max : 100;
  const step = typeof props.step === "number" ? props.step : DEFAULT_STEP;
  const value = sliderValue(field.value, props.defaultValue, min);
  const valueRef = useRef(value);
  valueRef.current = value;
  const storedRef = useRef(field.value);
  storedRef.current = field.value;
  const validation = useFieldValidation({
    fieldName: field.name,
    rules: props.rules,
    isFocused: focusable.isFocused,
    getValue: function readValue() {
      return storedRef.current;
    },
  });

  useInput(
    function handleSliderKey(_input, key) {
      const delta = horizontalStep(key);
      if (delta === 0) return;
      const next = stepSliderValue(valueRef.current, min, max, step, delta);
      if (next === valueRef.current) return;
      valueRef.current = next;
      storedRef.current = [next];
      field.setValue([next]);
      validation.validate(next);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const label = displayText(props.label);
  return (
    <Box flexDirection="column">
      {label === "" ? null : <Text bold>{label}</Text>}
      <Text>
        {sliderTrack(value, min, max, TRACK_WIDTH) + " "}
        <Text inverse={focusable.isFocused}>{formatNumber(value)}</Text>
      </Text>
    </Box>
  );
}

export const Slider = defineComponent({
  name: "Slider",
  props: SliderSchema,
  description: "Numeric slider input; supports continuous and discrete (stepped) variants",
  component: SliderRenderer,
});
