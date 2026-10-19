import { Box, type DOMElement } from "ink";
import {
  Fragment,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { elementRect, type CellRect } from "../focus/element-rect";
import { ModalLayerContext } from "../focus/modal-layer";
import { rectIntersection } from "./clip-rect";
import { OverlayBox } from "./overlay-box";
import {
  measurePlacement,
  rowsPastContent,
  samePlacement,
  unmeasuredPlacement,
  type PlacedOverlay,
} from "./overlay-measure";
import { OverlayRegistryContext, type Overlay, type OverlayRegistry } from "./overlay-registry";
import { rootRect } from "./root-rect";
import { stackingOrder } from "./stacking-order";
import { useLayoutSignal } from "./use-layout-signal";

/**
 * Each overlay's placement by id, or null when its anchor is missing, empty or clipped out
 * (nothing is drawn).
 */
type Placements = Map<string, PlacedOverlay | null>;

/** One ref object per open overlay, kept while it is open. */
type BoxRefs = Map<string, RefObject<DOMElement | null>>;

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

/** True when both maps hold the same ids with the same placements. */
function samePlacements(previous: Placements, next: Placements): boolean {
  if (previous.size !== next.size) return false;
  for (const [id, placed] of next) {
    if (!previous.has(id)) return false;
    if (!samePlacement(previous.get(id) ?? null, placed)) return false;
  }
  return true;
}

/** Drops the refs of the ids that are no longer open. */
function forgetClosed(refs: BoxRefs, open: Set<string>): void {
  for (const id of Array.from(refs.keys())) {
    if (!open.has(id)) refs.delete(id);
  }
}

/** The same ref object for an overlay's box on every render while it is open. */
function refFor(refs: BoxRefs, id: string): RefObject<DOMElement | null> {
  let ref = refs.get(id);
  if (ref === undefined) {
    ref = { current: null };
    refs.set(id, ref);
  }
  return ref;
}

/**
 * The rectangle the host places overlays in: the cells of the bounds box it
 * was given (inside the ink root), else the whole ink root.
 */
function boundsOf(host: DOMElement, boundsBox: DOMElement | null): CellRect {
  const root = rootRect(host);
  if (boundsBox === null) return root;
  return rectIntersection(elementRect(boundsBox), root);
}

/**
 * The bounds' cells down to the last row of `content` (the page's content,
 * without the rows added under it); the whole bounds without a content box.
 */
function contentOf(bounds: CellRect, content: DOMElement | null): CellRect {
  if (content === null) return bounds;
  const rect = elementRect(content);
  const bottom = Math.min(bounds.y + bounds.height, rect.y + rect.height);
  return { x: bounds.x, y: bounds.y, width: bounds.width, height: Math.max(0, bottom - bounds.y) };
}

export interface OverlayHostProps {
  /**
   * The box overlays must stay inside; default the whole ink root. A
   * standalone `InkRenderer` passes its page, so its overlays never cover the
   * host's content around it.
   */
  boundsRef?: RefObject<DOMElement | null>;
  /**
   * With `boundsRef`: the box of the page's content inside the bounds, above
   * the rows `onExtraRows` asks for. Default the whole bounds.
   */
  contentRef?: RefObject<DOMElement | null>;
  /**
   * With `boundsRef`: receives, whenever it changes, how many rows the open
   * dialogs and modals need under the page's content to be drawn whole
   * (`rowsPastContent`; 0 when they fit). A standalone `InkRenderer` adds that
   * many blank rows at the end of its page, inside the bounds, so a dialog in
   * a program shorter than itself is never cut at the page's last row.
   */
  onExtraRows?: (rows: number) => void;
}

/**
 * Paints the open overlays of the nearest registry over everything rendered
 * before it, in stacking order (`stackingOrder`: by modal layer, then in the
 * order they opened): an absolutely positioned box at the top-left
 * of its container holding one absolutely positioned box per overlay form,
 * so the container's layout does not change and later overlays overwrite
 * earlier cells. An overlay is opaque unless it asks otherwise (blank cells
 * under its content); its content is rendered with the contexts of the
 * component that opened it and in its own mouse layer (stacking index plus
 * one), where its box takes the presses and clicks on its cells, so nothing
 * under it receives them. An overlay that does not fit whole around its
 * anchor draws its compact form beside it, when it has one. A form is first
 * drawn below the root's last row, where Ink outputs nothing, and shown once
 * it is measured, so no frame shows it in a wrong place. Placements are
 * measured after every render of the host and after every layout of the ink
 * root (a scrolled pane, a resize; `useLayoutSignal`): the anchor's cells,
 * each form's size and the bounds (`boundsRef`, else the ink root). Only
 * changed placements re-render.
 */
export function OverlayHost({ boundsRef, contentRef, onExtraRows }: OverlayHostProps) {
  const registry = useContext(OverlayRegistryContext);
  // Read on every render: a layer opening or closing re-renders the host through this context.
  const layers = useContext(ModalLayerContext);
  const registered = useOverlayList(registry);
  const overlays = stackingOrder(registered, layers.indexOf);
  const hostRef = useRef<DOMElement | null>(null);
  const wholeRefs = useRef<BoxRefs>(new Map());
  const compactRefs = useRef<BoxRefs>(new Map());
  const [placements, setPlacements] = useState<Placements>(function noPlacements() {
    return new Map();
  });
  // What the latest render drew, for measurements that run outside a render.
  const rendered = useRef({ overlays, placements, onExtraRows });
  rendered.current = { overlays, placements, onExtraRows };
  // The rows last reported to `onExtraRows`.
  const reportedRows = useRef(0);

  /** The box the bounds come from, null for the whole ink root. */
  function currentBoundsBox(): DOMElement | null {
    return boundsRef === undefined ? null : boundsRef.current;
  }

  /** The current bounds, read after layout. */
  function currentBounds(host: DOMElement): CellRect {
    return boundsOf(host, currentBoundsBox());
  }

  /** Tells `onExtraRows` the rows the overlays need under the content, when they changed. */
  function reportExtraRows(rows: number): void {
    const report = rendered.current.onExtraRows;
    if (report === undefined || boundsRef === undefined || rows === reportedRows.current) return;
    reportedRows.current = rows;
    report(rows);
  }

  /** Measures every open overlay against the layout Ink just computed; sets state only on a change. */
  function placeOverlays(): void {
    const host = hostRef.current;
    if (host === null) return;
    const drawn = rendered.current;
    // Every commit of the app lands here: nothing to do while no overlay is open or drawn.
    if (drawn.overlays.length === 0 && drawn.placements.size === 0) {
      reportExtraRows(0);
      return;
    }
    const open = new Set<string>();
    for (const overlay of drawn.overlays) open.add(overlay.id);
    forgetClosed(wholeRefs.current, open);
    forgetClosed(compactRefs.current, open);
    const bounds = currentBounds(host);
    const content = contentOf(bounds, contentRef === undefined ? null : contentRef.current);
    const next: Placements = new Map();
    let extraRows = 0;
    for (const overlay of drawn.overlays) {
      const input = {
        overlay,
        host,
        wholeBox: refFor(wholeRefs.current, overlay.id).current,
        compactBox: refFor(compactRefs.current, overlay.id).current,
        bounds,
        boundsBox: currentBoundsBox(),
      };
      next.set(overlay.id, measurePlacement(input));
      extraRows = Math.max(extraRows, rowsPastContent(input, content));
    }
    if (!samePlacements(drawn.placements, next)) setPlacements(next);
    reportExtraRows(extraRows);
  }

  // After every render of the host, and after every layout of the ink root
  // (a scrolled pane or a resize moves an anchor without rendering the host).
  useLayoutEffect(placeOverlays);
  useLayoutSignal(hostRef, placeOverlays);

  /** The placement drawn on this render: the measured one, else the hidden first pass. */
  function placementOf(overlay: Overlay): PlacedOverlay | null {
    const measured = placements.get(overlay.id);
    if (measured !== undefined) return measured;
    const host = hostRef.current;
    if (host === null) return null;
    return unmeasuredPlacement(overlay, host, currentBounds(host), currentBoundsBox());
  }

  const boxes = [];
  for (let index = 0; index < overlays.length; index += 1) {
    const overlay = overlays[index] as Overlay;
    const placed = placementOf(overlay);
    if (placed === null) continue;
    const layer = index + 1;
    const renderCompact = overlay.renderCompact;
    boxes.push(
      <Fragment key={overlay.id}>
        <OverlayBox
          spot={placed.whole}
          overlayId={overlay.id}
          kind={overlay.kind}
          boxRef={refFor(wholeRefs.current, overlay.id)}
          captured={overlay.captured}
          layer={layer}
          opaque={overlay.opaque}
          background={placed.background}
          render={overlay.render}
        />
        {placed.compact !== null && renderCompact !== null ? (
          <OverlayBox
            spot={placed.compact}
            overlayId={overlay.id}
            kind={overlay.kind}
            boxRef={refFor(compactRefs.current, overlay.id)}
            captured={overlay.captured}
            layer={layer}
            opaque={overlay.opaque}
            background={placed.background}
            render={renderCompact}
          />
        ) : null}
      </Fragment>,
    );
  }

  return (
    <Box ref={hostRef} position="absolute" top={0} left={0}>
      {boxes}
    </Box>
  );
}
