import { describe, expect, it } from "vitest";
import { createMouseDispatcher } from "../../src/mouse/mouse-dispatcher";
import type { MouseEvent } from "../../src/mouse/mouse-sequence";
import type { MouseHandlers, MouseTarget, MouseWheelEvent } from "../../src/mouse/mouse-target";

interface Recorded {
  name: string;
  target: string;
  event: MouseEvent | MouseWheelEvent;
}

function makeTarget(name: string, log: Recorded[]): MouseTarget {
  const handlers: MouseHandlers = {};
  const names = [
    "onMouseDown",
    "onMouseUp",
    "onClick",
    "onContextMenu",
    "onMouseMove",
    "onMouseEnter",
    "onMouseLeave",
    "onDoubleClick",
  ] as const;
  for (const handlerName of names) {
    handlers[handlerName] = function record(event: MouseEvent) {
      log.push({ name: handlerName, target: name, event });
    };
  }
  handlers.onWheel = function recordWheel(event: MouseWheelEvent) {
    log.push({ name: "onWheel", target: name, event });
  };
  return { ref: { current: null }, handlers };
}

function at(kind: MouseEvent["kind"], button: MouseEvent["button"], x = 0, y = 0): MouseEvent {
  return { kind, button, x, y, shift: false, alt: false, ctrl: false };
}

function wheel(direction: "up" | "down", shift = false): MouseEvent {
  return {
    kind: "wheel",
    button: "none",
    x: 0,
    y: 0,
    shift,
    alt: false,
    ctrl: false,
    wheelDirection: direction,
  };
}

function names(log: Recorded[]): string[] {
  const result: string[] = [];
  for (const entry of log) result.push(entry.name + ":" + entry.target);
  return result;
}

describe("createMouseDispatcher", () => {
  it("fires down, up and click for a left press and release on the same target", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("down", "left"), [a]);
    dispatcher.handle(at("up", "left"), [a]);
    expect(names(log)).toEqual(["onMouseDown:a", "onMouseUp:a", "onClick:a"]);
  });

  it("does not click when the release lands elsewhere; the pressed target still gets the release", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const b = makeTarget("b", log);
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("down", "left"), [a]);
    dispatcher.handle(at("up", "left"), [b]);
    dispatcher.handle(at("down", "left"), [a]);
    dispatcher.handle(at("up", "left"), []);
    expect(names(log)).toEqual(["onMouseDown:a", "onMouseUp:a", "onMouseDown:a", "onMouseUp:a"]);
  });

  it("fires contextmenu on a right button release and never a click", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("down", "right"), [a]);
    dispatcher.handle(at("up", "right"), [a]);
    expect(names(log)).toEqual(["onMouseDown:a", "onMouseUp:a", "onContextMenu:a"]);
  });

  it("derives enter and leave from consecutive moves, once per crossing", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const b = makeTarget("b", log);
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("move", "none", 0, 0), [a]);
    dispatcher.handle(at("move", "none", 1, 0), [a]);
    dispatcher.handle(at("move", "none", 0, 1), [b]);
    dispatcher.handle(at("move", "none", 5, 5), []);
    dispatcher.handle(at("move", "none", 6, 5), []);
    expect(names(log)).toEqual([
      "onMouseEnter:a",
      "onMouseMove:a",
      "onMouseMove:a",
      "onMouseLeave:a",
      "onMouseEnter:b",
      "onMouseMove:b",
      "onMouseLeave:b",
    ]);
  });

  it("forgets a removed target without firing leave", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const b = makeTarget("b", log);
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("move", "none"), [a]);
    dispatcher.forget(a);
    dispatcher.handle(at("move", "none"), [b]);
    expect(names(log)).toEqual([
      "onMouseEnter:a",
      "onMouseMove:a",
      "onMouseEnter:b",
      "onMouseMove:b",
    ]);
  });

  it("coalesces wheel ticks per target, direction and modifiers until flushed", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const b = makeTarget("b", log);
    const dispatcher = createMouseDispatcher();
    expect(dispatcher.hasPendingWheel()).toBe(false);
    dispatcher.handle(wheel("down"), [a]);
    dispatcher.handle(wheel("down"), [a]);
    dispatcher.handle(wheel("down"), [a]);
    dispatcher.handle(wheel("up"), [a]);
    dispatcher.handle(wheel("down", true), [a]);
    dispatcher.handle(wheel("down"), [b]);
    dispatcher.handle(wheel("down"), []);
    expect(log).toEqual([]);
    expect(dispatcher.hasPendingWheel()).toBe(true);
    dispatcher.flushWheel();
    expect(dispatcher.hasPendingWheel()).toBe(false);
    expect(names(log)).toEqual(["onWheel:a", "onWheel:a", "onWheel:a", "onWheel:b"]);
    const first = log[0]?.event as MouseWheelEvent;
    expect(first).toEqual({
      direction: "down",
      ticks: 3,
      x: 0,
      y: 0,
      shift: false,
      alt: false,
      ctrl: false,
    });
    expect((log[1]?.event as MouseWheelEvent).direction).toBe("up");
    expect((log[2]?.event as MouseWheelEvent).shift).toBe(true);
    expect((log[3]?.event as MouseWheelEvent).ticks).toBe(1);
    dispatcher.flushWheel();
    expect(log).toHaveLength(4);
  });

  it("bubbles an event to the nearest ancestor that handles it", () => {
    const log: Recorded[] = [];
    const strip = makeTarget("strip", log);
    const trigger: MouseTarget = {
      ref: { current: null },
      handlers: {
        onClick: function onClick(event) {
          log.push({ name: "onClick", target: "trigger", event });
        },
      },
    };
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("down", "left"), [trigger, strip]);
    dispatcher.handle(at("up", "left"), [trigger, strip]);
    dispatcher.handle(wheel("down"), [trigger, strip]);
    dispatcher.flushWheel();
    dispatcher.handle(at("move", "none"), [trigger, strip]);
    expect(names(log)).toEqual([
      "onMouseDown:strip",
      "onMouseUp:strip",
      "onClick:trigger",
      "onWheel:strip",
      "onMouseMove:strip",
    ]);
  });

  it("tracks hover on the innermost box only", () => {
    const log: Recorded[] = [];
    const strip = makeTarget("strip", log);
    const inner: MouseTarget = { ref: { current: null }, handlers: {} };
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("move", "none"), [inner, strip]);
    dispatcher.handle(at("move", "none"), [strip]);
    expect(names(log)).toEqual(["onMouseMove:strip", "onMouseEnter:strip", "onMouseMove:strip"]);
  });
});

describe("createMouseDispatcher capture and double click", () => {
  it("routes moves and the release to the pressed target while the button is held", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const b = makeTarget("b", log);
    const dispatcher = createMouseDispatcher();
    dispatcher.handle(at("down", "left", 0, 0), [a]);
    dispatcher.handle(at("move", "left", 5, 0), [b]);
    dispatcher.handle(at("move", "left", 9, 0), []);
    dispatcher.handle(at("up", "left", 9, 0), []);
    expect(names(log)).toEqual([
      "onMouseDown:a",
      "onMouseEnter:b",
      "onMouseMove:a",
      "onMouseLeave:b",
      "onMouseMove:a",
      "onMouseUp:a",
    ]);
  });

  it("fires double click after two clicks on one target within the threshold", () => {
    const log: Recorded[] = [];
    const a = makeTarget("a", log);
    const b = makeTarget("b", log);
    let time = 1000;
    const dispatcher = createMouseDispatcher({
      now: function now() {
        return time;
      },
    });
    dispatcher.handle(at("down", "left"), [a]);
    dispatcher.handle(at("up", "left"), [a]);
    time += 100;
    dispatcher.handle(at("down", "left"), [a]);
    dispatcher.handle(at("up", "left"), [a]);
    expect(names(log)).toEqual([
      "onMouseDown:a",
      "onMouseUp:a",
      "onClick:a",
      "onMouseDown:a",
      "onMouseUp:a",
      "onClick:a",
      "onDoubleClick:a",
    ]);
    log.length = 0;
    time += 1000;
    dispatcher.handle(at("down", "left"), [a]);
    dispatcher.handle(at("up", "left"), [a]);
    time += 100;
    dispatcher.handle(at("down", "left"), [b]);
    dispatcher.handle(at("up", "left"), [b]);
    expect(names(log)).toEqual([
      "onMouseDown:a",
      "onMouseUp:a",
      "onClick:a",
      "onMouseDown:b",
      "onMouseUp:b",
      "onClick:b",
    ]);
  });
});
