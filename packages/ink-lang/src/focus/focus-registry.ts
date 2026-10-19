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
  /**
   * Asked when Escape is pressed while the stop has focus: true when the
   * component uses this Escape itself (a Combobox clearing its filter), so
   * the navigator neither cancels the open modal nor drops focus. Absent for
   * a stop that never claims it.
   */
  claimsEscape?: () => boolean;
  component: string;
  name: string;
  /**
   * The stop's sequence path (its element's path plus its own order), which
   * the Tab order sorts by; null for a stop outside the renderer (a host stop).
   */
  path: number[] | null;
  /** The id of the overlay the stop renders in (`useOverlayId`); null outside any overlay. */
  overlay: string | null;
  /**
   * The id of the base stop the stop's overlay is anchored to
   * (`useOverlayAnchor`: a dropped dialog re-anchored to the stop behind it);
   * null for a stop on the base or in an overlay anchored to the tree.
   */
  anchor: string | null;
}

export interface FocusRegistry {
  register: (entry: FocusEntry) => () => void;
  entries: () => FocusEntry[];
  find: (id: string) => FocusEntry | null;
  /**
   * Asks to take focus on mount (`autoFocus`): true for the first stop that
   * asks while no other one holds the claim. The holder keeps it until it
   * releases it (once it loses focus) or unregisters, so of the autoFocus
   * stops mounting in one commit only the first takes focus.
   */
  claimAutoFocus: (id: string) => boolean;
  /** Gives the autoFocus claim back; a no-op unless `id` holds it. */
  releaseAutoFocus: (id: string) => void;
}

export const FocusRegistryContext = createContext<FocusRegistry | null>(null);

/** The registry the renderer provides: every focus stop with its box, for the arrow keys. */
export function createFocusRegistry(): FocusRegistry {
  const stops = new Set<FocusEntry>();
  let autoFocusHolder: string | null = null;

  function register(entry: FocusEntry): () => void {
    stops.add(entry);
    return function unregister() {
      stops.delete(entry);
      releaseAutoFocus(entry.id);
    };
  }

  function claimAutoFocus(id: string): boolean {
    if (autoFocusHolder !== null) return false;
    autoFocusHolder = id;
    return true;
  }

  function releaseAutoFocus(id: string): void {
    if (autoFocusHolder === id) autoFocusHolder = null;
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

  return { register, entries, find, claimAutoFocus, releaseAutoFocus };
}
