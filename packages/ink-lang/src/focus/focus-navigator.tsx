import { useFocusManager, useInput, type Key } from "ink";
import { useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
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
 */
function tabCycle(registry: FocusRegistry, order: FocusCycleOrder): CycleStop[] {
  const program = focusOrder(registry);
  const host = hostStops(registry);
  const offered = new Set<string>();
  for (const stop of program) offered.add(stop.id);
  for (const entry of host) offered.add(entry.id);
  const cycle: CycleStop[] = [];
  for (const id of order(program, host)) {
    if (offered.has(id)) cycle.push({ id });
  }
  return cycle;
}

/** Moves focus one step along the Tab cycle from the focused stop. */
function stepCycle(
  registry: FocusRegistry | null,
  order: FocusCycleOrder,
  target: FocusTarget,
  delta: 1 | -1,
): void {
  if (registry === null) return;
  const next = nextInOrder(tabCycle(registry, order), target.activeId, delta);
  if (next !== null) target.focus(next);
}

/** Focuses the first stop of the Tab cycle. */
function focusFirstStop(
  registry: FocusRegistry | null,
  order: FocusCycleOrder,
  target: FocusTarget,
): void {
  if (registry === null) return;
  const first = tabCycle(registry, order)[0];
  if (first !== undefined) target.focus(first.id);
}

/** Moves focus to the nearest stop in the arrow's direction, unless the focused stop keeps that arrow. */
function moveByArrow(
  registry: FocusRegistry,
  target: FocusTarget,
  direction: ArrowDirection,
): void {
  const active = activeEntry(registry, target.activeId);
  if (active !== null && claimsDirection(active.arrows, direction)) return;
  let current: CellRect | null = null;
  if (active !== null && active.ref.current !== null) current = elementRect(active.ref.current);
  const candidates: NavigationCandidate[] = [];
  for (const entry of registry.entries()) {
    if (entry === active || !entry.isActive) continue;
    const element = entry.ref.current;
    if (element === null) continue;
    candidates.push({ id: entry.id, rect: elementRect(element) });
  }
  const next = nextInDirection(current, candidates, direction);
  if (next !== null) target.focus(next);
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
 * Owns keyboard focus movement over the registered stops. On mount it turns
 * Ink's own focus handling off, so Ink never moves focus first: Tab and
 * Shift+Tab follow the Tab cycle (deterministic, whatever order components
 * mounted in; the `order` of the `FocusScope` above, or `defaultCycle`
 * without one), Escape drops focus, and the arrows move to the nearest stop
 * in their direction whenever the focused component does not use that arrow
 * itself (or has nowhere further to go). Provides `FocusCommands` to its
 * children. Without a focus registry above it there are no stops to move
 * over, so it leaves Ink's own handling on and does nothing.
 */
export function FocusNavigator({ children }: FocusNavigatorProps) {
  const registry = useContext(FocusRegistryContext);
  const order = useContext(FocusCycleContext);
  const manager = useFocusManager();
  const managerRef = useRef(manager);
  managerRef.current = manager;
  const disableFocus = manager.disableFocus;
  const focusById = manager.focus;
  const hasRegistry = registry !== null;

  // A layout effect runs before every stop's mount effects (where `autoFocus`
  // focuses), wherever the navigator sits among them; turning Ink's focus off
  // later would clear that focus again. `disableFocus` also clears the focused
  // id, so a stop focused before a navigator mounting later gets it back.
  useLayoutEffect(
    function takeOverFromInk() {
      if (!hasRegistry) return;
      const focusedBefore = managerRef.current.activeId;
      disableFocus();
      if (focusedBefore !== undefined) focusById(focusedBefore);
    },
    [disableFocus, focusById, hasRegistry],
  );

  const commands = useMemo(
    function buildCommands(): FocusCommands {
      return {
        focusFirst: function focusFirst() {
          focusFirstStop(registry, order, managerRef.current);
        },
        focusNext: function focusNext() {
          stepCycle(registry, order, managerRef.current, 1);
        },
        focusPrevious: function focusPrevious() {
          stepCycle(registry, order, managerRef.current, -1);
        },
      };
    },
    [registry, order],
  );

  useInput(function handleKey(_input, key) {
    if (registry === null || key.eventType === "release") return;
    if (key.tab && isUnmodified(key)) {
      stepCycle(registry, order, manager, key.shift ? -1 : 1);
      return;
    }
    if (key.escape && !key.shift && isUnmodified(key)) {
      // Ink exposes no way to clear the focused id but this; its flag stays off.
      manager.disableFocus();
      return;
    }
    const direction = arrowDirection(key);
    if (direction !== null) moveByArrow(registry, manager, direction);
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
