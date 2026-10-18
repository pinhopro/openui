import { describe, expect, it } from "vitest";
import {
  DISABLE_ANY_MOTION,
  DISABLE_BUTTON_MOTION,
  DISABLE_PRESS_REPORTING,
  DISABLE_SGR_EXTENDED,
  ENABLE_ANY_MOTION,
  ENABLE_BUTTON_MOTION,
  ENABLE_PRESS_REPORTING,
  ENABLE_SGR_EXTENDED,
  mouseDisableSequence,
  mouseEnableSequence,
} from "../../src/mouse/mouse-mode";
import {
  parseMouseSequence,
  splitMouseSequences,
  type MouseEvent,
} from "../../src/mouse/mouse-sequence";

const ESC = "\u001b";

function event(partial: Partial<MouseEvent>): MouseEvent {
  return {
    kind: "down",
    button: "left",
    x: 0,
    y: 0,
    shift: false,
    alt: false,
    ctrl: false,
    ...partial,
  };
}

describe("parseMouseSequence", () => {
  it("decodes a left button press with 0-based coordinates", () => {
    expect(parseMouseSequence(`${ESC}[<0;5;3M`)).toEqual(
      event({ kind: "down", button: "left", x: 4, y: 2 }),
    );
  });

  it("decodes a left button release", () => {
    expect(parseMouseSequence(`${ESC}[<0;5;3m`)).toEqual(
      event({ kind: "up", button: "left", x: 4, y: 2 }),
    );
  });

  it("decodes middle button press and release", () => {
    expect(parseMouseSequence(`${ESC}[<1;10;1M`)).toEqual(
      event({ kind: "down", button: "middle", x: 9, y: 0 }),
    );
    expect(parseMouseSequence(`${ESC}[<1;10;1m`)).toEqual(
      event({ kind: "up", button: "middle", x: 9, y: 0 }),
    );
  });

  it("decodes right button press and release", () => {
    expect(parseMouseSequence(`${ESC}[<2;1;1M`)).toEqual(
      event({ kind: "down", button: "right", x: 0, y: 0 }),
    );
    expect(parseMouseSequence(`${ESC}[<2;1;1m`)).toEqual(
      event({ kind: "up", button: "right", x: 0, y: 0 }),
    );
  });

  it("decodes motion with no button held and with the left button held", () => {
    expect(parseMouseSequence(`${ESC}[<35;7;8M`)).toEqual(
      event({ kind: "move", button: "none", x: 6, y: 7 }),
    );
    expect(parseMouseSequence(`${ESC}[<32;7;8M`)).toEqual(
      event({ kind: "move", button: "left", x: 6, y: 7 }),
    );
  });

  it("decodes wheel up and wheel down", () => {
    expect(parseMouseSequence(`${ESC}[<64;3;4M`)).toEqual(
      event({ kind: "wheel", button: "none", x: 2, y: 3, wheelDirection: "up" }),
    );
    expect(parseMouseSequence(`${ESC}[<65;3;4M`)).toEqual(
      event({ kind: "wheel", button: "none", x: 2, y: 3, wheelDirection: "down" }),
    );
  });

  it("decodes horizontal wheel ticks", () => {
    expect(parseMouseSequence(`${ESC}[<66;3;4M`)?.wheelDirection).toBe("left");
    expect(parseMouseSequence(`${ESC}[<67;3;4M`)?.wheelDirection).toBe("right");
  });

  it("decodes the modifier bits", () => {
    expect(parseMouseSequence(`${ESC}[<68;3;4M`)).toEqual(
      event({ kind: "wheel", button: "none", x: 2, y: 3, shift: true, wheelDirection: "up" }),
    );
    expect(parseMouseSequence(`${ESC}[<8;1;1M`)?.alt).toBe(true);
    expect(parseMouseSequence(`${ESC}[<16;1;1M`)?.ctrl).toBe(true);
    expect(parseMouseSequence(`${ESC}[<28;1;1M`)).toEqual(
      event({ kind: "down", button: "left", shift: true, alt: true, ctrl: true }),
    );
  });

  it("returns null for anything that is not an SGR mouse sequence", () => {
    expect(parseMouseSequence("a")).toBeNull();
    expect(parseMouseSequence(`${ESC}[A`)).toBeNull();
    expect(parseMouseSequence(`${ESC}[<0;5;3`)).toBeNull();
    expect(parseMouseSequence(`${ESC}[<0;5M`)).toBeNull();
    expect(parseMouseSequence(`${ESC}[M   `)).toBeNull();
  });
});

describe("splitMouseSequences", () => {
  it("extracts every mouse sequence from a chunk and ignores the rest", () => {
    const chunk = `${ESC}[<0;5;3M${ESC}[A${ESC}[<0;5;3mq`;
    const split = splitMouseSequences(chunk);
    expect(split.events).toEqual([
      event({ kind: "down", button: "left", x: 4, y: 2 }),
      event({ kind: "up", button: "left", x: 4, y: 2 }),
    ]);
    expect(split.pending).toBe("");
  });

  it("keeps an incomplete trailing sequence for the next chunk", () => {
    const first = splitMouseSequences(`${ESC}[<64;3`);
    expect(first.events).toEqual([]);
    expect(first.pending).toBe(`${ESC}[<64;3`);
    const second = splitMouseSequences(first.pending + ";4M");
    expect(second.events).toEqual([
      event({ kind: "wheel", button: "none", x: 2, y: 3, wheelDirection: "up" }),
    ]);
    expect(second.pending).toBe("");
  });

  it("returns no events and nothing pending for plain keys", () => {
    expect(splitMouseSequences("\t")).toEqual({ events: [], pending: "" });
    expect(splitMouseSequences("")).toEqual({ events: [], pending: "" });
  });
});

describe("mouse modes", () => {
  it("defines the xterm mode strings", () => {
    expect(ENABLE_PRESS_REPORTING).toBe(`${ESC}[?1000h`);
    expect(ENABLE_BUTTON_MOTION).toBe(`${ESC}[?1002h`);
    expect(ENABLE_ANY_MOTION).toBe(`${ESC}[?1003h`);
    expect(ENABLE_SGR_EXTENDED).toBe(`${ESC}[?1006h`);
    expect(DISABLE_PRESS_REPORTING).toBe(`${ESC}[?1000l`);
    expect(DISABLE_BUTTON_MOTION).toBe(`${ESC}[?1002l`);
    expect(DISABLE_ANY_MOTION).toBe(`${ESC}[?1003l`);
    expect(DISABLE_SGR_EXTENDED).toBe(`${ESC}[?1006l`);
  });

  it("enables press, button motion and SGR reporting, plus any-motion when asked", () => {
    expect(mouseEnableSequence(false)).toBe(
      ENABLE_PRESS_REPORTING + ENABLE_BUTTON_MOTION + ENABLE_SGR_EXTENDED,
    );
    expect(mouseEnableSequence(true)).toBe(
      ENABLE_PRESS_REPORTING + ENABLE_BUTTON_MOTION + ENABLE_ANY_MOTION + ENABLE_SGR_EXTENDED,
    );
  });

  it("disables the same modes in reverse order", () => {
    expect(mouseDisableSequence(false)).toBe(
      DISABLE_SGR_EXTENDED + DISABLE_BUTTON_MOTION + DISABLE_PRESS_REPORTING,
    );
    expect(mouseDisableSequence(true)).toBe(
      DISABLE_SGR_EXTENDED + DISABLE_ANY_MOTION + DISABLE_BUTTON_MOTION + DISABLE_PRESS_REPORTING,
    );
  });
});
