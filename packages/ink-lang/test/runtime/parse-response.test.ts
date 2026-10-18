import { createStreamingParser, type ParseResult, type StreamParser } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { parseResponse } from "../../src/runtime/parse-response";
import { makeTestLibrary } from "../helpers/test-library";

function makeParser(): StreamParser {
  const library = makeTestLibrary();
  return createStreamingParser(library.toJSONSchema(), library.root);
}

describe("parseResponse", () => {
  it("parses a plain program", () => {
    const outcome = parseResponse(makeParser(), 'root = Stack([Title("hi")])', false);
    expect(outcome.error).toBeNull();
    expect(outcome.program).toBe('root = Stack([Title("hi")])');
    expect(outcome.result?.root?.typeName).toBe("Stack");
  });

  it("strips the message protocol markers around a stored response", () => {
    const stored = ["]]>openui:content", 'root = Stack([Title("hi")])', "]]>openui:end"].join("\n");
    const outcome = parseResponse(makeParser(), stored, false);
    expect(outcome.program).toBe('root = Stack([Title("hi")])');
    expect(outcome.result?.root?.typeName).toBe("Stack");
  });

  it("holds back a marker line cut mid-stream only while streaming", () => {
    const cut = ["]]>openui:content", 'root = Stack([Title("hi")])', "]]>ope"].join("\n");
    const streaming = parseResponse(makeParser(), cut, true);
    expect(streaming.program).toBe('root = Stack([Title("hi")])');
    const ended = parseResponse(makeParser(), cut, false);
    expect(ended.program).toBe('root = Stack([Title("hi")])\n]]>ope');
  });

  it("returns no result for an empty response", () => {
    expect(parseResponse(makeParser(), null, true)).toEqual({
      program: "",
      result: null,
      error: null,
    });
    expect(parseResponse(makeParser(), "", true)).toEqual({
      program: "",
      result: null,
      error: null,
    });
  });

  it("marks the parse complete only when streaming has ended", () => {
    const parser = makeParser();
    const streaming = parseResponse(parser, "root = Stack([Title(", true);
    expect(streaming.result?.meta.incomplete).toBe(true);
    const ended = parseResponse(parser, 'root = Stack([Title("hi")])', false);
    expect(ended.result?.meta.incomplete).toBe(false);
  });

  it("turns a parser crash into a parse-exception error", () => {
    const crashing: StreamParser = {
      push: function push(): ParseResult {
        throw new Error("nope");
      },
      set: function set(): ParseResult {
        throw new Error("nope");
      },
      getResult: function getResult(): ParseResult {
        throw new Error("nope");
      },
    };
    const outcome = parseResponse(crashing, "root = Stack([])", false);
    expect(outcome.result).toBeNull();
    expect(outcome.error?.code).toBe("parse-exception");
    expect(outcome.error?.message).toContain("nope");
  });
});
