import type {
  EvaluationContext,
  LibraryJSONSchema,
  QueryManager,
  Store,
} from "@openuidev/lang-core";
import type { Library } from "../library";
import { unwrapFieldValue } from "./field-state";

/** Library functions as the evaluator wants them: the JSON Schema entry plus the implementation. */
export type RuntimeFunctions = NonNullable<EvaluationContext["functions"]>;

/** Custom actions as the evaluator wants them: the JSON Schema entries. */
export type RuntimeActions = NonNullable<EvaluationContext["actions"]>;

/** Merges each function of the schema with its `fn` from the library. */
export function buildRuntimeFunctions(
  schema: LibraryJSONSchema,
  library: Library,
): RuntimeFunctions {
  const functions: RuntimeFunctions = {};
  const entries = Object.entries(schema.functions ?? {});
  for (const [name, functionSchema] of entries) {
    const definition = library.functions?.[name];
    if (definition === undefined) continue;
    functions[name] = { ...functionSchema, fn: definition.fn };
  }
  return functions;
}

/** The context the evaluator reads `$variables` and query results through. */
export function createEvaluationContext(
  store: Store,
  queryManager: QueryManager,
  functions: RuntimeFunctions,
  actions: RuntimeActions | undefined,
): EvaluationContext {
  function getState(name: string): unknown {
    return unwrapFieldValue(store.get(name));
  }

  function resolveRef(name: string): unknown {
    const mutationResult = queryManager.getMutationResult(name);
    if (mutationResult !== null) return mutationResult;
    return queryManager.getResult(name);
  }

  return { getState, resolveRef, functions, actions };
}
