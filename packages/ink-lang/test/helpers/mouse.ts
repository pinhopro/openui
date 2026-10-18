/** Raw SGR mouse reports for a 0-based layout cell (the terminal counts from 1). */
const ESC = "\u001b";

const LEFT = 0;
const RIGHT = 2;
const MOTION = 35;
const LEFT_DRAG = 32;
const WHEEL_UP = 64;
const WHEEL_DOWN = 65;

function report(code: number, x: number, y: number, final: string): string {
  return `${ESC}[<${code};${x + 1};${y + 1}${final}`;
}

export const MOUSE = {
  press: function press(x: number, y: number): string {
    return report(LEFT, x, y, "M");
  },
  release: function release(x: number, y: number): string {
    return report(LEFT, x, y, "m");
  },
  click: function click(x: number, y: number): string {
    return report(LEFT, x, y, "M") + report(LEFT, x, y, "m");
  },
  rightClick: function rightClick(x: number, y: number): string {
    return report(RIGHT, x, y, "M") + report(RIGHT, x, y, "m");
  },
  move: function move(x: number, y: number): string {
    return report(MOTION, x, y, "M");
  },
  /** A move with the left button held (xterm mode 1002 reports these as drags). */
  drag: function drag(x: number, y: number): string {
    return report(LEFT_DRAG, x, y, "M");
  },
  wheelUp: function wheelUp(x: number, y: number, ticks = 1): string {
    return report(WHEEL_UP, x, y, "M").repeat(ticks);
  },
  wheelDown: function wheelDown(x: number, y: number, ticks = 1): string {
    return report(WHEEL_DOWN, x, y, "M").repeat(ticks);
  },
};
