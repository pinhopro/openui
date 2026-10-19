import { Box, measureElement, type DOMElement } from "ink";
import {
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { elementRect, type CellRect } from "../focus/element-rect";
import { MouseLayerContext } from "../mouse/mouse-layer";
import { clippedBy, rectsIntersect } from "./clip-rect";
import { BridgedContexts } from "./context-bridge";
import { OverlayFill } from "./overlay-fill";
import { OverlayMouseShield } from "./overlay-mouse-shield";
import {
  overlayFits,
  placeCompact,
  placeOverlay,
  type OverlayPosition,
  type OverlaySize,
} from "./overlay-placement";
import { OverlayRegistryContext, type Overlay, type OverlayRegistry } from "./overlay-registry";
import { rootRect } from "./root-rect";
import { useResizeCount } from "./use-resize-count";

/** Where an overlay is drawn, relative to the host box, the size it was measured at and its form. */
interface PlacedOverlay {
  x: number;
  y: number;
  width: number;
  height: number;
  /** True while the overlay's compact (one-row) form is drawn instead of its content. */
  compact: boolean;
}

/**
 * Each overlay's placement by id, or null when its anchor is missing, empty or clipped out
 * (nothing is drawn).
 */
type Placements = Map<string, PlacedOverlay | null>;

const NO_OVERLAYS: Overlay[] = [];
const NO_SIZE: OverlaySize = Object.freeze({ width: 0, height: 0 });
/** A compact form's size before it was ever measured: one row, no width yet. */
const UNMEASURED_COMPACT: OverlaySize = Object.freeze({ width: 0, height: 1 });

function subscribeNothing(): () => void {
  return function unsubscribe() {};
}

function listNothing(): Overlay[] {
  return NO_OVERLAYS;
}

/** The open overlays of the registry, re-read whenever one registers, updates or leaves. */
function useOverlayList(registry: OverlayRegistry | null): Overlay[] {
  const subscribe = registry === null ? subscribeNothing : registry.subscribe;
  const list = registry === null ? listNothing : registry.list;
  return useSyncExternalStore(subscribe, list, list);
}

/**
 * The anchor's cells, or null while it is unmounted, takes no cells or is
 * clipped out of sight (scrolled out of a pane that hides its overflow).
 */
function anchorRect(overlay: Overlay): CellRect | null {
  const anchor = overlay.anchorRef.current;
  if (anchor === null) return null;
  const rect = elementRect(anchor);
  if (rect.width === 0 || rect.height === 0) return null;
  const clip = clippedBy(anchor);
  if (clip !== null && !rectsIntersect(rect, clip)) return null;
  return rect;
}

/** The host box's own cells; positions are relative to them. */
function hostOrigin(host: DOMElement | null): OverlayPosition {
  if (host === null) return { x: 0, y: 0 };
  const rect = elementRect(host);
  return { x: rect.x, y: rect.y };
}

/**
 * Where an overlay sits before it was ever measured: at its anchor, so the
 * first frame is close; its size is not known yet.
 */
function firstPlacement(overlay: Overlay, host: DOMElement | null): PlacedOverlay | null {
  const anchor = anchorRect(overlay);
  if (anchor === null) return null;
  const origin = hostOrigin(host);
  return { x: anchor.x - origin.x, y: anchor.y - origin.y, width: 0, height: 0, compact: false };
}

function sizeOf(box: DOMElement | null): OverlaySize {
  if (box === null) return NO_SIZE;
  const measured = measureElement(box);
  return { width: measured.width, height: measured.height };
}

interface MeasureInput {
  overlay: Overlay;
  /** The overlay's box as drawn on the last render. */
  box: DOMElement | null;
  host: DOMElement;
  /** Its placement on the last render, which says which form the box holds. */
  previous: PlacedOverlay | null;
  /** The size of each overlay's whole content when last drawn, by id. */
  fullSizes: Map<string, OverlaySize>;
}

/**
 * The placement of one overlay relative to the host, or null when it draws
 * nothing. The whole content is drawn while it fits (`overlayFits`, by the
 * size it had when last drawn); otherwise an overlay with a compact form draws
 * that one beside its anchor (`placeCompact`).
 */
function measurePlacement(input: MeasureInput): PlacedOverlay | null {
  const overlay = input.overlay;
  const anchor = anchorRect(overlay);
  if (anchor === null) return null;
  const measured = sizeOf(input.box);
  const wasCompact = input.previous !== null && input.previous.compact;
  if (!wasCompact) input.fullSizes.set(overlay.id, measured);
  const fullSize = input.fullSizes.get(overlay.id) ?? measured;
  const bounds = rootRect(input.host);
  const whole = {
    anchor,
    size: fullSize,
    placement: overlay.placement,
    gap: overlay.gap,
    bounds,
  };
  const compact = overlay.renderCompact !== null && !overlayFits(whole);
  let size: OverlaySize;
  let placed: OverlayPosition;
  if (compact) {
    size = wasCompact ? measured : UNMEASURED_COMPACT;
    placed = placeCompact({ anchor, size, bounds });
  } else {
    size = fullSize;
    placed = placeOverlay(whole);
  }
  const origin = hostOrigin(input.host);
  return {
    x: placed.x - origin.x + overlay.offset.x,
    y: placed.y - origin.y + overlay.offset.y,
    width: size.width,
    height: size.height,
    compact,
  };
}

function samePlacement(a: PlacedOverlay | null, b: PlacedOverlay | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.x !== b.x || a.y !== b.y || a.compact !== b.compact) return false;
  return a.width === b.width && a.height === b.height;
}

/** True when both maps hold the same ids with the same placements. */
function samePlacements(previous: Placements, next: Placements): boolean {
  if (previous.size !== next.size) return false;
  for (const [id, placed] of next) {
    if (!previous.has(id)) return false;
    if (!samePlacement(previous.get(id) ?? null, placed)) return false;
  }
  return true;
}

/** Drops what is kept per overlay for the ids that are no longer open. */
function forgetClosed<Value>(entries: Map<string, Value>, open: Set<string>): void {
  for (const id of Array.from(entries.keys())) {
    if (!open.has(id)) entries.delete(id);
  }
}

interface OverlayContentProps {
  render: () => ReactNode;
}

/**
 * One overlay's content, in a component of its own: hooks called by a
 * `render` that breaks the no-hooks rule stay out of the host's hook order.
 */
function OverlayContent({ render }: OverlayContentProps) {
  return render();
}

/**
 * Paints the open overlays of the nearest registry over everything rendered
 * before it, in stacking order: an absolutely positioned box at the top-left
 * of its container holding one absolutely positioned box per overlay, so the
 * container's layout does not change and later overlays overwrite earlier
 * cells. An overlay is opaque unless it asks otherwise (blank cells under its
 * content, once its size is measured); its content is rendered with the
 * contexts of the component that opened it and in its own mouse layer
 * (stacking index plus one), where its box takes the presses and clicks on
 * its cells, so nothing under it receives them. An overlay that does not fit
 * whole around its anchor draws its compact form beside it, when it has one.
 * Placements are measured after every render and every terminal resize (the
 * anchor's cells, the overlay's size, the ink root as the bounds) and only
 * changed placements re-render.
 */
export function OverlayHost() {
  const registry = useContext(OverlayRegistryContext);
  const overlays = useOverlayList(registry);
  // Read so a resize re-renders the host and the layout effect measures again.
  useResizeCount();
  const hostRef = useRef<DOMElement | null>(null);
  const boxRefs = useRef(new Map<string, RefObject<DOMElement | null>>());
  const fullSizes = useRef(new Map<string, OverlaySize>());
  const [placements, setPlacements] = useState<Placements>(function noPlacements() {
    return new Map();
  });

  /** The same ref object for an overlay's box on every render while it is open. */
  function boxRefFor(id: string): RefObject<DOMElement | null> {
    let ref = boxRefs.current.get(id);
    if (ref === undefined) {
      ref = { current: null };
      boxRefs.current.set(id, ref);
    }
    return ref;
  }

  useLayoutEffect(function placeOverlays() {
    const host = hostRef.current;
    if (host === null) return;
    const open = new Set<string>();
    for (const overlay of overlays) open.add(overlay.id);
    forgetClosed(boxRefs.current, open);
    forgetClosed(fullSizes.current, open);
    const next: Placements = new Map();
    for (const overlay of overlays) {
      const placed = measurePlacement({
        overlay,
        box: boxRefFor(overlay.id).current,
        host,
        previous: placements.get(overlay.id) ?? null,
        fullSizes: fullSizes.current,
      });
      next.set(overlay.id, placed);
    }
    if (!samePlacements(placements, next)) setPlacements(next);
  });

  const boxes = [];
  for (let index = 0; index < overlays.length; index += 1) {
    const overlay = overlays[index] as Overlay;
    const measured = placements.get(overlay.id);
    const placed = measured === undefined ? firstPlacement(overlay, hostRef.current) : measured;
    if (placed === null) continue;
    const boxRef = boxRefFor(overlay.id);
    const compactRender = placed.compact ? overlay.renderCompact : null;
    boxes.push(
      <Box
        key={overlay.id}
        ref={boxRef}
        position="absolute"
        left={placed.x}
        top={placed.y}
        flexDirection="column"
      >
        {overlay.opaque ? <OverlayFill width={placed.width} height={placed.height} /> : null}
        <BridgedContexts captured={overlay.captured}>
          <MouseLayerContext.Provider value={index + 1}>
            <OverlayMouseShield boxRef={boxRef} />
            <OverlayContent
              key={compactRender === null ? "whole" : "compact"}
              render={compactRender ?? overlay.render}
            />
          </MouseLayerContext.Provider>
        </BridgedContexts>
      </Box>,
    );
  }

  return (
    <Box ref={hostRef} position="absolute" top={0} left={0}>
      {boxes}
    </Box>
  );
}
