import { Box, measureElement, type DOMElement } from "ink";
import { useContext, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { elementRect, type CellRect } from "../focus/element-rect";
import { BridgedContexts } from "./context-bridge";
import { placeOverlay, type OverlayPosition } from "./overlay-placement";
import { OverlayRegistryContext, type Overlay, type OverlayRegistry } from "./overlay-registry";
import { rootRect } from "./root-rect";

/**
 * Where each overlay is drawn, relative to the host box, by id: a position, or
 * null when its anchor is missing or empty (nothing is drawn).
 */
type Placements = Map<string, OverlayPosition | null>;

const NO_OVERLAYS: Overlay[] = [];

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

/** The anchor's cells, or null while it is unmounted or takes no cells. */
function anchorRect(overlay: Overlay): CellRect | null {
  const anchor = overlay.anchorRef.current;
  if (anchor === null) return null;
  const rect = elementRect(anchor);
  if (rect.width === 0 || rect.height === 0) return null;
  return rect;
}

/** The host box's own cells; positions are relative to them. */
function hostOrigin(host: DOMElement | null): OverlayPosition {
  if (host === null) return { x: 0, y: 0 };
  const rect = elementRect(host);
  return { x: rect.x, y: rect.y };
}

/** Where an overlay sits before it was ever measured: at its anchor, so the first frame is close. */
function firstPosition(overlay: Overlay, host: DOMElement | null): OverlayPosition | null {
  const anchor = anchorRect(overlay);
  if (anchor === null) return null;
  const origin = hostOrigin(host);
  return { x: anchor.x - origin.x, y: anchor.y - origin.y };
}

/** The placed position of one overlay relative to the host, or null when it draws nothing. */
function measurePlacement(
  overlay: Overlay,
  box: DOMElement | undefined,
  host: DOMElement,
): OverlayPosition | null {
  const anchor = anchorRect(overlay);
  if (anchor === null) return null;
  const size = box === undefined ? { width: 0, height: 0 } : measureElement(box);
  const placed = placeOverlay({
    anchor,
    size: { width: size.width, height: size.height },
    placement: overlay.placement,
    gap: overlay.gap,
    bounds: rootRect(host),
  });
  const origin = hostOrigin(host);
  return {
    x: placed.x - origin.x + overlay.offset.x,
    y: placed.y - origin.y + overlay.offset.y,
  };
}

function samePosition(a: OverlayPosition | null, b: OverlayPosition | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y;
}

/** True when both maps hold the same ids with the same positions. */
function samePlacements(previous: Placements, next: Placements): boolean {
  if (previous.size !== next.size) return false;
  for (const [id, position] of next) {
    if (!previous.has(id)) return false;
    if (!samePosition(previous.get(id) ?? null, position)) return false;
  }
  return true;
}

/**
 * Paints the open overlays of the nearest registry over everything rendered
 * before it, in stacking order: an absolutely positioned box at the top-left
 * of its container holding one absolutely positioned box per overlay, so the
 * container's layout does not change and later overlays overwrite earlier
 * cells. Each overlay's content is rendered with the contexts of the
 * component that opened it. Positions are measured after every render (the
 * anchor's cells, the overlay's size, the ink root as the bounds) and only
 * changed positions re-render.
 */
export function OverlayHost() {
  const registry = useContext(OverlayRegistryContext);
  const overlays = useOverlayList(registry);
  const hostRef = useRef<DOMElement | null>(null);
  const boxesRef = useRef(new Map<string, DOMElement>());
  const [placements, setPlacements] = useState<Placements>(function noPlacements() {
    return new Map();
  });

  useLayoutEffect(function placeOverlays() {
    const host = hostRef.current;
    if (host === null) return;
    const next: Placements = new Map();
    for (const overlay of overlays) {
      next.set(overlay.id, measurePlacement(overlay, boxesRef.current.get(overlay.id), host));
    }
    if (!samePlacements(placements, next)) setPlacements(next);
  });

  function boxRef(id: string) {
    return function attachBox(element: DOMElement | null): void {
      if (element === null) boxesRef.current.delete(id);
      else boxesRef.current.set(id, element);
    };
  }

  const boxes = [];
  for (const overlay of overlays) {
    const placed = placements.get(overlay.id);
    const position = placed === undefined ? firstPosition(overlay, hostRef.current) : placed;
    if (position === null) continue;
    boxes.push(
      <Box
        key={overlay.id}
        ref={boxRef(overlay.id)}
        position="absolute"
        left={position.x}
        top={position.y}
        flexDirection="column"
      >
        <BridgedContexts captured={overlay.captured}>{overlay.render()}</BridgedContexts>
      </Box>,
    );
  }

  return (
    <Box ref={hostRef} position="absolute" top={0} left={0}>
      {boxes}
    </Box>
  );
}
