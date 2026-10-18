import { useFocusManager, useInput } from "ink";
import { useContext } from "react";
import { elementRect, type CellRect } from "./element-rect";
import {
  arrowDirection,
  claimsDirection,
  nextInDirection,
  type NavigationCandidate,
} from "./focus-navigation";
import { FocusRegistryContext, type FocusEntry } from "./focus-registry";

/**
 * Moves focus with the arrow keys between the registered focus stops, by
 * their position on screen, whenever the focused component does not use
 * that arrow itself. Renders nothing.
 */
export function ArrowNavigator() {
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();

  useInput(function handleArrowKey(_input, key) {
    if (registry === null) return;
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
