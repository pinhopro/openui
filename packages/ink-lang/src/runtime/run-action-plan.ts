import {
  ACTION_STEPS,
  BuiltinActionType,
  evaluate,
  type ActionEvent,
  type ActionPlan,
  type ActionStep,
  type ASTNode,
  type EvaluationContext,
  type MutationStatementInfo,
  type QueryManager,
  type Store,
} from "@openuidev/lang-core";

/** Everything an action needs from the renderer runtime, without React. */
export interface ActionRuntime {
  store: Store;
  queryManager: QueryManager;
  evaluationContext: EvaluationContext;
  /** Names of the library's custom actions (`defineAction`). */
  customActionNames: string[];
  /** The Mutation() statements of the latest parse, read at click time. */
  getMutationStatements: () => MutationStatementInfo[];
  /** The `$variable` defaults of the latest parse, read at click time. */
  getStateDeclarations: () => Record<string, unknown>;
  /** The form state delivered with each event. */
  getFormPayload: (formName: string | undefined) => Record<string, unknown>;
  /** Delivers an event to the host. */
  emit: (event: ActionEvent) => void;
}

/**
 * Executes the steps of an evaluated Action() in order. A failed mutation
 * stops the plan; everything else continues.
 */
export async function runActionPlan(
  plan: ActionPlan,
  formName: string | undefined,
  runtime: ActionRuntime,
): Promise<void> {
  for (const step of plan.steps) {
    const shouldContinue = await runStep(step, formName, runtime);
    if (!shouldContinue) return;
  }
}

async function runStep(
  step: ActionStep,
  formName: string | undefined,
  runtime: ActionRuntime,
): Promise<boolean> {
  switch (step.type) {
    case ACTION_STEPS.Run:
      return runRunStep(step, runtime);
    case ACTION_STEPS.ToAssistant:
      runtime.emit({
        type: BuiltinActionType.ContinueConversation,
        params: step.context !== undefined ? { context: step.context } : {},
        humanFriendlyMessage: step.message,
        formState: runtime.getFormPayload(formName),
        formName,
      });
      return true;
    case ACTION_STEPS.OpenUrl:
      runtime.emit({
        type: BuiltinActionType.OpenUrl,
        params: { url: step.url },
        humanFriendlyMessage: "",
        formState: runtime.getFormPayload(formName),
        formName,
      });
      return true;
    case "custom_action":
      runtime.emit({
        type: step.name,
        params: step.params,
        humanFriendlyMessage: "",
        formState: runtime.getFormPayload(formName),
        formName,
      });
      return true;
    case ACTION_STEPS.Set:
      runSetStep(step.target, step.valueAST, runtime);
      return true;
    case ACTION_STEPS.Reset:
      runResetStep(step.targets, runtime);
      return true;
    default:
      return true;
  }
}

async function runRunStep(
  step: { statementId: string; refType: "query" | "mutation" },
  runtime: ActionRuntime,
): Promise<boolean> {
  if (step.refType === "mutation") {
    const statement = findMutation(runtime.getMutationStatements(), step.statementId);
    const args = evaluateMutationArgs(statement, runtime.evaluationContext);
    const succeeded = await runtime.queryManager.fireMutation(step.statementId, args);
    return succeeded;
  }
  runtime.queryManager.invalidate([step.statementId]);
  return true;
}

function findMutation(
  statements: MutationStatementInfo[],
  statementId: string,
): MutationStatementInfo | undefined {
  for (const statement of statements) {
    if (statement.statementId === statementId) return statement;
  }
  return undefined;
}

function evaluateMutationArgs(
  statement: MutationStatementInfo | undefined,
  evaluationContext: EvaluationContext,
): Record<string, unknown> {
  if (statement === undefined || statement.argsAST === null) return {};
  const value = evaluate(statement.argsAST, evaluationContext);
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function runSetStep(target: string, valueAST: ASTNode, runtime: ActionRuntime): void {
  // A malformed plan read from data may lack the AST; react-lang guards the same way.
  if (valueAST === undefined || valueAST === null) return;
  const value = evaluate(valueAST, runtime.evaluationContext);
  runtime.store.set(target, value);
}

function runResetStep(targets: string[], runtime: ActionRuntime): void {
  const declarations = runtime.getStateDeclarations();
  for (const target of targets) {
    const declared = declarations[target];
    runtime.store.set(target, declared ?? null, { pristine: true });
  }
}
