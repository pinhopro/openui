/** One leaf of the token tree: its path (`color.semantic.text.value`) and value. */
export interface TokenLeaf {
  path: string[];
  value: string | number | boolean;
}

/** The segments the CSS variable names leave out, since the group names say enough. */
const SILENT_SEGMENTS = ["primitive", "semantic"];

function isLeaf(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

/** Every leaf of a token tree, depth first, in declaration order. */
export function walkLeaves(tree: unknown, prefix: string[] = []): TokenLeaf[] {
  const leaves: TokenLeaf[] = [];
  if (tree === null || typeof tree !== "object") return leaves;
  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    const path = prefix.concat(key);
    if (isLeaf(value)) {
      leaves.push({ path, value });
      continue;
    }
    for (const leaf of walkLeaves(value, path)) leaves.push(leaf);
  }
  return leaves;
}

function kebab(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** `--color-text-value` for `["color", "semantic", "text", "value"]`. */
export function cssVariableName(path: string[]): string {
  const parts: string[] = [];
  for (const segment of path) {
    if (SILENT_SEGMENTS.includes(segment)) continue;
    parts.push(kebab(segment));
  }
  return "--" + parts.join("-");
}

/** `color.semantic.text.value` for the same path. */
export function dottedName(path: string[]): string {
  return path.join(".");
}
