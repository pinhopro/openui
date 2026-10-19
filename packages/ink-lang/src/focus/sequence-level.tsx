import type { ReactNode } from "react";
import { SequencePathContext, useSequencePath } from "./sequence-path";

export interface SequenceLevelProps {
  /** The order the group takes among the stops and children of the current element. */
  order: number;
  children: ReactNode;
}

/**
 * Puts a group of children one level below the current sequence path, at
 * `order`, the way an element nests its own children. A component that draws
 * one stop per item and each item's content right after it (an accordion
 * section under its header, a pressable card around its content) wraps each
 * item's content at the item's order, so everything inside comes after the
 * item's stop and before the next item, whatever orders the content took.
 * A level at an order the same element's `renderNode` also hands out (by its
 * counter or an explicit `{ order }`) interleaves the two groups under that
 * one number; keeping them apart is the caller's responsibility.
 */
export function SequenceLevel({ order, children }: SequenceLevelProps) {
  const parent = useSequencePath();
  return (
    <SequencePathContext.Provider value={parent.concat(order)}>
      {children}
    </SequencePathContext.Provider>
  );
}
