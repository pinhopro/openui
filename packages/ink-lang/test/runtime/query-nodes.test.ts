import { createQueryManager, createStore, createStreamingParser } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import {
  buildRuntimeFunctions,
  createEvaluationContext,
} from "../../src/runtime/evaluation-context";
import { buildMutationNodes } from "../../src/runtime/query-nodes";
import { makeTestLibrary } from "../helpers/test-library";

// Queries are evaluated by the query manager itself since OpenUI 1.1
// (`evaluateStatements`); see test/query-chain.test.tsx. Only mutations are built here.
const program = [
  '$status = "open"',
  "root = Stack([filter, count])",
  'filter = Input("status", "Status", $status)',
  'count = Metric("Tickets", 1)',
  'tickets = Query("listTickets", {status: $status}, {rows: []}, 30)',
  'save = Mutation("saveTicket", {id: 1})',
].join("\n");

function parse() {
  const library = makeTestLibrary();
  const schema = library.toJSONSchema();
  const result = createStreamingParser(schema, library.root).set(program, true);
  const store = createStore();
  store.initialize(result.stateDeclarations, {});
  const functions = buildRuntimeFunctions(schema, library);
  const context = createEvaluationContext(store, createQueryManager(null), functions, undefined);
  return { result, store, context };
}

describe("buildMutationNodes", () => {
  it("evaluates the tool name of every mutation statement", () => {
    const { result, context } = parse();
    expect(buildMutationNodes(result, context)).toEqual([
      { statementId: "save", toolName: "saveTicket" },
    ]);
  });

  it("returns no nodes for a missing result", () => {
    const { context } = parse();
    expect(buildMutationNodes(null, context)).toEqual([]);
  });
});
