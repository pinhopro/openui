import { useFocusManager, useInput, type Key } from "ink";
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { elementRect, type CellRect } from "./element-rect";
import { FocusCommandsContext, type FocusCommands } from "./focus-commands";
import { FocusCycleContext, type FocusCycleOrder } from "./focus-cycle";
import {
  arrowDirection,
  claimsDirection,
  nextInDirection,
  type ArrowDirection,
  type NavigationCandidate,
} from "./focus-navigation";
import { focusOrder, hostStops, nextInOrder, type CycleStop } from "./focus-order";
import { FocusRegistryContext, type FocusEntry, type FocusRegistry } from "./focus-registry";
import {
  escapeKeepsFocus,
  heldPriority,
  rearmHoveredFocus,
  type PriorityInput,
} from "./held-priority";
import { ModalLayerContext } from "./modal-layer";
import { OverlayPriorityContext } from "./overlay-priority";

/** What the navigator needs from Ink's focus manager. */
interface FocusTarget {
  activeId: string | undefined;
  focus: (id: string) => void;
}

/**
 * The Tab cycle: the ids `order` returns for the program's stops in document
 * order and the host's stops in registration order (see `FocusScope`). Both
 * lists leave out inactive stops; the modal layers belong to the scope, so
 * while a modal is open every stop outside it, the host's included, is
 * inactive and only the modal's own stops are in the cycle. An id `order`
 * returns that is not among the stops it was given (one kept from an earlier
 * cycle, say) is skipped, so it can neither stall Tab nor reach past a modal.
 * An id returned twice keeps its first place only, so every stop stays
 * reachable. While the overlay `priority` holds (see `heldPriority`) only its
 * own stops are in the cycle, in the same order.
 */
function tabCycle(
  registry: FocusRegistry,
  order: FocusCycleOrder,
  priority: string | null,
): CycleStop[] {
  const program = focusOrder(registry);
  const host = hostStops(registry);
  const offered = new Set<string>();
  for (const stop of program) offered.add(stop.id);
  for (const entry of host) offered.add(entry.id);
  const seen = new Set<string>();
  const cycle: CycleStop[] = [];
  for (const id of order(program, host)) {
    if (!offered.has(id) || seen.has(id)) continue;
    seen.add(id);
    cycle.push({ id });
  }
  if (priority === null) return cycle;
  return stopsIn(registry, cycle, priority);
}

/** The stops of `cycle` that render in the overlay `overlay`; the whole cycle when none does. */
function stopsIn(registry: FocusRegistry, cycle: CycleStop[], overlay: string): CycleStop[] {
  const inside: CycleStop[] = [];
  for (const stop of cycle) {
    const entry = registry.find(stop.id);
    if (entry !== null && entry.overlay === overlay) inside.push(stop);
  }
  return inside.length === 0 ? cycle : inside;
}

/**
 * Moves focus one step along the Tab cycle from the focused stop, inside the
 * overlay that has priority while one does (`heldPriority`).
 */
function stepCycle(
  registry: FocusRegistry | null,
  order: FocusCycleOrder,
  target: FocusTarget,
  priorityInput: PriorityInput,
  delta: 1 | -1,
): void {
  if (registry === null) return;
  const active = activeEntry(registry, target.activeId);
  const priority = heldPriority(registry, priorityInput, active);
  const next = nextInOrder(tabCycle(registry, order, priority), target.activeId, delta);
  if (next !== null) target.focus(next);
}

/** Focuses the first stop of the Tab cycle. */
function focusFirstStop(
  registry: FocusRegistry | null,
  order: FocusCycleOrder,
  target: FocusTarget,
): void {
  if (registry === null) return;
  const first = tabCycle(registry, order, null)[0];
  if (first !== undefined) target.focus(first.id);
}

/** Focuses the first stop of the Tab cycle that renders in the overlay `overlayId`. */
function focusFirstStopIn(
  registry: FocusRegistry | null,
  order: FocusCycleOrder,
  target: FocusTarget,
  overlayId: string,
): void {
  if (registry === null) return;
  for (const stop of tabCycle(registry, order, null)) {
    const entry = registry.find(stop.id);
    if (entry !== null && entry.overlay === overlayId) {
      target.focus(stop.id);
      return;
    }
  }
}

/**
 * Moves focus to the nearest stop in the arrow's direction, unless the
 * focused stop keeps that arrow; while an overlay has priority only its own
 * stops are candidates, like Tab's.
 */
function moveByArrow(
  registry: FocusRegistry,
  target: FocusTarget,
  priorityInput: PriorityInput,
  direction: ArrowDirection,
): void {
  const active = activeEntry(registry, target.activeId);
  if (active !== null && claimsDirection(active.arrows, direction)) return;
  const priority = heldPriority(registry, priorityInput, active);
  let current: CellRect | null = null;
  if (active !== null && active.ref.current !== null) current = elementRect(active.ref.current);
  const candidates: NavigationCandidate[] = [];
  for (const entry of registry.entries()) {
    if (entry === active || !entry.isActive) continue;
    if (priority !== null && entry.overlay !== priority) continue;
    const element = entry.ref.current;
    if (element === null) continue;
    candidates.push({ id: entry.id, rect: elementRect(element) });
  }
  const next = nextInDirection(current, candidates, direction);
  if (next !== null) target.focus(next);
}

/** True when the focused stop uses this Escape itself (`FocusEntry.claimsEscape`). */
function claimsEscape(active: FocusEntry | null): boolean {
  if (active === null || active.claimsEscape === undefined) return false;
  return active.claimsEscape();
}

/** No Ctrl, Meta, Super or Hyper held: the keys Ink itself would have handled. */
function isUnmodified(key: Key): boolean {
  return !key.ctrl && !key.meta && !key.super && !key.hyper;
}

export interface FocusNavigatorProps {
  /** The subtree that gets the navigator's `FocusCommands`. */
  children?: ReactNode;
}

/**
 * The focused id as the navigator sees it. Ink's `activeId` only changes once
 * React commits, so several keys in one stdin chunk would all step from the
 * same stop; `current` follows every focus the navigator sets right away and
 * goes back to Ink's id whenever a render shows that id changed (a click, a
 * component focusing itself).
 */
interface FocusTracker {
  /** Ink's `activeId` at the last render. */
  committed: string | undefined;
  /** The id focus moves from on the next key. */
  current: string | undefined;
}

/** Catches up with a focus change made outside the navigator, seen in a render. */
function syncTracker(tracker: FocusTracker, activeId: string | undefined): void {
  if (tracker.committed === activeId) return;
  tracker.committed = activeId;
  tracker.current = activeId;
}

/** A focus target that steps from the tracked id and records every focus it sets. */
function trackedTarget(tracker: FocusTracker, focusById: (id: string) => void): FocusTarget {
  return {
    activeId: tracker.current,
    focus: function focusTracked(id: string) {
      tracker.current = id;
      focusById(id);
    },
  };
}

/**
 * The navigator's `PriorityInput`: one object for its whole life (its
 * `released` set is kept across renders, created once), whose `hovered`
 * follows the latest render, so a key or a command reads it fresh.
 */
function usePriorityInput(hovered: string | null): PriorityInput {
  const ref = useRef<PriorityInput | null>(null);
  if (ref.current === null) ref.current = { hovered, released: new Set() };
  ref.current.hovered = hovered;
  return ref.current;
}

/**
 * Owns keyboard focus movement over the registered stops. On mount it turns
 * Ink's own focus handling off (and back on when it unmounts), so Ink never
 * moves focus first: Tab and Shift+Tab follow the Tab cycle (deterministic,
 * whatever order components mounted in; the `order` of the `FocusScope`
 * above, or `defaultCycle` without one), Escape is left to a focused stop
 * that claims it (`claimsEscape`), else cancels the innermost open modal
 * layer, else drops focus, and the arrows
 * move to the nearest stop in their direction whenever the focused component
 * does not use that arrow itself (or has nowhere further to go). While an
 * overlay has priority (one of its stops has focus, or, for a non-modal
 * dialog, the pointer is over it: `OverlayPriorityContext`), Tab and the
 * arrows only reach its own stops; Escape drops focus as usual when one of
 * its stops has it and ends that priority (the overlay keeps its place in
 * the cycle until the pointer enters it or it opens again), and does nothing
 * when the dialog only has the pointer. Each key
 * steps from the stop the previous key focused, even before React commits.
 * Provides `FocusCommands` to its children. Without a focus registry above it
 * there are no stops to move over, so it leaves Ink's own handling on and
 * does nothing. Ink's focus switch is one global flag, so several standalone
 * renderers (without a `FocusScope`) each flip it: an app with more than one
 * renderer should wrap them in one `FocusScope`.
 */
export function FocusNavigator({ children }: FocusNavigatorProps) {
  const registry = useContext(FocusRegistryContext);
  const order = useContext(FocusCycleContext);
  const layers = useContext(ModalLayerContext);
  const hovered = useContext(OverlayPriorityContext).hovered;
  const priority = usePriorityInput(hovered);
  const manager = useFocusManager();
  const managerRef = useRef(manager);
  managerRef.current = manager;
  const trackerRef = useRef<FocusTracker>({
    committed: manager.activeId,
    current: manager.activeId,
  });
  syncTracker(trackerRef.current, manager.activeId);
  const disableFocus = manager.disableFocus;
  const enableFocus = manager.enableFocus;
  const focusById = manager.focus;
  const hasRegistry = registry !== null;

  // A layout effect runs before every stop's mount effects (where `autoFocus`
  // focuses), wherever the navigator sits among them; turning Ink's focus off
  // later would clear that focus again. `disableFocus` also clears the focused
  // id, so a stop focused before a navigator mounting later gets it back.
  // Unmounting hands Tab, Escape and autoFocus back to Ink, so plain Ink
  // `useFocus` UI shown once the renderer is gone moves with Ink's Tab again.
  useLayoutEffect(
    function takeOverFromInk() {
      if (!hasRegistry) return undefined;
      const focusedBefore = managerRef.current.activeId;
      disableFocus();
      if (focusedBefore !== undefined) focusById(focusedBefore);
      return function handBackToInk() {
        enableFocus();
      };
    },
    [disableFocus, enableFocus, focusById, hasRegistry],
  );

  // The pointer entering a dialog Escape released gives it priority by focus back.
  useEffect(
    function reengageHovered() {
      if (hovered !== null) priority.released.delete(hovered);
    },
    [hovered, priority],
  );

  // So does one of its stops taking focus while the pointer is over it (a hovered
  // button focusing itself). Keyed on the focused id too, but the Escape drop
  // leaves no stop focused, so it never undoes its own release.
  const activeId = manager.activeId;
  useEffect(
    function reengageFocusedHover() {
      rearmHoveredFocus(priority, activeEntry(registry, activeId));
    },
    [activeId, hovered, priority, registry],
  );

  const commands = useMemo(
    function buildCommands(): FocusCommands {
      function target(): FocusTarget {
        return trackedTarget(trackerRef.current, managerRef.current.focus);
      }
      return {
        focusFirst: function focusFirst() {
          focusFirstStop(registry, order, target());
        },
        focusFirstIn: function focusFirstIn(overlayId: string) {
          // An overlay focused on opening has priority by focus again.
          priority.released.delete(overlayId);
          focusFirstStopIn(registry, order, target(), overlayId);
        },
        focusNext: function focusNext() {
          stepCycle(registry, order, target(), priority, 1);
        },
        focusPrevious: function focusPrevious() {
          stepCycle(registry, order, target(), priority, -1);
        },
      };
    },
    [registry, order, priority],
  );

  useInput(function handleKey(_input, key) {
    if (registry === null || key.eventType === "release") return;
    const target = trackedTarget(trackerRef.current, manager.focus);
    if (key.tab && isUnmodified(key)) {
      stepCycle(registry, order, target, priority, key.shift ? -1 : 1);
      return;
    }
    if (key.escape && !key.shift && isUnmodified(key)) {
      const active = activeEntry(registry, target.activeId);
      if (claimsEscape(active)) return;
      if (layers.cancelActive()) return;
      if (escapeKeepsFocus(registry, priority, active)) return;
      // Ink exposes no way to clear the focused id but this; its flag stays off.
      manager.disableFocus();
      trackerRef.current.current = undefined;
      return;
    }
    const direction = arrowDirection(key);
    if (direction !== null) moveByArrow(registry, target, priority, direction);
  });

  return <FocusCommandsContext.Provider value={commands}>{children}</FocusCommandsContext.Provider>;
}

/** The entry of the focused component, for callers that only know the manager. */
export function activeEntry(
  registry: { find: (id: string) => FocusEntry | null } | null,
  activeId: string | undefined,
): FocusEntry | null {
  if (registry === null || activeId === undefined) return null;
  return registry.find(activeId);
}
