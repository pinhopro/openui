import { useCallback, useMemo, useState, type ReactNode } from "react";
import { OverlayPriorityContext, type OverlayPriorityState } from "./overlay-priority";

export interface OverlayPriorityProviderProps {
  children: ReactNode;
}

/**
 * Keeps the hovered dialog overlay (`OverlayPriorityState`) for everything
 * below it. The state lives in this component alone, so a hover change
 * re-renders only the components that read the context (the navigator and
 * the trackers), never the program around them. `setHovered` and
 * `clearHovered` are stable.
 */
export function OverlayPriorityProvider({ children }: OverlayPriorityProviderProps) {
  const [hovered, setHoveredState] = useState<string | null>(null);
  const setHovered = useCallback(function setHovered(id: string | null): void {
    setHoveredState(id);
  }, []);
  const clearHovered = useCallback(function clearHovered(id: string): void {
    setHoveredState(function withoutId(current) {
      return current === id ? null : current;
    });
  }, []);
  const value = useMemo(
    function buildState(): OverlayPriorityState {
      return { hovered, setHovered, clearHovered };
    },
    [hovered, setHovered, clearHovered],
  );
  return (
    <OverlayPriorityContext.Provider value={value}>{children}</OverlayPriorityContext.Provider>
  );
}
