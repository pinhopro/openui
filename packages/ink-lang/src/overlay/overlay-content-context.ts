import { createContext, useContext, type Context } from "react";

/**
 * The id of the overlay the content renders in (the id `useOverlay` returned
 * to its owner); null outside any overlay. The overlay host provides it around
 * each form of an overlay, below the bridged contexts: it is never captured
 * and re-provided, so an overlay opened from inside another one has its own.
 */
export const OverlayIdContext: Context<string | null> = createContext<string | null>(null);

/**
 * False while the content is drawn only to be measured (its form hidden below
 * the root): its focus stops and mouse targets go inert until it shows. True
 * outside any overlay. Provided by the overlay host like `OverlayIdContext`.
 */
export const OverlayVisibleContext: Context<boolean> = createContext<boolean>(true);

/**
 * The widest the overlay form the content renders in may be (its bounds'
 * width, or the room beside the anchor for a compact form); null outside any
 * overlay. Provided by the overlay host like `OverlayIdContext`, so content
 * that wraps its own text (a dialog's body) wraps it inside the bounds.
 */
export const OverlayWidthLimitContext: Context<number | null> = createContext<number | null>(null);

/** The id of the overlay the calling component renders in; null outside any overlay. */
export function useOverlayId(): string | null {
  return useContext(OverlayIdContext);
}

/** False while the calling component renders in an overlay form that is hidden. */
export function useOverlayVisible(): boolean {
  return useContext(OverlayVisibleContext);
}

/** The widest the calling component's overlay form may be; null outside any overlay. */
export function useOverlayWidthLimit(): number | null {
  return useContext(OverlayWidthLimitContext);
}
