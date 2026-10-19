import type { Overlay } from "./overlay-registry";

/** An overlay with what it is stacked by. */
interface RankedOverlay {
  overlay: Overlay;
  /** The place of its modal layer among the open ones (-1 for the page). */
  rank: number;
  /** Its place in registration order. */
  order: number;
}

function byLayerThenOrder(a: RankedOverlay, b: RankedOverlay): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  return a.order - b.order;
}

/**
 * The open overlays in the order the host paints them, bottom first: by the
 * place of their modal layer in the stack of open modals (`layerIndex`: -1
 * for the page, below every modal), then in registration order. So an
 * overlay of a layer under the active modal (a page Dialog shown after a
 * modal opened) stays under the modal's backdrop and box, and the overlays of
 * one layer keep the order they opened in. `overlays` is left as it is.
 */
export function stackingOrder(
  overlays: readonly Overlay[],
  layerIndex: (layer: string | null) => number,
): Overlay[] {
  const ranked: RankedOverlay[] = [];
  for (let order = 0; order < overlays.length; order += 1) {
    const overlay = overlays[order] as Overlay;
    ranked.push({ overlay, rank: layerIndex(overlay.layer), order });
  }
  ranked.sort(byLayerThenOrder);
  const sorted: Overlay[] = [];
  for (const entry of ranked) sorted.push(entry.overlay);
  return sorted;
}
