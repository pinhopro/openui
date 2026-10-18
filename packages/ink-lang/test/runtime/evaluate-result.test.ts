import { createQueryManager, createStore, createStreamingParser } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { evaluateResult } from "../../src/runtime/evaluate-result";
import {
  buildRuntimeFunctions,
  createEvaluationContext,
} from "../../src/runtime/evaluation-context";
import { makeTestLibrary } from "../helpers/test-library";

function evaluate(program: string) {
  const library = makeTestLibrary();
  const schema = library.toJSONSchema();
  const result = createStreamingParser(schema, library.root).set(program, true);
  const store = createStore();
  store.initialize(result.stateDeclarations, {});
  const functions = buildRuntimeFunctions(schema, library);
  const context = createEvaluationContext(store, createQueryManager(null), functions, undefined);
  return evaluateResult(result, context, library, store);
}

describe("evaluateResult", () => {
  it("resolves expressions in props against the store", () => {
    const evaluated = evaluate('$count = 2\nroot = Stack([t])\nt = Title("Count: " + $count)');
    const children = evaluated.root?.props["children"] as Array<{ props: { text: string } }>;
    expect(children[0]?.props.text).toBe("Count: 2");
    expect(evaluated.errors).toEqual([]);
  });

  it("returns a null root and no errors for a missing result", () => {
    const library = makeTestLibrary();
    const context = createEvaluationContext(createStore(), createQueryManager(null), {}, undefined);
    expect(evaluateResult(null, context, library, createStore())).toEqual({
      root: null,
      errors: [],
    });
  });

  it("collects a runtime error when a library function throws", () => {
    const evaluated = evaluate('root = Stack([t])\nt = Title(@Boom("x"))');
    const codes = evaluated.errors.map(function codeOf(error) {
      return error.code;
    });
    expect(codes).toContain("runtime-error");
  });
});
