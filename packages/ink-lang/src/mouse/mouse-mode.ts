/** xterm private modes that make the terminal report the mouse on stdin. */
const ESC = "\u001b";

/** Mode 1000: report button presses and releases. */
export const ENABLE_PRESS_REPORTING = ESC + "[?1000h";
export const DISABLE_PRESS_REPORTING = ESC + "[?1000l";
/** Mode 1002: also report motion while a button is held (drags). */
export const ENABLE_BUTTON_MOTION = ESC + "[?1002h";
export const DISABLE_BUTTON_MOTION = ESC + "[?1002l";
/** Mode 1003: report every motion, buttons held or not (hover). */
export const ENABLE_ANY_MOTION = ESC + "[?1003h";
export const DISABLE_ANY_MOTION = ESC + "[?1003l";
/** Mode 1006: SGR encoding (`ESC [ < b ; x ; y M`), unlimited coordinates and distinct releases. */
export const ENABLE_SGR_EXTENDED = ESC + "[?1006h";
export const DISABLE_SGR_EXTENDED = ESC + "[?1006l";

/** Everything to write to stdout to start mouse reporting; `motion` adds hover tracking. */
export function mouseEnableSequence(motion: boolean): string {
  let sequence = ENABLE_PRESS_REPORTING + ENABLE_BUTTON_MOTION;
  if (motion) sequence += ENABLE_ANY_MOTION;
  return sequence + ENABLE_SGR_EXTENDED;
}

/** The counterpart of `mouseEnableSequence`, in reverse order. */
export function mouseDisableSequence(motion: boolean): string {
  let sequence = DISABLE_SGR_EXTENDED;
  if (motion) sequence += DISABLE_ANY_MOTION;
  return sequence + DISABLE_BUTTON_MOTION + DISABLE_PRESS_REPORTING;
}
