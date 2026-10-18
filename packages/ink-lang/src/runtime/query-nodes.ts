import {
  evaluate,
  type EvaluationContext,
  type MutationNode,
  type MutationStatementInfo,
  type ParseResult,
  type QueryNode,
  type QueryStatementInfo,
} from "@openuidev/lang-core";

/** Evaluates every Query() statement into the node shape the query manager consumes. */
export function buildQueryNodes(
  result: ParseResult | null,
  evaluationContext: EvaluationContext,
  storeSnapshot: Record<string, unknown>,
): QueryNode[] {
  if (result === null) return [];
  const nodes: QueryNode[] = [];
  for (const statement of result.queryStatements) {
    nodes.push(buildQueryNode(statement, evaluationContext, storeSnapshot));
  }
  return nodes;
}

function buildQueryNode(
  statement: QueryStatementInfo,
  evaluationContext: EvaluationContext,
  storeSnapshot: Record<string, unknown>,
): QueryNode {
  const toolName = statement.toolAST
    ? (evaluate(statement.toolAST, evaluationContext) as string)
    : "";
  const args = statement.argsAST ? evaluate(statement.argsAST, evaluationContext) : null;
  const defaults = statement.defaultsAST
    ? evaluate(statement.defaultsAST, evaluationContext)
    : null;
  const refreshInterval = statement.refreshAST
    ? (evaluate(statement.refreshAST, evaluationContext) as number)
    : undefined;
  const deps = collectDeps(statement.deps, storeSnapshot);
  return {
    statementId: statement.statementId,
    toolName,
    args,
    defaults,
    refreshInterval,
    deps,
    complete: statement.complete,
  };
}

/** The current value of each `$variable` the query depends on; part of the cache key. */
function collectDeps(
  depNames: string[] | undefined,
  storeSnapshot: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (depNames === undefined || depNames.length === 0) return undefined;
  const deps: Record<string, unknown> = {};
  for (const name of depNames) {
    deps[name] = storeSnapshot[name];
  }
  return deps;
}

/** Evaluates every Mutation() statement into the node shape the query manager consumes. */
export function buildMutationNodes(
  result: ParseResult | null,
  evaluationContext: EvaluationContext,
): MutationNode[] {
  if (result === null) return [];
  const nodes: MutationNode[] = [];
  for (const statement of result.mutationStatements) {
    nodes.push(buildMutationNode(statement, evaluationContext));
  }
  return nodes;
}

function buildMutationNode(
  statement: MutationStatementInfo,
  evaluationContext: EvaluationContext,
): MutationNode {
  const toolName = statement.toolAST
    ? (evaluate(statement.toolAST, evaluationContext) as string)
    : "";
  return { statementId: statement.statementId, toolName };
}
