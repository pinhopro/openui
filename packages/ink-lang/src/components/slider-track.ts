const KNOB = "●";
const FILLED = "━";
const EMPTY = "─";

/** The slider value after moving `delta` steps, clamped to the range. */
export function stepSliderValue(
  value: number,
  min: number,
  max: number,
  step: number,
  delta: number,
): number {
  const size = step > 0 ? step : 1;
  const next = value + delta * size;
  if (next < min) return min;
  if (next > max) return max;
  return next;
}

/** The first value of a slider: the stored array, else the default, else min. */
export function sliderValue(stored: unknown, defaultValue: unknown, min: number): number {
  for (const candidate of [stored, defaultValue]) {
    if (Array.isArray(candidate) && typeof candidate[0] === "number") return candidate[0];
    if (typeof candidate === "number") return candidate;
  }
  return min;
}

/** `├━━━●────┤`: a track `width` cells wide with the knob at the value's position. */
export function sliderTrack(value: number, min: number, max: number, width: number): string {
  const inner = Math.max(1, width - 2);
  const span = max - min;
  const ratio = span <= 0 ? 0 : Math.min(1, Math.max(0, (value - min) / span));
  const knobIndex = Math.round(ratio * (inner - 1));
  let track = "├";
  for (let index = 0; index < inner; index += 1) {
    if (index === knobIndex) track += KNOB;
    else track += index < knobIndex ? FILLED : EMPTY;
  }
  return track + "┤";
}
