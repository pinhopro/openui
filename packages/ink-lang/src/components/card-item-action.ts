import {
  ACTION_STEPS,
  BuiltinActionType,
  type ActionPlan,
  type ActionStep,
} from "@openuidev/lang-core";
import type { LegacyAction } from "../runtime/trigger-action";

/** The context of the card the user pressed, merged into the block's action. */
export type ItemContext = Record<string, unknown>;

function formatItemContext(context: ItemContext): string {
  return `Selected item: ${JSON.stringify(context)}`;
}

function isActionPlan(action: unknown): action is ActionPlan {
  if (typeof action !== "object" || action === null) return false;
  return Array.isArray((action as { steps?: unknown }).steps);
}

function dropUndefined(context: ItemContext): ItemContext {
  const kept: ItemContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined) kept[key] = value;
  }
  return kept;
}

function withStepContext(step: ActionStep, suffix: string): ActionStep {
  if (step.type !== ACTION_STEPS.ToAssistant) return step;
  if (step.context === null || step.context === undefined) return { ...step, context: suffix };
  const existing = typeof step.context === "string" ? step.context : JSON.stringify(step.context);
  return { ...step, context: `${existing}\n${suffix}` };
}

/**
 * Port of react-ui's withItemContext: the block's `action` with the pressed
 * item's context (index, id, title...) folded in. An ActionPlan gets the
 * context appended to its ToAssistant steps, a legacy object gets it merged
 * into its params, and no action becomes a continue-conversation carrying it.
 */
export function withItemContext(
  action: unknown,
  itemContext: ItemContext,
): ActionPlan | LegacyAction {
  const context = dropUndefined(itemContext);
  if (action === undefined || action === null) {
    return { type: BuiltinActionType.ContinueConversation, params: context };
  }
  if (isActionPlan(action)) {
    if (Object.keys(context).length === 0) return action;
    const suffix = formatItemContext(context);
    const steps: ActionStep[] = [];
    for (const step of action.steps) steps.push(withStepContext(step, suffix));
    return { ...action, steps };
  }
  const legacy = action as LegacyAction;
  const params: Record<string, unknown> = { ...(legacy.params ?? {}) };
  if (legacy.url !== undefined) params["url"] = legacy.url;
  if (legacy.context !== undefined && legacy.context !== null && legacy.context !== "") {
    params["context"] = legacy.context;
  }
  return {
    type: legacy.type ?? BuiltinActionType.ContinueConversation,
    params: { ...params, ...context },
  };
}

/** A string prop of a child element (`lhs.props.title`...), or undefined. */
export function elementStringProp(node: unknown, key: string): string | undefined {
  if (typeof node !== "object" || node === null) return undefined;
  const props = (node as { props?: Record<string, unknown> }).props;
  const value = props?.[key];
  return typeof value === "string" ? value : undefined;
}
