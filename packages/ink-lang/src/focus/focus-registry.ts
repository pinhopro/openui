import type { DOMElement } from "ink";
import { createContext, type RefObject } from "react";
import type { ArrowClaimsInput } from "./focus-navigation";

/** One mounted focus stop, as `useFocusable` registers it. */
export interface FocusEntry {
  /** The id given to Ink's focus manager. */
  id: string;
  /** The box the stop occupies; null until mounted. */
  ref: RefObject<DOMElement | null>;
  isActive: boolean;
  arrows: ArrowClaimsInput;
  component: string;
  name: string;
}

export interface FocusRegistry {
  register: (entry: FocusEntry) => () => void;
  entries: () => FocusEntry[];
  find: (id: string) => FocusEntry | null;
}

export const FocusRegistryContext = createContext<FocusRegistry | null>(null);

/** The registry the renderer provides: every focus stop with its box, for the arrow keys. */
export function createFocusRegistry(): FocusRegistry {
  const stops = new Set<FocusEntry>();

  function register(entry: FocusEntry): () => void {
    stops.add(entry);
    return function unregister() {
      stops.delete(entry);
    };
  }

  function entries(): FocusEntry[] {
    return Array.from(stops);
  }

  function find(id: string): FocusEntry | null {
    for (const entry of stops) {
      if (entry.id === id) return entry;
    }
    return null;
  }

  return { register, entries, find };
}
