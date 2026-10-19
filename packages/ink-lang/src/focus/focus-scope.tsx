import { useContext, useMemo, useRef, type ReactNode } from "react";
import { UiEventContext, type UiEvent } from "../ui-events";
import { FocusNavigator } from "./focus-navigator";
import { createFocusRegistry, FocusRegistryContext } from "./focus-registry";
import { KeyReporter } from "./key-reporter";
import { ModalLayerContext } from "./modal-layer";
import { useModalLayers } from "./use-modal-layers";

export interface FocusScopeProps {
  children: ReactNode;
  /**
   * Receives the keydown/keyup events of the scope and the focus, blur and
   * mouse events of the host's own stops; each `InkRenderer` inside still
   * reports its program's events through its own `onUiEvent`.
   */
  onUiEvent?: (event: UiEvent) => void;
}

/**
 * One focus registry, one modal layer stack and one navigator for a whole
 * app: wrap the app in it and every `useFocusable` inside (the host's own
 * sidebar as much as the programs rendered by `InkRenderer`) joins the same
 * Tab order and the same arrow-key map, so the arrows cross from a page into
 * the panel beside it, and while a program's modal is open the host's stops
 * are inert too. `InkRenderer` creates its own scope only when none is above it.
 */
export function FocusScope({ children, onUiEvent }: FocusScopeProps) {
  const inherited = useContext(FocusRegistryContext);
  const registry = useMemo(createFocusRegistry, []);
  const modalLayers = useModalLayers();
  const listenerRef = useRef(onUiEvent);
  listenerRef.current = onUiEvent;
  const emit = useMemo(function stableListener() {
    return function emitUiEvent(event: UiEvent): void {
      listenerRef.current?.(event);
    };
  }, []);
  if (inherited !== null) return children;
  return (
    <FocusRegistryContext.Provider value={registry}>
      <UiEventContext.Provider value={emit}>
        <ModalLayerContext.Provider value={modalLayers}>
          <FocusNavigator>
            <KeyReporter />
            {children}
          </FocusNavigator>
        </ModalLayerContext.Provider>
      </UiEventContext.Provider>
    </FocusRegistryContext.Provider>
  );
}
