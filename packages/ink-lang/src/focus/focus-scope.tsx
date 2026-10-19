import { useContext, useMemo, useRef, type ReactNode } from "react";
import { UiEventContext, type UiEvent } from "../ui-events";
import { defaultCycle, FocusCycleContext, type FocusCycleOrder } from "./focus-cycle";
import { FocusNavigator } from "./focus-navigator";
import type { FocusStop } from "./focus-order";
import { createFocusRegistry, FocusRegistryContext, type FocusEntry } from "./focus-registry";
import { KeyReporter } from "./key-reporter";
import { ModalLayerContext } from "./modal-layer";
import { createProgramRanks, ProgramRankContext } from "./program-rank";
import { useModalLayers } from "./use-modal-layers";

export { defaultCycle } from "./focus-cycle";

export interface FocusScopeProps {
  children: ReactNode;
  /**
   * Receives the keydown/keyup events of the scope and the focus, blur and
   * mouse events of the host's own stops; each `InkRenderer` inside still
   * reports its program's events through its own `onUiEvent`.
   */
  onUiEvent?: (event: UiEvent) => void;
  /**
   * Places the host's stops around the program's: receives the program's
   * stops in Tab order and the host's own stops in registration order (only
   * the ones that can take focus right now) and returns the ids of the full
   * cycle, first to last. Asked on every Tab, so it may read the latest app
   * state. Default: `defaultCycle`, the host's stops first, then the program's.
   */
  order?: (program: FocusStop[], host: FocusEntry[]) => string[];
}

/**
 * One focus registry, one modal layer stack and one navigator for a whole
 * app: wrap the app in it and every `useFocusable` inside (the host's own
 * sidebar as much as the programs rendered by `InkRenderer`) joins the same
 * Tab cycle and the same arrow-key map, so the arrows cross from a page into
 * the panel beside it, and while a program's modal is open the host's stops
 * are inert too. `order` decides where the host's stops sit in the cycle.
 * Each `InkRenderer` inside takes a program rank in the order the renderers
 * first render, and its stops sort by that rank first, so the stops of one
 * program all come before the next program's. `InkRenderer` creates its own
 * scope only when none is above it. A scope nested in another one (inside its
 * registry) joins the outer scope and ignores its own `order` and `onUiEvent`.
 */
export function FocusScope({ children, onUiEvent, order }: FocusScopeProps) {
  const inherited = useContext(FocusRegistryContext);
  const registry = useMemo(createFocusRegistry, []);
  const programRanks = useMemo(createProgramRanks, []);
  const modalLayers = useModalLayers();
  const listenerRef = useRef(onUiEvent);
  listenerRef.current = onUiEvent;
  const orderRef = useRef(order);
  orderRef.current = order;
  const emit = useMemo(function stableListener() {
    return function emitUiEvent(event: UiEvent): void {
      listenerRef.current?.(event);
    };
  }, []);
  // Stable, so a new `order` function on every render re-renders nothing.
  const cycle = useMemo(function stableOrder(): FocusCycleOrder {
    return function scopeCycle(program: FocusStop[], host: FocusEntry[]): string[] {
      const current = orderRef.current;
      if (current === undefined) return defaultCycle(program, host);
      return current(program, host);
    };
  }, []);
  if (inherited !== null) return children;
  return (
    <FocusRegistryContext.Provider value={registry}>
      <UiEventContext.Provider value={emit}>
        <ModalLayerContext.Provider value={modalLayers}>
          <FocusCycleContext.Provider value={cycle}>
            <ProgramRankContext.Provider value={programRanks}>
              <FocusNavigator>
                <KeyReporter />
                {children}
              </FocusNavigator>
            </ProgramRankContext.Provider>
          </FocusCycleContext.Provider>
        </ModalLayerContext.Provider>
      </UiEventContext.Provider>
    </FocusRegistryContext.Provider>
  );
}
