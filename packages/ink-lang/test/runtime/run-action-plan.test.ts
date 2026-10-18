import type { ActionEvent, ActionPlan, ToolProvider } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { getFormPayload } from "../../src/runtime/field-state";
import { runActionPlan, type ActionRuntime } from "../../src/runtime/run-action-plan";
import { triggerAction } from "../../src/runtime/trigger-action";
import {
  findByStatementId,
  makeRuntimeFixture,
  type RuntimeFixture,
} from "../helpers/runtime-fixture";
import { makeTestLibrary } from "../helpers/test-library";

interface Harness {
  fixture: RuntimeFixture;
  runtime: ActionRuntime;
  events: ActionEvent[];
  planOf: (statementId: string) => ActionPlan;
}

function makeHarness(program: string, toolProvider: ToolProvider | null = null): Harness {
  const fixture = makeRuntimeFixture(makeTestLibrary(), program, toolProvider);
  const events: ActionEvent[] = [];
  const runtime: ActionRuntime = {
    store: fixture.store,
    queryManager: fixture.queryManager,
    evaluationContext: fixture.evaluationContext,
    customActionNames: ["CopyToClipboard"],
    getMutationStatements: function getMutationStatements() {
      return fixture.result.mutationStatements;
    },
    getStateDeclarations: function getStateDeclarations() {
      return fixture.result.stateDeclarations;
    },
    getFormPayload: function payload(formName: string | undefined) {
      return getFormPayload(fixture.store, formName);
    },
    emit: function emit(event: ActionEvent) {
      events.push(event);
    },
  };
  function planOf(statementId: string): ActionPlan {
    const node = findByStatementId(fixture.root, statementId);
    return node?.props["action"] as ActionPlan;
  }
  return { fixture, runtime, events, planOf };
}

describe("runActionPlan", () => {
  it("emits continue_conversation for @ToAssistant with the message and context", async () => {
    const harness = makeHarness(
      'root = Stack([b])\nb = Button("Go", @ToAssistant("Explain", {ticket: "T-42"}))',
    );
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(harness.events).toEqual([
      {
        type: "continue_conversation",
        params: { context: { ticket: "T-42" } },
        humanFriendlyMessage: "Explain",
        formState: {},
        formName: undefined,
      },
    ]);
  });

  it("emits open_url for @OpenUrl", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Go", @OpenUrl("https://x.test"))');
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(harness.events).toEqual([
      {
        type: "open_url",
        params: { url: "https://x.test" },
        humanFriendlyMessage: "",
        formState: {},
        formName: undefined,
      },
    ]);
  });

  it("runs @Set before a later step so the event sees the new state", async () => {
    const harness = makeHarness(
      '$note = "old"\nroot = Stack([b])\nb = Button("Send", Action([@Set($note, "new"), @ToAssistant("Send")]))',
    );
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(harness.fixture.store.get("$note")).toBe("new");
    expect(harness.events[0]?.formState).toEqual({ $note: "new" });
  });

  it("restores the declared default for @Reset", async () => {
    const harness = makeHarness('$m = 7\nroot = Stack([b])\nb = Button("Reset", @Reset($m))');
    harness.fixture.store.set("$m", 9);
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(harness.fixture.store.get("$m")).toBe(7);
  });

  it("fires a mutation for @Run and continues on success", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const tools: ToolProvider = {
      callTool: async function callTool(name: string, args: Record<string, unknown>) {
        calls.push({ name, args });
        return { id: 7 };
      },
    };
    const harness = makeHarness(
      '$title = "Bug"\nroot = Stack([b])\nnewTicket = Mutation("createTicket", {title: $title})\nb = Button("Create", Action([@Run(newTicket), @ToAssistant("Created")]))',
      tools,
    );
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(calls).toEqual([{ name: "createTicket", args: { title: "Bug" } }]);
    expect(harness.events.map(typeOf)).toEqual(["continue_conversation"]);
  });

  it("halts the plan when a mutation fails", async () => {
    const tools: ToolProvider = {
      callTool: async function callTool() {
        throw new Error("down");
      },
    };
    const harness = makeHarness(
      'root = Stack([b])\nnewTicket = Mutation("createTicket", {})\nb = Button("Create", Action([@Run(newTicket), @ToAssistant("Created")]))',
      tools,
    );
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(harness.events).toEqual([]);
  });

  it("emits a custom action with its params", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Copy", @CopyToClipboard("hello"))');
    await runActionPlan(harness.planOf("b"), undefined, harness.runtime);
    expect(harness.events).toEqual([
      {
        type: "CopyToClipboard",
        params: { text: "hello" },
        humanFriendlyMessage: "",
        formState: {},
        formName: undefined,
      },
    ]);
  });
});

describe("triggerAction", () => {
  it("falls back to continue_conversation with the label when there is no action", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Plain")');
    await triggerAction("Plain", "signup", undefined, harness.runtime);
    expect(harness.events).toEqual([
      {
        type: "continue_conversation",
        params: {},
        humanFriendlyMessage: "Plain",
        formState: {},
        formName: "signup",
      },
    ]);
  });

  it("treats a null action like no action", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Plain")');
    await triggerAction("Plain", undefined, null, harness.runtime);
    expect(harness.events.map(typeOf)).toEqual(["continue_conversation"]);
  });

  it("runs an action plan", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Go", @ToAssistant("Explain"))');
    await triggerAction("Go", undefined, harness.planOf("b"), harness.runtime);
    expect(harness.events.map(typeOf)).toEqual(["continue_conversation"]);
    expect(harness.events[0]?.humanFriendlyMessage).toBe("Explain");
  });

  it("delivers a legacy action object with its url and context lifted into params", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Plain")');
    await triggerAction(
      "Open",
      undefined,
      { type: "open_url", url: "https://x.test" },
      harness.runtime,
    );
    expect(harness.events).toEqual([
      {
        type: "open_url",
        params: { url: "https://x.test" },
        humanFriendlyMessage: "Open",
        formState: {},
        formName: undefined,
      },
    ]);
  });

  it("refuses a legacy object that names a custom action", async () => {
    const harness = makeHarness('root = Stack([b])\nb = Button("Plain")');
    await triggerAction(
      "Copy",
      undefined,
      { type: "CopyToClipboard", params: { text: "x" } },
      harness.runtime,
    );
    expect(harness.events).toEqual([]);
  });
});

function typeOf(event: ActionEvent): string {
  return event.type;
}
