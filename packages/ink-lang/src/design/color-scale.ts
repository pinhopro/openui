/** The five stops of a primitive color, numbered like a Tailwind scale. */
export interface ColorScale {
  100: string;
  300: string;
  500: string;
  700: string;
  900: string;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHex(color: string): Rgb | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (match === null) return null;
  const hex = match[1] as string;
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

function channel(value: number): string {
  const clamped = Math.min(255, Math.max(0, Math.round(value)));
  return clamped.toString(16).padStart(2, "0");
}

function formatHex(rgb: Rgb): string {
  return "#" + channel(rgb.r) + channel(rgb.g) + channel(rgb.b);
}

function mix(color: string, target: number, amount: number): string {
  const rgb = parseHex(color);
  if (rgb === null) return color;
  return formatHex({
    r: rgb.r + (target - rgb.r) * amount,
    g: rgb.g + (target - rgb.g) * amount,
    b: rgb.b + (target - rgb.b) * amount,
  });
}

/** `color` mixed with white by `amount` (0 to 1); a named color comes back unchanged. */
export function lighten(color: string, amount: number): string {
  return mix(color, 255, amount);
}

/** `color` mixed with black by `amount` (0 to 1); a named color comes back unchanged. */
export function darken(color: string, amount: number): string {
  return mix(color, 0, amount);
}

/** A scale around `color` as its 500 stop; a named color fills every stop as it is. */
export function colorScale(color: string): ColorScale {
  return {
    100: lighten(color, 0.6),
    300: lighten(color, 0.3),
    500: color,
    700: darken(color, 0.25),
    900: darken(color, 0.5),
  };
}
