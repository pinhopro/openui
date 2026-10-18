import { createContext, useContext } from "react";
import { useElementPath } from "../element-type-context";
import type { ComputedStyle } from "./declarations";
import { defaultDesignSystem, type DesignSystem } from "./design-system";

export const DesignSystemContext = createContext<DesignSystem>(defaultDesignSystem);

/** The design system the renderer was given (the default one otherwise). */
export function useDesignSystem(): DesignSystem {
  return useContext(DesignSystemContext);
}

/**
 * The computed style of the component being rendered, for the classes
 * (variants and parts) and states it is in, with its ancestors in the
 * element tree: `useComponentStyle(["label"])` inside a FormControl reads
 * `FormControl .label`, and an Input inside a Table matches `Table Input`.
 */
export function useComponentStyle(classes: string[] = [], states: string[] = []): ComputedStyle {
  const system = useDesignSystem();
  const path = useElementPath();
  const component = path.length === 0 ? "" : (path[path.length - 1] as string);
  return system.style({ component, classes, states, ancestors: path.slice(0, -1) });
}

/**
 * The computed style of a part named like an HTML element or another
 * component, under the element being rendered: a table's `th` is
 * `useStyleAs("th", ["number"], [], ["thead", "tr"])`, an editable cell
 * styles like an `Input` under `Table tbody tr td`.
 */
export function useStyleAs(
  component: string,
  classes: string[] = [],
  states: string[] = [],
  below: string[] = [],
): ComputedStyle {
  const system = useDesignSystem();
  const path = useElementPath();
  return system.style({ component, classes, states, ancestors: path.concat(below) });
}
