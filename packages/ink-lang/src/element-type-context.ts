import { createContext, useContext } from "react";

/** The type name of the component element being rendered (`Button`, `Input`...). */
export const ElementTypeContext = createContext<string>("");

/** The type name of the nearest component element; empty outside the renderer. */
export function useElementType(): string {
  return useContext(ElementTypeContext);
}
