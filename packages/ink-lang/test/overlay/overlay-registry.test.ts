import { describe, expect, it } from "vitest";
import type { CapturedContexts } from "../../src/overlay/context-bridge";
import { createOverlayRegistry, type Overlay } from "../../src/overlay/overlay-registry";

function overlay(id: string, gap = 0): Overlay {
  return {
    id,
    kind: "tooltip",
    anchorRef: { current: null },
    placement: "bottom",
    gap,
    render: function renderNothing() {
      return null;
    },
    renderCompact: null,
    opaque: true,
    captured: {} as CapturedContexts,
    offset: { x: 0, y: 0 },
    onPlaced: null,
    layer: null,
  };
}

function ids(list: Overlay[]): string[] {
  return list.map(function idOf(entry) {
    return entry.id;
  });
}

describe("overlay registry", () => {
  it("lists overlays in registration order and keeps an updated one in its place", () => {
    const registry = createOverlayRegistry();
    registry.register(overlay("a"));
    registry.register(overlay("b"));
    registry.update(overlay("a", 2));
    expect(ids(registry.list())).toEqual(["a", "b"]);
    expect(registry.list()[0]?.gap).toBe(2);
  });

  it("notifies on register, update and removal, with a new frozen list each time", () => {
    const registry = createOverlayRegistry();
    let calls = 0;
    const unsubscribe = registry.subscribe(function count() {
      calls += 1;
    });
    const empty = registry.list();
    const entry = overlay("a");
    const unregister = registry.register(entry);
    const registered = registry.list();
    expect(registered).not.toBe(empty);
    expect(Object.isFrozen(registered)).toBe(true);
    registry.update(entry);
    expect(calls).toBe(1);
    expect(registry.list()).toBe(registered);
    registry.update(overlay("a"));
    expect(calls).toBe(2);
    unregister();
    unregister();
    expect(calls).toBe(3);
    expect(registry.list()).toEqual([]);
    unsubscribe();
    registry.register(overlay("b"));
    expect(calls).toBe(3);
  });

  it("ignores an update for an overlay that is not registered", () => {
    const registry = createOverlayRegistry();
    registry.update(overlay("ghost"));
    expect(registry.list()).toEqual([]);
  });
});
