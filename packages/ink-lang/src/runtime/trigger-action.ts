import { BuiltinActionType, type ActionPlan } from "@openuidev/lang-core";
import { runActionPlan, type ActionRuntime } from "./run-action-plan";

/** The pre-1.0 action shape some stored programs still carry. */
export interface LegacyAction {
  type?: string;
  params?: Record<string, unknown>;
  url?: string;
  context?: unknown;
}

export function isActionPlan(value: unknown): value is ActionPlan {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record["steps"]);
}

/**
 * What a Button (or any interactive component) calls. An evaluated Action()
 * runs its steps; a legacy object is delivered as one event; no action at all
 * sends the label to the assistant.
 */
export async function triggerAction(
  userMessage: string,
  formName: string | undefined,
  action: ActionPlan | LegacyAction | null | undefined,
  runtime: ActionRuntime,
): Promise<void> {
  const hasAction = action !== undefined && action !== null;
  if (hasAction && isActionPlan(action)) {
    await runActionPlan(action, formName, runtime);
    return;
  }
  if (hasAction) {
    emitLegacyAction(userMessage, formName, action, runtime);
    return;
  }
  runtime.emit({
    type: BuiltinActionType.ContinueConversation,
    params: {},
    humanFriendlyMessage: userMessage,
    formState: runtime.getFormPayload(formName),
    formName,
  });
}

function emitLegacyAction(
  userMessage: string,
  formName: string | undefined,
  action: LegacyAction,
  runtime: ActionRuntime,
): void {
  const hasType = action.type !== undefined && action.type !== "";
  const type = hasType ? String(action.type) : BuiltinActionType.ContinueConversation;
  // Only a real call made by the model may deliver a custom action.
  if (runtime.customActionNames.includes(type)) return;
  const params: Record<string, unknown> = { ...(action.params ?? {}) };
  if (action.url !== undefined) params["url"] = action.url;
  if (action.context !== undefined) params["context"] = action.context;
  runtime.emit({
    type,
    params,
    humanFriendlyMessage: userMessage,
    formState: runtime.getFormPayload(formName),
    formName,
  });
}
