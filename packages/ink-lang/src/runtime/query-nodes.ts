import {
  evaluate,
  type EvaluationContext,
  type MutationNode,
  type MutationStatementInfo,
  type ParseResult,
} from "@openuidev/lang-core";

// Queries are no longer built here: the query manager evaluates
// `ParseResult.queryStatements` itself (`evaluateStatements`, OpenUI 1.1), so a
// query that reads another query's result waits for it.

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
