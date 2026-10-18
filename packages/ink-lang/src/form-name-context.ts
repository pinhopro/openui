import { createContext, useContext } from "react";

/** The name of the nearest enclosing Form; fields nest their values under it. */
export const FormNameContext = createContext<string | undefined>(undefined);

export function useFormName(): string | undefined {
  return useContext(FormNameContext);
}
