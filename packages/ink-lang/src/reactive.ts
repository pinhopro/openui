import { markReactive } from "@openuidev/lang-core";
import type { ZodType } from "zod/v4";

/**
 * Marks a prop schema as reactive so a `$binding` written by the model arrives
 * as a two-way state field instead of a plain value. The mark is identity-based:
 * keep the returned schema object, never clone it.
 */
export function reactive<T extends ZodType>(schema: T): T {
  markReactive(schema);
  return schema;
}
