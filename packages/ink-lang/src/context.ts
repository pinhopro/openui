import type { ActionPlan, EvaluationContext, OpenUIError, Store } from "@openuidev/lang-core";
import { createContext, useContext } from "react";
import type { Library } from "./library";
import type { LegacyAction } from "./runtime/trigger-action";

/** Fires an action from a component: an evaluated Action(), a legacy object, or nothing. */
export type TriggerAction = (
  userMessage: string,
  formName?: string,
  action?: ActionPlan | LegacyAction | null,
) => Promise<void>;

export type GetFieldValue = (formName: string | undefined, name: string) => unknown;

export type SetFieldValue = (
  formName: string | undefined,
  componentType: string | undefined,
  name: string,
  value: unknown,
) => void;

/** What every rendered component can reach through the hooks below. */
export interface OpenUIContextValue {
  /** The active library (schemas and renderers). */
  library: Library;
  triggerAction: TriggerAction;
  /** True while the model is still producing the program. */
  isStreaming: boolean;
  /** True while any Query() is fetching. */
  isQueryLoading: boolean;
  getFieldValue: GetFieldValue;
  setFieldValue: SetFieldValue;
  /** The store that holds `$variables` and form fields. */
  store: Store;
  evaluationContext: EvaluationContext;
  /** Used by the error boundary to report a renderer that threw. */
  reportError: (error: OpenUIError) => void;
}

export const OpenUIContext = createContext<OpenUIContextValue | null>(null);

/** The full context. Throws outside an InkRenderer. */
export function useOpenUI(): OpenUIContextValue {
  const value = useContext(OpenUIContext);
  if (value === null) {
    throw new Error("useOpenUI must be used within an <InkRenderer /> component.");
  }
  return value;
}

export function useTriggerAction(): TriggerAction {
  const context = useOpenUI();
  return context.triggerAction;
}

export function useIsStreaming(): boolean {
  const context = useOpenUI();
  return context.isStreaming;
}

export function useIsQueryLoading(): boolean {
  const context = useOpenUI();
  return context.isQueryLoading;
}

export function useGetFieldValue(): GetFieldValue {
  const context = useOpenUI();
  return context.getFieldValue;
}

export function useSetFieldValue(): SetFieldValue {
  const context = useOpenUI();
  return context.setFieldValue;
}
