import { useContext, useMemo, useRef, type ReactNode } from "react";
import { UiEventContext, type UiEvent } from "../ui-events";
import { ArrowNavigator } from "./arrow-navigator";
import { createFocusRegistry, FocusRegistryContext } from "./focus-registry";
import { KeyReporter } from "./key-reporter";

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
 * One focus registry and one navigator for a whole app: wrap the app in it
 * and every `useFocusable` inside (the host's own sidebar as much as the
 * programs rendered by `InkRenderer`) joins the same Tab order and the same
 * arrow-key map, so the arrows cross from a page into the panel beside it.
 * `InkRenderer` creates its own scope only when none is above it.
 */
export function FocusScope({ children, onUiEvent }: FocusScopeProps) {
  const inherited = useContext(FocusRegistryContext);
  const registry = useMemo(createFocusRegistry, []);
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
        <ArrowNavigator />
        <KeyReporter />
        {children}
      </UiEventContext.Provider>
    </FocusRegistryContext.Provider>
  );
}
