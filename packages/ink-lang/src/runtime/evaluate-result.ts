import {
  evaluateRoot,
  type ElementNode,
  type EvalContext,
  type EvaluationContext,
  type OpenUIError,
  type ParseResult,
  type Store,
} from "@openuidev/lang-core";
import type { Library } from "../library";

export interface EvaluatedResult {
  /** The root with every prop resolved to a concrete value, or null when there is none. */
  root: ElementNode | null;
  /** Runtime errors raised while evaluating props. */
  errors: OpenUIError[];
}

/** Resolves the AST values in the parsed tree against the store and query results. */
export function evaluateResult(
  result: ParseResult | null,
  evaluationContext: EvaluationContext,
  library: Library,
  store: Store,
): EvaluatedResult {
  if (result === null) return { root: null, errors: [] };
  const errors: OpenUIError[] = [];
  const evalContext: EvalContext = { ctx: evaluationContext, library, store, errors };
  try {
    const root = evaluateRoot(result, evalContext);
    return { root, errors };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    errors.push({
      source: "runtime",
      code: "runtime-error",
      message: `Prop evaluation failed: ${detail}`,
    });
    return { root: null, errors };
  }
}
