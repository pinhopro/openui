import { createStreamingParser, type OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { collectErrors, errorsKey, type ErrorSources } from "../../src/runtime/collect-errors";
import { makeTestLibrary } from "../helpers/test-library";

function sourcesFor(program: string, overrides: Partial<ErrorSources> = {}): ErrorSources {
  const library = makeTestLibrary();
  const result = createStreamingParser(library.toJSONSchema(), library.root).set(program, true);
  return {
    program,
    result,
    parseError: null,
    runtimeErrors: [],
    renderErrors: [],
    queryErrors: [],
    library,
    ...overrides,
  };
}

const runtimeError: OpenUIError = { source: "runtime", code: "runtime-error", message: "bad prop" };
const renderError: OpenUIError = { source: "runtime", code: "render-error", message: "threw" };
const queryError: OpenUIError = { source: "query", code: "tool-error", message: "down" };

describe("collectErrors", () => {
  it("returns nothing for a valid program", () => {
    expect(collectErrors(sourcesFor('root = Stack([Title("x")])'))).toEqual([]);
  });

  it("puts a parse exception first", () => {
    const parseError: OpenUIError = { source: "parser", code: "parse-exception", message: "crash" };
    const errors = collectErrors(sourcesFor('root = Stack([Title("x")])', { parseError }));
    expect(errors[0]).toBe(parseError);
  });

  it("reports parse-failed when a non-empty response produced no statements", () => {
    const errors = collectErrors(sourcesFor("just prose, no program"));
    expect(errors).toHaveLength(1);
    expect(errors[0]?.code).toBe("parse-failed");
    expect(errors[0]?.hint).toContain("root = Stack(");
  });

  it("maps parser validation errors to parser-sourced errors", () => {
    const errors = collectErrors(sourcesFor('root = Stack([Ghost("x")])'));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      source: "parser",
      code: "unknown-component",
      component: "Ghost",
      statementId: "root",
    });
  });

  it("appends runtime, render and query errors in that order", () => {
    const errors = collectErrors(
      sourcesFor('root = Stack([Title("x")])', {
        runtimeErrors: [runtimeError],
        renderErrors: [renderError],
        queryErrors: [queryError],
      }),
    );
    expect(errors).toEqual([runtimeError, renderError, queryError]);
  });
});

describe("errorsKey", () => {
  it("is equal for equal error lists and different otherwise", () => {
    expect(errorsKey([runtimeError])).toBe(errorsKey([{ ...runtimeError }]));
    expect(errorsKey([runtimeError])).not.toBe(errorsKey([renderError]));
    expect(errorsKey([])).toBe(errorsKey([]));
  });
});
