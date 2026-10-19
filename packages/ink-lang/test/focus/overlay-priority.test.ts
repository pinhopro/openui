import { describe, expect, it } from "vitest";
import {
  createFocusRegistry,
  type FocusEntry,
  type FocusRegistry,
} from "../../src/focus/focus-registry";
import {
  heldPriority,
  hoverKeepsFocus,
  rearmHoveredFocus,
  releaseFocusedPriority,
  type PriorityInput,
} from "../../src/focus/held-priority";
import { priorityOverlay } from "../../src/focus/overlay-priority";

/** A focus stop rendered in the overlay `overlay` (null for the page). */
function stop(id: string, overlay: string | null): FocusEntry {
  return {
    id,
    ref: { current: null },
    isActive: true,
    arrows: {},
    component: "Button",
    name: id,
    path: null,
    overlay,
  };
}

describe("priorityOverlay", () => {
  it("is the overlay of the focused stop, whatever is hovered", () => {
    expect(priorityOverlay(null, stop("close", "d"))).toBe("d");
    expect(priorityOverlay("other", stop("close", "d"))).toBe("d");
  });

  it("is the hovered overlay while the focused stop is on the page", () => {
    expect(priorityOverlay("d", stop("a", null))).toBe("d");
  });

  it("is the hovered overlay while nothing has focus", () => {
    expect(priorityOverlay("d", null)).toBe("d");
  });

  it("is null with no overlay hovered and focus on the page or nowhere", () => {
    expect(priorityOverlay(null, stop("a", null))).toBeNull();
    expect(priorityOverlay(null, null)).toBeNull();
  });
});

interface DialogStops {
  registry: FocusRegistry;
  a: FocusEntry;
  close: FocusEntry;
  done: FocusEntry;
}

/** A registry holding page stop A and dialog stops Close and Done (overlay "d"). */
function dialogRegistry(): DialogStops {
  const registry = createFocusRegistry();
  const a = stop("a", null);
  const close = stop("close", "d");
  const done = stop("done", "d");
  registry.register(a);
  registry.register(close);
  registry.register(done);
  return { registry, a, close, done };
}

/** The navigator's input with nothing released yet. */
function input(hovered: string | null): PriorityInput {
  return { hovered, released: new Set() };
}

describe("heldPriority and the Escape release", () => {
  it("releases the focused stop's overlay on Escape: its stop then holds no priority", () => {
    const { registry, close } = dialogRegistry();
    const state = input(null);
    expect(heldPriority(registry, state, close)).toBe("d");
    expect(releaseFocusedPriority(registry, state, close, null)).toBe(true);
    expect(state.released.has("d")).toBe(true);
    expect(heldPriority(registry, state, close)).toBeNull();
  });

  it("releases a dialog inside a modal, never the active modal's own overlay", () => {
    const { registry, close } = dialogRegistry();
    const modalStop = stop("ok", "m");
    registry.register(modalStop);
    const state = input(null);
    expect(releaseFocusedPriority(registry, state, modalStop, "m")).toBe(false);
    expect(state.released.size).toBe(0);
    expect(releaseFocusedPriority(registry, state, close, "m")).toBe(true);
    expect(state.released.has("d")).toBe(true);
  });

  it("keeps focus on Escape while the overlay only has the pointer", () => {
    const { registry, a } = dialogRegistry();
    const state = input("d");
    expect(releaseFocusedPriority(registry, state, a, null)).toBe(false);
    expect(hoverKeepsFocus(registry, state, a)).toBe(true);
    expect(state.released.size).toBe(0);
  });

  it("lets Escape drop focus when no overlay has priority", () => {
    const { registry, a } = dialogRegistry();
    const state = input(null);
    expect(releaseFocusedPriority(registry, state, a, null)).toBe(false);
    expect(hoverKeepsFocus(registry, state, a)).toBe(false);
  });

  it("re-arms a released overlay once its stop has focus under the pointer, not on the drop", () => {
    const { registry, done } = dialogRegistry();
    const state = input("d");
    state.released.add("d");
    rearmHoveredFocus(state, null);
    expect(state.released.has("d")).toBe(true);
    rearmHoveredFocus(state, done);
    expect(state.released.has("d")).toBe(false);
    state.hovered = null;
    expect(heldPriority(registry, state, done)).toBe("d");
  });

  it("holds nothing for an overlay without a stop that can take focus", () => {
    const { registry } = dialogRegistry();
    expect(heldPriority(registry, input("other"), null)).toBeNull();
  });
});
