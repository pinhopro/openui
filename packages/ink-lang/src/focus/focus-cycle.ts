import { createContext } from "react";
import type { FocusStop } from "./focus-order";
import type { FocusEntry } from "./focus-registry";

/**
 * Builds the full Tab cycle from the program's stops (in Tab order, see
 * `focusOrder`) and the host's own stops (in registration order, see
 * `hostStops`): the ids of the stops to visit, first to last. Both lists hold
 * only the stops that can take focus right now.
 */
export type FocusCycleOrder = (program: FocusStop[], host: FocusEntry[]) => string[];

/** The default cycle: the host's stops first, in registration order, then the program's. */
export function defaultCycle(program: FocusStop[], host: FocusEntry[]): string[] {
  const ids: string[] = [];
  for (const entry of host) ids.push(entry.id);
  for (const stop of program) ids.push(stop.id);
  return ids;
}

/** Provided by `FocusScope`; without one (a standalone renderer) the cycle is `defaultCycle`. */
export const FocusCycleContext = createContext<FocusCycleOrder>(defaultCycle);
