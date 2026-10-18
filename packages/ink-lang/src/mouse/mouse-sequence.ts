export type MouseEventKind = "down" | "up" | "move" | "wheel";
export type MouseButton = "left" | "middle" | "right" | "none";
export type WheelDirection = "up" | "down" | "left" | "right";

/** One decoded SGR mouse report. `x` and `y` are 0-based terminal cells. */
export interface MouseEvent {
  kind: MouseEventKind;
  button: MouseButton;
  x: number;
  y: number;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  wheelDirection?: WheelDirection;
}

/** The mouse events found in a stdin chunk plus an unfinished trailing sequence, if any. */
export interface MouseChunk {
  events: MouseEvent[];
  pending: string;
}

const ESC = "\u001b";
const SGR_PREFIX = ESC + "[<";
// ESC [ < button ; column ; row then M (press, motion, wheel) or m (release).
const SGR_SEQUENCE = /\u001b\[<(\d+);(\d+);(\d+)([Mm])/g;
const SGR_WHOLE = /^\u001b\[<(\d+);(\d+);(\d+)([Mm])$/;

const BUTTON_MASK = 3;
const SHIFT_BIT = 4;
const ALT_BIT = 8;
const CTRL_BIT = 16;
const MOTION_BIT = 32;
const WHEEL_BIT = 64;

const BUTTONS: MouseButton[] = ["left", "middle", "right", "none"];
const WHEEL_DIRECTIONS: WheelDirection[] = ["up", "down", "left", "right"];

function decode(code: number, column: number, row: number, final: string): MouseEvent {
  const low = code & BUTTON_MASK;
  const base: MouseEvent = {
    kind: "down",
    button: BUTTONS[low] as MouseButton,
    x: column - 1,
    y: row - 1,
    shift: (code & SHIFT_BIT) !== 0,
    alt: (code & ALT_BIT) !== 0,
    ctrl: (code & CTRL_BIT) !== 0,
  };
  if ((code & WHEEL_BIT) !== 0) {
    base.kind = "wheel";
    base.button = "none";
    base.wheelDirection = WHEEL_DIRECTIONS[low] as WheelDirection;
    return base;
  }
  if ((code & MOTION_BIT) !== 0) {
    base.kind = "move";
    return base;
  }
  base.kind = final === "M" ? "down" : "up";
  return base;
}

/** Decodes one complete SGR mouse sequence, or returns null for anything else. */
export function parseMouseSequence(sequence: string): MouseEvent | null {
  const match = SGR_WHOLE.exec(sequence);
  if (match === null) return null;
  return decode(Number(match[1]), Number(match[2]), Number(match[3]), match[4] as string);
}

/**
 * Pulls every complete SGR mouse sequence out of a stdin chunk. Keys and other
 * terminal replies in the chunk are skipped. A sequence cut off at the end of
 * the chunk is returned as `pending` so the caller can prepend it to the next one.
 */
export function splitMouseSequences(chunk: string): MouseChunk {
  const events: MouseEvent[] = [];
  SGR_SEQUENCE.lastIndex = 0;
  let match = SGR_SEQUENCE.exec(chunk);
  while (match !== null) {
    events.push(decode(Number(match[1]), Number(match[2]), Number(match[3]), match[4] as string));
    match = SGR_SEQUENCE.exec(chunk);
  }
  const start = chunk.lastIndexOf(SGR_PREFIX);
  if (start === -1) return { events, pending: "" };
  const tail = chunk.slice(start);
  const isComplete = SGR_WHOLE.test(tail) || /[Mm]/.test(tail);
  return { events, pending: isComplete ? "" : tail };
}
