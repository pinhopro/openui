import { Box, Text, useInput } from "ink";
import { useRef } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { elementRect } from "../focus/element-rect";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import type { MouseEvent } from "../mouse/mouse-sequence";
import { SliderSchema } from "../schemas/slider-schema";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { horizontalStep } from "./arrow-keys";
import { formatNumber } from "./chart-text";
import { displayText } from "./pad";
import { sliderTrack, sliderValue, sliderValueAtCell, stepSliderValue } from "./slider-track";

type SliderProps = z.infer<typeof SliderSchema>;

const TRACK_WIDTH = 22;
const DEFAULT_STEP = 1;

/**
 * A focusable track: Left and Right move the value by `step` (one when not
 * given), clamped to min and max; a press or a drag on the track puts the
 * knob under the pointer. The stored value is `[value]` like in the React
 * library.
 */
function SliderRenderer({ props }: ComponentRenderProps<SliderProps>) {
  const isStreaming = useIsStreaming();
  const theme = useTheme();
  const field = useStateField<unknown>(props.name, props.value);
  const min = typeof props.min === "number" ? props.min : 0;
  const max = typeof props.max === "number" ? props.max : 100;
  const step = typeof props.step === "number" ? props.step : DEFAULT_STEP;
  const value = sliderValue(field.value, props.defaultValue, min);
  const valueRef = useRef(value);
  valueRef.current = value;
  const storedRef = useRef(field.value);
  storedRef.current = field.value;

  function commit(next: number): void {
    if (next === valueRef.current) return;
    valueRef.current = next;
    storedRef.current = [next];
    field.setValue([next]);
    validation.validate(next);
  }

  /** The value for the pointer's column, measured against the track on screen. */
  function moveKnobTo(event: MouseEvent): void {
    const element = focusable.ref.current;
    if (element === null || isStreaming) return;
    const rect = elementRect(element);
    commit(sliderValueAtCell(event.x - rect.x, TRACK_WIDTH, min, max, step));
  }

  const focusable = useFocusable({
    isActive: !isStreaming,
    name: field.name,
    // Left and Right step the value until min or max; there they move focus.
    arrows: function claims(direction) {
      if (direction === "left") return valueRef.current > min;
      if (direction === "right") return valueRef.current < max;
      return false;
    },
    mouse: {
      onMouseDown: function handleMouseDown(event) {
        if (event.button === "left") moveKnobTo(event);
      },
      onMouseMove: function handleMouseMove(event) {
        if (event.button === "left") moveKnobTo(event);
      },
    },
  });

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
      commit(stepSliderValue(valueRef.current, min, max, step, delta));
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const label = displayText(props.label);
  return (
    <Box ref={focusable.ref} flexDirection="column">
      {label === "" ? null : <Text bold>{label}</Text>}
      <Text>
        <Text color={focusable.isFocused ? theme.accent : undefined}>
          {sliderTrack(value, min, max, TRACK_WIDTH)}
        </Text>{" "}
        <Text {...(focusable.isFocused ? textProps(theme.focusRing) : {})}>
          {formatNumber(value)}
        </Text>
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
