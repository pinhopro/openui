import { ACTION_STEPS, type ActionPlan } from "@openuidev/lang-core";

/**
 * A primary button validates its form before steps that leave the form:
 * sending a message to the assistant, running a mutation or a custom action.
 * Purely local steps (@Set, @Reset, re-fetching a query) skip validation, and
 * a button without an action always validates (it sends its label).
 */
export function buttonNeedsValidation(plan: ActionPlan | null | undefined): boolean {
  if (plan === null || plan === undefined) return true;
  for (const step of plan.steps) {
    if (step.type === ACTION_STEPS.ToAssistant) return true;
    if (step.type === "custom_action") return true;
    if (step.type === ACTION_STEPS.Run && step.refType === "mutation") return true;
  }
  return false;
}
