import { createContext, useContext } from "react";

/**
 * Where the element being rendered sits in the program, outermost first
 * (`[0, 0, 1, 0]`): the program's rank among the renderers of its
 * `FocusScope` (see `useProgramRank`), then for each element the order in
 * which its parent rendered it. Comparing two paths element by element gives
 * their document order.
 */
export const SequencePathContext = createContext<number[]>([]);

/** The sequence path of the component being rendered; empty outside the renderer. */
export function useSequencePath(): number[] {
  return useContext(SequencePathContext);
}
