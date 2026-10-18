import type { OpenUIError, ParseResult, ValidationError } from "@openuidev/lang-core";
import type { Library } from "../library";

export interface ErrorSources {
  /** The program text that was parsed. */
  program: string;
  result: ParseResult | null;
  parseError: OpenUIError | null;
  runtimeErrors: OpenUIError[];
  renderErrors: OpenUIError[];
  queryErrors: OpenUIError[];
  library: Library;
}

/** The structured error list a host receives through onError once streaming has ended. */
export function collectErrors(sources: ErrorSources): OpenUIError[] {
  const errors: OpenUIError[] = [];
  if (sources.parseError !== null) errors.push(sources.parseError);

  const statementCount = sources.result?.meta.statementCount ?? 0;
  if (sources.program !== "" && statementCount === 0 && sources.parseError === null) {
    const rootName = sources.library.root ?? "Root";
    errors.push({
      source: "parser",
      code: "parse-failed",
      message: "Response could not be parsed as valid openui-lang",
      hint: `The entire response must be valid openui-lang code starting with root = ${rootName}(...)`,
    });
  }

  if (sources.result !== null) {
    for (const validationError of sources.result.meta.errors) {
      errors.push(toOpenUIError(validationError));
    }
  }

  for (const error of sources.runtimeErrors) errors.push(error);
  for (const error of sources.renderErrors) errors.push(error);
  for (const error of sources.queryErrors) errors.push(error);
  return errors;
}

function toOpenUIError(validationError: ValidationError): OpenUIError {
  const error: OpenUIError = {
    source: "parser",
    code: validationError.code,
    message: validationError.message,
    component: validationError.component,
    statementId: validationError.statementId,
  };
  if (validationError.path !== "") error.path = validationError.path;
  if (validationError.severity !== undefined) error.severity = validationError.severity;
  return error;
}

/** A stable key to tell whether the error list changed since the last onError call. */
export function errorsKey(errors: OpenUIError[]): string {
  return JSON.stringify(errors);
}
