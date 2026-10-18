import type { Key } from "ink";
import { describe, expect, it } from "vitest";
import { isPressKey } from "../../src/components/button-keys";

function makeKey(overrides: Partial<Key> = {}): Key {
  return {
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    pageDown: false,
    pageUp: false,
    home: false,
    end: false,
    return: false,
    escape: false,
    ctrl: false,
    shift: false,
    tab: false,
    backspace: false,
    delete: false,
    meta: false,
    super: false,
    hyper: false,
    capsLock: false,
    numLock: false,
    ...overrides,
  };
}

describe("isPressKey", () => {
  it("accepts Enter and Space", () => {
    expect(isPressKey("\r", makeKey({ return: true }))).toBe(true);
    expect(isPressKey(" ", makeKey())).toBe(true);
  });

  it("rejects other keys", () => {
    expect(isPressKey("a", makeKey())).toBe(false);
    expect(isPressKey("", makeKey({ tab: true }))).toBe(false);
  });

  it("ignores kitty-protocol release events and accepts press and repeat", () => {
    expect(isPressKey("\r", makeKey({ return: true, eventType: "release" }))).toBe(false);
    expect(isPressKey("\r", makeKey({ return: true, eventType: "press" }))).toBe(true);
    expect(isPressKey("\r", makeKey({ return: true, eventType: "repeat" }))).toBe(true);
  });
});
