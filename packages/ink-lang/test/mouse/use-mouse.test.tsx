import { Box, Text, type DOMElement } from "ink";
import { render } from "ink-testing-library";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { mouseDisableSequence, mouseEnableSequence } from "../../src/mouse/mouse-mode";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import type { MouseEvent } from "../../src/mouse/mouse-sequence";
import type { MouseWheelEvent } from "../../src/mouse/mouse-target";
import { useMouse } from "../../src/mouse/use-mouse";
import { settle } from "../helpers/settle";

const ESC = "\u001b";

interface Call {
  name: string;
  target: string;
  event: MouseEvent | MouseWheelEvent;
}

interface TargetProps {
  name: string;
  log: Call[];
}

function Target({ name, log }: TargetProps) {
  const ref = useRef<DOMElement | null>(null);
  function record(handlerName: string) {
    return function handle(event: MouseEvent | MouseWheelEvent) {
      log.push({ name: handlerName, target: name, event });
    };
  }
  useMouse(ref, {
    onMouseDown: record("onMouseDown"),
    onMouseUp: record("onMouseUp"),
    onClick: record("onClick"),
    onContextMenu: record("onContextMenu"),
    onMouseMove: record("onMouseMove"),
    onMouseEnter: record("onMouseEnter"),
    onMouseLeave: record("onMouseLeave"),
    onWheel: record("onWheel"),
  });
  return (
    <Box ref={ref}>
      <Text>{name}</Text>
    </Box>
  );
}

interface TreeProps {
  log: Call[];
  motion?: boolean;
}

/** Two one-line boxes sized to their text: "first" on row 0 and "second" on row 1. */
function Tree({ log, motion = true }: TreeProps) {
  return (
    <MouseProvider options={{ motion }}>
      <Box flexDirection="column" alignItems="flex-start">
        <Target name="first" log={log} />
        <Target name="second" log={log} />
      </Box>
    </MouseProvider>
  );
}

function names(log: Call[]): string[] {
  const result: string[] = [];
  for (const call of log) result.push(call.name + ":" + call.target);
  return result;
}

// SGR coordinates are 1-based: column 1, row 1 is the first cell.
function press(column: number, row: number, button = 0): string {
  return `${ESC}[<${button};${column};${row}M`;
}
function release(column: number, row: number, button = 0): string {
  return `${ESC}[<${button};${column};${row}m`;
}
function move(column: number, row: number): string {
  return `${ESC}[<35;${column};${row}M`;
}
function wheel(column: number, row: number, code: number): string {
  return `${ESC}[<${code};${column};${row}M`;
}

describe("MouseProvider and useMouse", () => {
  it("writes the enable sequence to stdout at mount and the disable sequence at unmount", async () => {
    const log: Call[] = [];
    const exitListeners = process.listenerCount("exit");
    const instance = render(<Tree log={log} />);
    await settle();
    expect(instance.stdout.frames).toContain(mouseEnableSequence(true));
    expect(instance.stdout.frames).not.toContain(mouseDisableSequence(true));
    expect(process.listenerCount("exit")).toBe(exitListeners + 1);
    instance.unmount();
    expect(instance.stdout.frames).toContain(mouseDisableSequence(true));
    expect(process.listenerCount("exit")).toBe(exitListeners);
  });

  it("enables only press and button motion reporting without motion", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} motion={false} />);
    await settle();
    expect(instance.stdout.frames).toContain(mouseEnableSequence(false));
    instance.unmount();
    expect(instance.stdout.frames).toContain(mouseDisableSequence(false));
  });

  it("dispatches down, up and click to the box under the cell", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} />);
    await settle();
    instance.stdin.write(press(2, 2));
    instance.stdin.write(release(2, 2));
    await settle();
    expect(names(log)).toEqual(["onMouseDown:second", "onMouseUp:second", "onClick:second"]);
    expect(log[0]?.event).toMatchObject({ kind: "down", button: "left", x: 1, y: 1 });
    instance.unmount();
  });

  it("fires contextmenu for the right button", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} />);
    await settle();
    instance.stdin.write(press(1, 1, 2) + release(1, 1, 2));
    await settle();
    expect(names(log)).toEqual(["onMouseDown:first", "onMouseUp:first", "onContextMenu:first"]);
    instance.unmount();
  });

  it("ignores clicks outside every target and plain keys", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} />);
    await settle();
    instance.stdin.write(press(20, 1) + release(20, 1));
    instance.stdin.write("\t");
    instance.stdin.write(`${ESC}[A`);
    await settle();
    expect(log).toEqual([]);
    instance.unmount();
  });

  it("fires enter and leave once per crossing as the pointer moves", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} />);
    await settle();
    instance.stdin.write(move(1, 1));
    instance.stdin.write(move(2, 1));
    instance.stdin.write(move(1, 2));
    instance.stdin.write(move(30, 2));
    await settle();
    expect(names(log)).toEqual([
      "onMouseEnter:first",
      "onMouseMove:first",
      "onMouseMove:first",
      "onMouseLeave:first",
      "onMouseEnter:second",
      "onMouseMove:second",
      "onMouseLeave:second",
    ]);
    instance.unmount();
  });

  it("coalesces wheel ticks from one turn into a single onWheel with the tick count", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} />);
    await settle();
    instance.stdin.write(wheel(1, 1, 65) + wheel(1, 1, 65) + wheel(1, 1, 65));
    await settle();
    instance.stdin.write(wheel(1, 2, 64));
    await settle();
    instance.stdin.write(wheel(1, 2, 68));
    await settle();
    expect(names(log)).toEqual(["onWheel:first", "onWheel:second", "onWheel:second"]);
    expect(log[0]?.event).toEqual({
      direction: "down",
      ticks: 3,
      x: 0,
      y: 0,
      shift: false,
      alt: false,
      ctrl: false,
    });
    expect(log[1]?.event).toMatchObject({ direction: "up", ticks: 1 });
    expect(log[2]?.event).toMatchObject({ direction: "up", ticks: 1, shift: true });
    instance.unmount();
  });

  it("reassembles a sequence split across two stdin chunks", async () => {
    const log: Call[] = [];
    const instance = render(<Tree log={log} />);
    await settle();
    const whole = press(1, 1);
    instance.stdin.write(whole.slice(0, 4));
    instance.stdin.write(whole.slice(4));
    await settle();
    expect(names(log)).toEqual(["onMouseDown:first"]);
    instance.unmount();
  });

  it("is a no-op for a target rendered without a provider", async () => {
    const log: Call[] = [];
    const instance = render(<Target name="alone" log={log} />);
    await settle();
    instance.stdin.write(press(1, 1) + release(1, 1));
    await settle();
    expect(log).toEqual([]);
    expect(instance.stdout.frames).not.toContain(mouseEnableSequence(true));
    instance.unmount();
  });
});
