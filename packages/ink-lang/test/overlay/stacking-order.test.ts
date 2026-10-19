import { describe, expect, it } from "vitest";
import type { CapturedContexts } from "../../src/overlay/context-bridge";
import type { Overlay } from "../../src/overlay/overlay-registry";
import { stackingOrder } from "../../src/overlay/stacking-order";

/** An overlay with an id and a layer; the rest does not matter to the order. */
function overlay(id: string, layer: string | null): Overlay {
  return {
    id,
    kind: "dialog",
    anchorRef: { current: null },
    placement: "bottom",
    gap: 0,
    render: function render() {
      return null;
    },
    renderCompact: null,
    opaque: true,
    captured: {} as CapturedContexts,
    offset: { x: 0, y: 0 },
    onPlaced: null,
    backgroundFromParent: false,
    reserve: null,
    layer,
  };
}

/** The open modals "m1" (bottom) and "m2"; the page is under both, an unknown id above. */
function layerIndex(layer: string | null): number {
  if (layer === null) return -1;
  if (layer === "m1") return 0;
  if (layer === "m2") return 1;
  return 2;
}

function ids(overlays: Overlay[]): string[] {
  const list: string[] = [];
  for (const entry of overlays) list.push(entry.id);
  return list;
}

describe("stackingOrder", () => {
  it("keeps registration order inside one layer", () => {
    const list = [overlay("a", null), overlay("b", null), overlay("c", null)];
    expect(ids(stackingOrder(list, layerIndex))).toEqual(["a", "b", "c"]);
  });

  it("puts a page overlay registered after a modal's under it", () => {
    const list = [overlay("backdrop", "m1"), overlay("modal", "m1"), overlay("note", null)];
    expect(ids(stackingOrder(list, layerIndex))).toEqual(["note", "backdrop", "modal"]);
  });

  it("orders by the layers' places in the modal stack, then by registration", () => {
    const list = [
      overlay("inner", "m2"),
      overlay("tip", null),
      overlay("outer", "m1"),
      overlay("nested", "m1"),
      overlay("opening", "m3"),
    ];
    expect(ids(stackingOrder(list, layerIndex))).toEqual([
      "tip",
      "outer",
      "nested",
      "inner",
      "opening",
    ]);
  });

  it("leaves the given list as it is", () => {
    const list = [overlay("modal", "m1"), overlay("note", null)];
    stackingOrder(list, layerIndex);
    expect(ids(list)).toEqual(["modal", "note"]);
  });
});
