import {
  parseMessage,
  type OpenUIError,
  type ParseResult,
  type StreamParser,
} from "@openuidev/lang-core";

export interface ParseOutcome {
  /** The program text after the message protocol markers are removed. */
  program: string;
  /** The parse result, or null when there is no program or the parser crashed. */
  result: ParseResult | null;
  /** A parse-exception error when the parser crashed. */
  error: OpenUIError | null;
}

/** Feeds the accumulated response to the streaming parser without ever throwing. */
export function parseResponse(
  parser: StreamParser,
  response: string | null,
  isStreaming: boolean,
): ParseOutcome {
  if (response === null || response === "") return { program: "", result: null, error: null };
  const message = parseMessage(response, { streaming: isStreaming });
  const program = message.content;
  if (program === "") return { program, result: null, error: null };
  try {
    const result = parser.set(program, !isStreaming);
    return { program, result, error: null };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      program,
      result: null,
      error: {
        source: "parser",
        code: "parse-exception",
        message: `Parser crashed: ${detail}`,
        hint: "The response may contain syntax the parser cannot handle",
      },
    };
  }
}
