import { createQueryManager, createStore } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import {
  buildRuntimeFunctions,
  createEvaluationContext,
} from "../../src/runtime/evaluation-context";
import { makeTestLibrary } from "../helpers/test-library";

describe("buildRuntimeFunctions", () => {
  it("merges each schema entry with the implementation from the library", () => {
    const library = makeTestLibrary();
    const functions = buildRuntimeFunctions(library.toJSONSchema(), library);
    const upper = functions["Upper"];
    expect(upper).toBeDefined();
    expect(typeof upper?.fn).toBe("function");
    expect(Object.keys(upper?.params.properties ?? {})).toEqual(["text"]);
  });

  it("returns an empty record for a library without functions", () => {
    const library = makeTestLibrary();
    const schema = { ...library.toJSONSchema(), functions: undefined };
    expect(buildRuntimeFunctions(schema, library)).toEqual({});
  });
});

describe("createEvaluationContext", () => {
  it("reads state from the store and unwraps field wrappers", () => {
    const store = createStore();
    store.set("$count", 3);
    store.set("search", { value: "late", componentType: "Input" });
    const context = createEvaluationContext(store, createQueryManager(null), {}, undefined);
    expect(context.getState("$count")).toBe(3);
    expect(context.getState("search")).toBe("late");
  });

  it("resolves a mutation result before a query result", () => {
    const queryManager = createQueryManager(null);
    queryManager.registerMutations([{ statementId: "save", toolName: "saveTicket" }]);
    const context = createEvaluationContext(createStore(), queryManager, {}, undefined);
    expect(context.resolveRef("save")).toEqual({ status: "idle" });
    expect(context.resolveRef("unknown")).toBeNull();
  });

  it("passes the functions and actions through", () => {
    const library = makeTestLibrary();
    const schema = library.toJSONSchema();
    const functions = buildRuntimeFunctions(schema, library);
    const context = createEvaluationContext(
      createStore(),
      createQueryManager(null),
      functions,
      schema.actions,
    );
    expect(context.functions).toBe(functions);
    expect(Object.keys(context.actions ?? {})).toEqual(["CopyToClipboard"]);
  });
});
