import type { ElementNode } from "@openuidev/lang-core";

/** True for a parsed component node. lang-core keeps its own guard internal. */
export function isElementValue(value: unknown): value is ElementNode {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record["type"] !== "element") return false;
  if (typeof record["typeName"] !== "string") return false;
  if (typeof record["props"] !== "object" || record["props"] === null) return false;
  return typeof record["partial"] === "boolean";
}
