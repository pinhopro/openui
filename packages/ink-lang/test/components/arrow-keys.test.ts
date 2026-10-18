import type { Key } from "ink";
import { describe, expect, it } from "vitest";
import { horizontalStep, verticalStep } from "../../src/components/arrow-keys";

function key(overrides: Partial<Key>): Key {
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
    insert: false,
    f1: false,
    f2: false,
    f3: false,
    f4: false,
    f5: false,
    f6: false,
    f7: false,
    f8: false,
    f9: false,
    f10: false,
    f11: false,
    f12: false,
    eventType: "press",
    ...overrides,
  } as Key;
}

describe("horizontalStep", () => {
  it("is -1 for Left, 1 for Right and 0 for anything else", () => {
    expect(horizontalStep(key({ leftArrow: true }))).toBe(-1);
    expect(horizontalStep(key({ rightArrow: true }))).toBe(1);
    expect(horizontalStep(key({ upArrow: true }))).toBe(0);
  });

  it("ignores kitty release events", () => {
    expect(horizontalStep(key({ rightArrow: true, eventType: "release" }))).toBe(0);
  });
});

describe("verticalStep", () => {
  it("is -1 for Up, 1 for Down and 0 for anything else", () => {
    expect(verticalStep(key({ upArrow: true }))).toBe(-1);
    expect(verticalStep(key({ downArrow: true }))).toBe(1);
    expect(verticalStep(key({ leftArrow: true }))).toBe(0);
  });

  it("ignores kitty release events", () => {
    expect(verticalStep(key({ downArrow: true, eventType: "release" }))).toBe(0);
  });
});
