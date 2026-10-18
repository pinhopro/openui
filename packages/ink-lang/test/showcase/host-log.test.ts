import type { ActionEvent, OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import {
  describeAction,
  describeErrors,
  describeState,
  fitLine,
} from "../../examples/showcase/host-log";

function event(partial: Partial<ActionEvent>): ActionEvent {
  return {
    type: "continue_conversation",
    humanFriendlyMessage: "Hello",
    params: {},
    ...partial,
  } as ActionEvent;
}

describe("describeAction", () => {
  it("names the action type and its message", () => {
    expect(describeAction(event({}))).toBe('continue_conversation "Hello"');
  });

  it("appends the params when there are any", () => {
    expect(describeAction(event({ params: { id: 7 } }))).toBe(
      'continue_conversation "Hello" {"id":7}',
    );
  });
});

describe("describeState", () => {
  it("prints the state as compact JSON", () => {
    expect(describeState({ $name: "Ada", signup: { plan: "pro" } })).toBe(
      '{"$name":"Ada","signup":{"plan":"pro"}}',
    );
    expect(describeState({})).toBe("{}");
  });
});

describe("fitLine", () => {
  it("keeps short text and cuts long text with an ellipsis", () => {
    expect(fitLine("ab", 4)).toBe("ab");
    expect(fitLine("abcd", 4)).toBe("abcd");
    expect(fitLine("abcdef", 4)).toBe("abc…");
    expect(fitLine("abc", 0)).toBe("");
  });
});

describe("describeErrors", () => {
  it("joins source, code and message, and is empty without errors", () => {
    expect(describeErrors([])).toBe("");
    expect(
      describeErrors([
        { source: "query", code: "tool-error", message: "down" } as OpenUIError,
        { source: "parser", code: "parse-failed", message: "bad" } as OpenUIError,
      ]),
    ).toBe("query/tool-error: down; parser/parse-failed: bad");
  });
});
