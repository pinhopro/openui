import type { Key } from "ink";
import { describe, expect, it } from "vitest";
import {
  applyKeyToEditor,
  maskValue,
  splitForCursor,
  type EditorState,
} from "../../src/components/text-editing";

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

const typed: EditorState = { value: "ac", cursor: 2 };

describe("applyKeyToEditor", () => {
  it("inserts typed text at the cursor", () => {
    expect(applyKeyToEditor(typed, "b", makeKey())).toEqual({ value: "acb", cursor: 3 });
    expect(applyKeyToEditor({ value: "ac", cursor: 1 }, "b", makeKey())).toEqual({
      value: "abc",
      cursor: 2,
    });
  });

  it("inserts pasted text as a whole", () => {
    expect(applyKeyToEditor({ value: "", cursor: 0 }, "hello", makeKey())).toEqual({
      value: "hello",
      cursor: 5,
    });
  });

  it("removes the character before the cursor on backspace", () => {
    expect(applyKeyToEditor(typed, "", makeKey({ backspace: true }))).toEqual({
      value: "a",
      cursor: 1,
    });
    expect(applyKeyToEditor({ value: "ac", cursor: 0 }, "", makeKey({ backspace: true }))).toEqual({
      value: "ac",
      cursor: 0,
    });
  });

  it("removes the character under the cursor on delete", () => {
    expect(applyKeyToEditor({ value: "ac", cursor: 0 }, "", makeKey({ delete: true }))).toEqual({
      value: "c",
      cursor: 0,
    });
  });

  it("moves the cursor with the arrows inside the bounds", () => {
    expect(applyKeyToEditor(typed, "", makeKey({ leftArrow: true })).cursor).toBe(1);
    expect(
      applyKeyToEditor({ value: "ac", cursor: 0 }, "", makeKey({ leftArrow: true })).cursor,
    ).toBe(0);
    expect(applyKeyToEditor(typed, "", makeKey({ rightArrow: true })).cursor).toBe(2);
    expect(
      applyKeyToEditor({ value: "ac", cursor: 0 }, "", makeKey({ rightArrow: true })).cursor,
    ).toBe(1);
  });

  it("jumps with home and end", () => {
    expect(applyKeyToEditor(typed, "", makeKey({ home: true })).cursor).toBe(0);
    expect(applyKeyToEditor({ value: "ac", cursor: 0 }, "", makeKey({ end: true })).cursor).toBe(2);
  });

  it("leaves the state alone for Enter, Tab, Escape and modifier keys", () => {
    expect(applyKeyToEditor(typed, "\r", makeKey({ return: true }))).toEqual(typed);
    expect(applyKeyToEditor(typed, "\t", makeKey({ tab: true }))).toEqual(typed);
    expect(applyKeyToEditor(typed, "", makeKey({ escape: true }))).toEqual(typed);
    expect(applyKeyToEditor(typed, "c", makeKey({ ctrl: true }))).toEqual(typed);
    expect(applyKeyToEditor(typed, "c", makeKey({ meta: true }))).toEqual(typed);
    expect(applyKeyToEditor(typed, "", makeKey({ upArrow: true }))).toEqual(typed);
  });

  it("clamps a cursor that is past the end of the value", () => {
    expect(applyKeyToEditor({ value: "a", cursor: 5 }, "b", makeKey())).toEqual({
      value: "ab",
      cursor: 2,
    });
  });
});

describe("applyKeyToEditor with the kitty keyboard protocol", () => {
  it("ignores key release events", () => {
    expect(applyKeyToEditor(typed, "b", makeKey({ eventType: "release" }))).toEqual(typed);
    expect(applyKeyToEditor(typed, "", makeKey({ backspace: true, eventType: "release" }))).toEqual(
      typed,
    );
  });

  it("treats press and repeat events like plain keys", () => {
    expect(applyKeyToEditor(typed, "b", makeKey({ eventType: "press" })).value).toBe("acb");
    expect(applyKeyToEditor(typed, "b", makeKey({ eventType: "repeat" })).value).toBe(
      "acbb".slice(0, 3),
    );
  });
});

describe("applyKeyToEditor with graphemes", () => {
  it("moves and deletes whole characters outside the BMP", () => {
    const emoji: EditorState = { value: "a😀", cursor: 2 };
    const left = applyKeyToEditor(emoji, "", makeKey({ leftArrow: true }));
    expect(left.cursor).toBe(1);
    expect(applyKeyToEditor(left, "", makeKey({ backspace: true }))).toEqual({
      value: "😀",
      cursor: 0,
    });
    expect(applyKeyToEditor(emoji, "", makeKey({ backspace: true }))).toEqual({
      value: "a",
      cursor: 1,
    });
  });
});

describe("splitForCursor", () => {
  it("splits the value around the character under the cursor", () => {
    expect(splitForCursor("abc", 1)).toEqual({ before: "a", at: "b", after: "c" });
  });

  it("keeps a character outside the BMP whole under the cursor", () => {
    expect(splitForCursor("a😀b", 1)).toEqual({ before: "a", at: "😀", after: "b" });
  });

  it("uses a space as the cursor cell at the end of the value", () => {
    expect(splitForCursor("abc", 3)).toEqual({ before: "abc", at: " ", after: "" });
    expect(splitForCursor("", 0)).toEqual({ before: "", at: " ", after: "" });
  });
});

describe("maskValue", () => {
  it("replaces every character with the mask", () => {
    expect(maskValue("abc", "*")).toBe("***");
    expect(maskValue("", "*")).toBe("");
    expect(maskValue("a😀", "*")).toBe("**");
  });
});
