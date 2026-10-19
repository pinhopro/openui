import { describe, expect, it } from "vitest";
import type { FocusEntry } from "../../src/focus/focus-registry";
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
