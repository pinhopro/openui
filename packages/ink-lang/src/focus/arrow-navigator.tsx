import { useFocusManager, useInput } from "ink";
import { useContext, useEffect, useRef } from "react";
import { elementRect, type CellRect } from "./element-rect";
import {
  arrowDirection,
  claimsDirection,
  nextInDirection,
  type NavigationCandidate,
} from "./focus-navigation";
import { focusOrder, hostStops, nextInOrder, type CycleStop } from "./focus-order";
import { FocusRegistryContext, type FocusEntry, type FocusRegistry } from "./focus-registry";

/**
 * The Tab cycle: the host's stops in registration order, then the program's
 * stops in document order.
 */
function tabCycle(registry: FocusRegistry): CycleStop[] {
  const cycle: CycleStop[] = [];
  for (const entry of hostStops(registry)) cycle.push(entry);
  for (const stop of focusOrder(registry)) cycle.push(stop);
  return cycle;
}

/**
 * Owns keyboard focus movement over the registered stops. Tab and Shift+Tab
 * follow the Tab cycle (deterministic, whatever order components mounted
 * in); the arrows move to the nearest stop in their direction whenever the
 * focused component does not use that arrow itself (or has nowhere further
 * to go). Renders nothing.
 */
export function ArrowNavigator() {
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(function clearPending() {
    return function cancel() {
      if (pendingRef.current !== null) clearTimeout(pendingRef.current);
    };
  }, []);

  /** Ink moves focus on Tab itself in the same tick; ours lands right after and decides. */
  function focusAfterInk(id: string): void {
    if (pendingRef.current !== null) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(function apply() {
      pendingRef.current = null;
      manager.focus(id);
    }, 0);
  }

  useInput(function handleKey(_input, key) {
    if (registry === null || key.eventType === "release") return;
    if (key.tab) {
      const next = nextInOrder(tabCycle(registry), manager.activeId, key.shift ? -1 : 1);
      if (next !== null) focusAfterInk(next);
      return;
    }
    const direction = arrowDirection(key);
    if (direction === null) return;
    const activeId = manager.activeId;
    const active = activeId === undefined ? null : registry.find(activeId);
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
    if (next !== null) manager.focus(next);
  });

  return null;
}

/** The entry of the focused component, for callers that only know the manager. */
export function activeEntry(
  registry: { find: (id: string) => FocusEntry | null } | null,
  activeId: string | undefined,
): FocusEntry | null {
  if (registry === null || activeId === undefined) return null;
  return registry.find(activeId);
}
