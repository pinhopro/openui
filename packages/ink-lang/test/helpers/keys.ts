/** Raw terminal sequences for the keys the tests press. */
export const KEYS = {
  TAB: "\t",
  SHIFT_TAB: "\u001b[Z",
  ENTER: "\r",
  SPACE: " ",
  BACKSPACE: "\u007f",
  LEFT: "\u001b[D",
  RIGHT: "\u001b[C",
  UP: "\u001b[A",
  DOWN: "\u001b[B",
  CTRL_LEFT: "\u001b[1;5D",
  CTRL_RIGHT: "\u001b[1;5C",
  CTRL_UP: "\u001b[1;5A",
  CTRL_DOWN: "\u001b[1;5B",
  PAGE_UP: "\u001b[5~",
  PAGE_DOWN: "\u001b[6~",
};
