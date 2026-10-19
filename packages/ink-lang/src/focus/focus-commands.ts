import { createContext, useContext } from "react";

/** Moves focus along the library's Tab cycle, for components that move it themselves. */
export interface FocusCommands {
  /** Focuses the first stop of the cycle. */
  focusFirst: () => void;
  /**
   * Focuses the first stop of the cycle that renders in the overlay
   * `overlayId` (`FocusStop.overlay`); does nothing when the cycle has none.
   */
  focusFirstIn: (overlayId: string) => void;
  /** Focuses the stop after the focused one (the first when none is), wrapping around. */
  focusNext: () => void;
  /** Focuses the stop before the focused one (the last when none is), wrapping around. */
  focusPrevious: () => void;
}

function doNothing(): void {}

const NO_COMMANDS: FocusCommands = {
  focusFirst: doNothing,
  focusFirstIn: doNothing,
  focusNext: doNothing,
  focusPrevious: doNothing,
};

/** Provided by `FocusNavigator`; outside one every command does nothing. */
export const FocusCommandsContext = createContext<FocusCommands>(NO_COMMANDS);

/** The focus commands of the navigator above. */
export function useFocusCommands(): FocusCommands {
  return useContext(FocusCommandsContext);
}
