import { createContext } from "react";

/**
 * The stacking layer the current subtree paints in: 0 for the page, the
 * overlay's stacking index plus one inside an overlay. A mouse target in a
 * higher layer wins the hit-test over targets in lower layers, whatever their
 * depth in the tree.
 */
export const MouseLayerContext = createContext<number>(0);
