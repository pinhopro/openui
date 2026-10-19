import { createContext, useContext, useState } from "react";

/** Hands out program ranks: 0 to the first renderer that asks, 1 to the next, and so on. */
export interface ProgramRanks {
  take: () => number;
}

/**
 * Provided by `FocusScope`, so every `InkRenderer` inside takes its own rank;
 * null for a standalone renderer.
 */
export const ProgramRankContext = createContext<ProgramRanks | null>(null);

/** A counter of the renderers that registered with one scope, in registration order. */
export function createProgramRanks(): ProgramRanks {
  let next = 0;
  function take(): number {
    const rank = next;
    next += 1;
    return rank;
  }
  return { take };
}

/**
 * The rank of the renderer being rendered among the renderers of its
 * `FocusScope`: taken once, when the renderer first renders, and kept for its
 * lifetime, so a renderer mounting after another always ranks after it. The
 * renderer's whole sequence sits under its rank, so the stops of one program
 * never interleave with another's. A standalone renderer (no scope) ranks 0.
 */
export function useProgramRank(): number {
  const ranks = useContext(ProgramRankContext);
  const [rank] = useState(function takeRank(): number {
    if (ranks === null) return 0;
    return ranks.take();
  });
  return rank;
}
