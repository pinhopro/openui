import { Text, useInput } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { useFocusable } from "../focus/use-focusable";
import { defineComponent, type ComponentRenderProps } from "../library";
import { DatePickerSchema } from "../schemas/date-picker-schema";
import { useFieldValidation } from "../use-field-validation";
import { useStateField } from "../use-state-field";
import { horizontalStep, verticalStep } from "./arrow-keys";
import {
  dateSegments,
  formatIsoDate,
  parseIsoDate,
  stepDate,
  todayDate,
  type CalendarDate,
  type DateSegment,
} from "./date-segments";
import { clampIndex, stepIndex } from "./step-index";

type DatePickerProps = z.infer<typeof DatePickerSchema>;

const SEGMENTS_PER_DATE = 3;
const RANGE_SEPARATOR = " to ";
const DAY_SEGMENT: DateSegment = 2;

interface RangeValue {
  from: unknown;
  to: unknown;
}

function rangeValue(value: unknown): RangeValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { from: undefined, to: undefined };
  }
  const record = value as Record<string, unknown>;
  return { from: record["from"], to: record["to"] };
}

interface DateTextProps {
  date: CalendarDate | undefined;
  /** The focused segment of this date, or -1 when the focus is elsewhere. */
  activeSegment: number;
}

/** `YYYY-MM-DD` with the active segment in inverse video; dim while there is no date. */
function DateText({ date, activeSegment }: DateTextProps) {
  const segments = dateSegments(date);
  const parts: ReactNode[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    if (index > 0) parts.push("-");
    parts.push(
      <Text key={index} inverse={index === activeSegment}>
        {segments[index]}
      </Text>,
    );
  }
  return <Text dimColor={date === undefined}>{parts}</Text>;
}

/**
 * The model-facing `DatePicker`: an ISO date (or a `{ from, to }` pair in range
 * mode) edited segment by segment. Left and Right pick the year, month or day,
 * Up and Down change it; an empty date starts from today.
 */
function DatePickerRenderer({ props }: ComponentRenderProps<DatePickerProps>) {
  const isStreaming = useIsStreaming();
  const field = useStateField<unknown>(props.name, props.value);
  const focusable = useFocusable({ isActive: !isStreaming });
  const isRange = props.mode === "range";
  const dateCount = isRange ? 2 : 1;
  const segmentCount = SEGMENTS_PER_DATE * dateCount;
  const [storedSegment, setStoredSegment] = useState(DAY_SEGMENT);
  const segment = clampIndex(storedSegment, segmentCount);
  const segmentRef = useRef(segment);
  segmentRef.current = segment;
  const valueRef = useRef(field.value);
  valueRef.current = field.value;
  const validation = useFieldValidation({
    fieldName: field.name,
    rules: props.rules,
    isFocused: focusable.isFocused,
    getValue: function readValue() {
      return valueRef.current;
    },
  });

  function datesOf(value: unknown): Array<CalendarDate | undefined> {
    if (!isRange) return [parseIsoDate(value)];
    const range = rangeValue(value);
    return [parseIsoDate(range.from), parseIsoDate(range.to)];
  }

  function store(dates: Array<CalendarDate | undefined>): void {
    let next: unknown;
    if (!isRange) {
      next = dates[0] === undefined ? undefined : formatIsoDate(dates[0]);
    } else {
      const previous = rangeValue(valueRef.current);
      next = {
        from: dates[0] === undefined ? previous.from : formatIsoDate(dates[0]),
        to: dates[1] === undefined ? previous.to : formatIsoDate(dates[1]),
      };
    }
    valueRef.current = next;
    field.setValue(next);
    validation.validate(next);
  }

  useInput(
    function handleDateKey(_input, key) {
      const horizontal = horizontalStep(key);
      if (horizontal !== 0) {
        const next = stepIndex(segmentRef.current, segmentCount, horizontal);
        segmentRef.current = next;
        setStoredSegment(next as DateSegment);
        return;
      }
      // Up increases the segment, so the sign of the list step is flipped.
      const vertical = -verticalStep(key);
      if (vertical === 0) return;
      const dates = datesOf(valueRef.current);
      const dateIndex = Math.floor(segmentRef.current / SEGMENTS_PER_DATE);
      const dateSegment = (segmentRef.current % SEGMENTS_PER_DATE) as DateSegment;
      const current = dates[dateIndex];
      dates[dateIndex] = stepDate(current ?? todayDate(), dateSegment, current ? vertical : 0);
      store(dates);
    },
    { isActive: focusable.isFocused && !isStreaming },
  );

  const dates = datesOf(field.value);
  const parts: ReactNode[] = [];
  for (let index = 0; index < dateCount; index += 1) {
    if (index > 0) parts.push(RANGE_SEPARATOR);
    const first = index * SEGMENTS_PER_DATE;
    const isActiveDate = focusable.isFocused && segment >= first && segment < first + 3;
    parts.push(
      <DateText
        key={index}
        date={dates[index]}
        activeSegment={isActiveDate ? segment - first : -1}
      />,
    );
  }
  return (
    <Text>
      {focusable.isFocused ? "> " : "  "}
      {parts}
    </Text>
  );
}

export const DatePicker = defineComponent({
  name: "DatePicker",
  props: DatePickerSchema,
  description: "",
  component: DatePickerRenderer,
});
