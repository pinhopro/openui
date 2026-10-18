import { describe, expect, it } from "vitest";
import { withItemContext } from "../src/components/card-item-action";

describe("withItemContext", () => {
  it("turns a missing action into a continue-conversation carrying the context", () => {
    expect(withItemContext(undefined, { itemIndex: 1, itemId: undefined })).toEqual({
      type: "continue_conversation",
      params: { itemIndex: 1 },
    });
  });

  it("appends the context to the ToAssistant steps of an action plan", () => {
    const plan = {
      steps: [
        { type: "continue_conversation", message: "Pick", context: "cards" },
        { type: "set", target: "$x", valueAST: null },
      ],
    };
    const result = withItemContext(plan, { itemIndex: 0 }) as {
      steps: Array<Record<string, unknown>>;
    };
    expect(result.steps[0]?.["context"]).toBe('cards\nSelected item: {"itemIndex":0}');
    expect(result.steps[1]).toEqual(plan.steps[1]);
  });

  it("returns the plan untouched when the context is empty", () => {
    const plan = { steps: [{ type: "continue_conversation", message: "Pick" }] };
    expect(withItemContext(plan, { itemId: undefined })).toBe(plan);
  });

  it("merges the context into a legacy action's params", () => {
    expect(withItemContext({ type: "open_url", url: "https://a.test" }, { itemIndex: 2 })).toEqual({
      type: "open_url",
      params: { url: "https://a.test", itemIndex: 2 },
    });
  });
});
