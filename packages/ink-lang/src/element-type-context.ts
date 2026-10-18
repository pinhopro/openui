import { createContext, useContext } from "react";

/**
 * The type names of the component elements being rendered, outermost first
 * (`["Stack", "Table", "Input"]`): the last one is the current element, the
 * rest are its ancestors, which descendant selectors like `Table Input` match.
 */
export const ElementPathContext = createContext<string[]>([]);

/** The element path of the component being rendered; empty outside the renderer. */
export function useElementPath(): string[] {
  return useContext(ElementPathContext);
}

/** The type name of the nearest component element; empty outside the renderer. */
export function useElementType(): string {
  const path = useElementPath();
  return path.length === 0 ? "" : (path[path.length - 1] as string);
}
