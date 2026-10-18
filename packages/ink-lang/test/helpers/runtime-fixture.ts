import {
  createQueryManager,
  createStore,
  createStreamingParser,
  type ElementNode,
  type EvaluationContext,
  type ParseResult,
  type QueryManager,
  type Store,
  type ToolProvider,
} from "@openuidev/lang-core";
import type { Library } from "../../src/library";
import { evaluateResult } from "../../src/runtime/evaluate-result";
import {
  buildRuntimeFunctions,
  createEvaluationContext,
} from "../../src/runtime/evaluation-context";
import { buildMutationNodes, buildQueryNodes } from "../../src/runtime/query-nodes";

export interface RuntimeFixture {
  library: Library;
  result: ParseResult;
  store: Store;
  queryManager: QueryManager;
  evaluationContext: EvaluationContext;
  root: ElementNode | null;
}

/** Parses a complete program and wires the store, query manager and evaluation context. */
export function makeRuntimeFixture(
  library: Library,
  program: string,
  toolProvider: ToolProvider | null = null,
): RuntimeFixture {
  const schema = library.toJSONSchema();
  const parser = createStreamingParser(schema, library.root);
  const result = parser.set(program, true);
  const store = createStore();
  store.initialize(result.stateDeclarations, {});
  const queryManager = createQueryManager(toolProvider);
  queryManager.activate();
  const functions = buildRuntimeFunctions(schema, library);
  const evaluationContext = createEvaluationContext(store, queryManager, functions, schema.actions);
  queryManager.registerMutations(buildMutationNodes(result, evaluationContext));
  queryManager.evaluateQueries(buildQueryNodes(result, evaluationContext, store.getSnapshot()));
  const evaluated = evaluateResult(result, evaluationContext, library, store);
  return { library, result, store, queryManager, evaluationContext, root: evaluated.root };
}

/** Finds the element with the given statement id anywhere in the evaluated tree. */
export function findByStatementId(
  root: ElementNode | null,
  statementId: string,
): ElementNode | null {
  if (root === null) return null;
  if (root.statementId === statementId) return root;
  const values = Object.values(root.props);
  for (const value of values) {
    const found = findInValue(value, statementId);
    if (found !== null) return found;
  }
  return null;
}

function findInValue(value: unknown, statementId: string): ElementNode | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findInValue(item, statementId);
      if (found !== null) return found;
    }
    return null;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (record["type"] === "element") {
      return findByStatementId(value as ElementNode, statementId);
    }
  }
  return null;
}
