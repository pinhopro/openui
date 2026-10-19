import { Box, measureElement, type DOMElement } from "ink";
import {
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { elementRect, type CellRect } from "../focus/element-rect";
import { MouseLayerContext } from "../mouse/mouse-layer";
import { BridgedContexts } from "./context-bridge";
import { OverlayFill } from "./overlay-fill";
import { placeOverlay, type OverlayPosition } from "./overlay-placement";
import { OverlayRegistryContext, type Overlay, type OverlayRegistry } from "./overlay-registry";
import { rootRect } from "./root-rect";
import { useResizeCount } from "./use-resize-count";

/** Where an overlay is drawn, relative to the host box, and the size it was measured at. */
interface PlacedOverlay {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Each overlay's placement by id, or null when its anchor is missing or empty
 * (nothing is drawn).
 */
type Placements = Map<string, PlacedOverlay | null>;

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

/**
 * Where an overlay sits before it was ever measured: at its anchor, so the
 * first frame is close; its size is not known yet.
 */
function firstPlacement(overlay: Overlay, host: DOMElement | null): PlacedOverlay | null {
  const anchor = anchorRect(overlay);
  if (anchor === null) return null;
  const origin = hostOrigin(host);
  return { x: anchor.x - origin.x, y: anchor.y - origin.y, width: 0, height: 0 };
}

/** The placement of one overlay relative to the host, or null when it draws nothing. */
function measurePlacement(
  overlay: Overlay,
  box: DOMElement | undefined,
  host: DOMElement,
): PlacedOverlay | null {
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
    width: size.width,
    height: size.height,
  };
}

function samePlacement(a: PlacedOverlay | null, b: PlacedOverlay | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
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
 * cells. Each overlay is opaque (blank cells under its content, once its size
 * is measured) and its content is rendered with the contexts of the component
 * that opened it and in its own mouse layer (stacking index plus one), so it
 * wins the mouse hit-test over what it covers. Placements are measured after
 * every render and every terminal resize (the anchor's cells, the overlay's
 * size, the ink root as the bounds) and only changed placements re-render.
 */
export function OverlayHost() {
  const registry = useContext(OverlayRegistryContext);
  const overlays = useOverlayList(registry);
  // Read so a resize re-renders the host and the layout effect measures again.
  useResizeCount();
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
  for (let index = 0; index < overlays.length; index += 1) {
    const overlay = overlays[index] as Overlay;
    const measured = placements.get(overlay.id);
    const placed = measured === undefined ? firstPlacement(overlay, hostRef.current) : measured;
    if (placed === null) continue;
    boxes.push(
      <Box
        key={overlay.id}
        ref={boxRef(overlay.id)}
        position="absolute"
        left={placed.x}
        top={placed.y}
        flexDirection="column"
      >
        <OverlayFill width={placed.width} height={placed.height} />
        <BridgedContexts captured={overlay.captured}>
          <MouseLayerContext.Provider value={index + 1}>
            <OverlayContent render={overlay.render} />
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
