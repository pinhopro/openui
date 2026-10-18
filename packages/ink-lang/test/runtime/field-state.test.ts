import { createStore } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import {
  getFieldValue,
  getFormPayload,
  setFieldValue,
  unwrapFieldValue,
} from "../../src/runtime/field-state";

describe("unwrapFieldValue", () => {
  it("returns the value inside a field wrapper", () => {
    expect(unwrapFieldValue({ value: "hello", componentType: "Input" })).toBe("hello");
  });

  it("returns other values untouched", () => {
    expect(unwrapFieldValue(5)).toBe(5);
    expect(unwrapFieldValue([1, 2])).toEqual([1, 2]);
    expect(unwrapFieldValue({ other: 1 })).toEqual({ other: 1 });
    expect(unwrapFieldValue(undefined)).toBeUndefined();
  });
});

describe("setFieldValue and getFieldValue", () => {
  it("nests a form field under the form name as a wrapper", () => {
    const store = createStore();
    setFieldValue(store, "signup", "Input", "email", "a@b.test");
    expect(store.get("signup")).toEqual({ email: { value: "a@b.test", componentType: "Input" } });
    expect(getFieldValue(store, "signup", "email")).toBe("a@b.test");
  });

  it("keeps sibling fields when another field of the same form is set", () => {
    const store = createStore();
    setFieldValue(store, "signup", "Input", "email", "a@b.test");
    setFieldValue(store, "signup", "Input", "name", "Ada");
    expect(getFieldValue(store, "signup", "email")).toBe("a@b.test");
    expect(getFieldValue(store, "signup", "name")).toBe("Ada");
  });

  it("writes a page-level field as a top-level wrapper when there is no form", () => {
    const store = createStore();
    setFieldValue(store, undefined, "Input", "search", "late");
    expect(store.get("search")).toEqual({ value: "late", componentType: "Input" });
    expect(getFieldValue(store, undefined, "search")).toBe("late");
  });

  it("treats an empty form name as page level, like react-lang", () => {
    const store = createStore();
    setFieldValue(store, "", "Input", "search", "late");
    expect(store.get("search")).toEqual({ value: "late", componentType: "Input" });
    expect(store.get("")).toBeUndefined();
    expect(getFieldValue(store, "", "search")).toBe("late");
    expect(getFormPayload(store, "")).toEqual({
      search: { value: "late", componentType: "Input" },
    });
  });

  it("returns undefined for a field that was never set", () => {
    const store = createStore();
    expect(getFieldValue(store, "signup", "email")).toBeUndefined();
    expect(getFieldValue(store, undefined, "email")).toBeUndefined();
  });
});

describe("getFormPayload", () => {
  it("returns only the named form when it has data", () => {
    const store = createStore();
    setFieldValue(store, "signup", "Input", "email", "a@b.test");
    store.set("$other", 1);
    expect(getFormPayload(store, "signup")).toEqual({
      signup: { email: { value: "a@b.test", componentType: "Input" } },
    });
  });

  it("returns the whole snapshot without a form name", () => {
    const store = createStore();
    store.set("$note", "new");
    expect(getFormPayload(store, undefined)).toEqual({ $note: "new" });
  });

  it("returns the whole snapshot when the named form has no data yet", () => {
    const store = createStore();
    store.set("$note", "new");
    expect(getFormPayload(store, "signup")).toEqual({ $note: "new" });
  });
});
