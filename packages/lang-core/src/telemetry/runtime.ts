/**
 * Telemetry is disabled in this fork. The parser and prompt generator still
 * call these hooks, so they keep their signatures and do nothing.
 */
import type { PromptSpec } from "../parser/prompt";
import type { ParseResult } from "../parser/types";

export interface ParserParseCaptureContext {
  disabled: true;
}

export function recordSystemPromptGeneration(
  _spec: PromptSpec,
  _inputShape: "library_spec" | "legacy_prompt_spec",
): void {
  // Telemetry removed.
}

export function prepareParserParseTelemetry(): ParserParseCaptureContext | undefined {
  return undefined;
}

export function captureParserParseResult(
  _context: ParserParseCaptureContext | undefined,
  _result: ParseResult,
): void {
  // Telemetry removed.
}

export function captureParserParseException(_context: ParserParseCaptureContext | undefined): void {
  // Telemetry removed.
}
