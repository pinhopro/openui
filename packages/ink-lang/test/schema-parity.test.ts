import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";

/** The React default library as `openui generate` wrote it: signatures plus JSON Schema. */
interface LibrarySpecFile {
  root: string;
  components: Record<string, { signature: string; description: string }>;
  schema: { $defs: Record<string, Record<string, unknown>> };
}

const SPEC_PATH = path.resolve(
  process.env["OPENUI_LIBRARY_SPEC"] ??
    path.join(__dirname, "../../../docs/generated/playground-library.spec.json"),
);

const SHARED = [
  "Stack",
  "Card",
  "CardHeader",
  "TextContent",
  "Button",
  "Buttons",
  "Input",
  "Form",
  "FormControl",
  "Label",
  "Table",
  "Col",
];

/** The props whose union of child components is a deliberate subset in the terminal library. */
const UNION_PROPS: Record<string, string[]> = {
  Card: ["children"],
  FormControl: ["input"],
};

function loadSpec(): LibrarySpecFile {
  const raw = readFileSync(SPEC_PATH, "utf8");
  return JSON.parse(raw) as LibrarySpecFile;
}

/** Replaces the member list of a union prop so both sides compare equal around it. */
function withNeutralUnions(name: string, definition: Record<string, unknown>): unknown {
  const clone = JSON.parse(JSON.stringify(definition)) as Record<string, unknown>;
  const unionProps = UNION_PROPS[name] ?? [];
  const properties = clone["properties"] as Record<string, Record<string, unknown>> | undefined;
  if (properties === undefined) return clone;
  for (const propName of unionProps) {
    const prop = properties[propName];
    if (prop === undefined) continue;
    if (prop["anyOf"] !== undefined) prop["anyOf"] = "<union>";
    const items = prop["items"] as Record<string, unknown> | undefined;
    if (items !== undefined && items["anyOf"] !== undefined) items["anyOf"] = "<union>";
  }
  return clone;
}

/** Replaces the union member list inside a prompt signature: `(A | B)[]` and `input: A | B,`. */
function withNeutralSignatureUnions(name: string, signature: string): string {
  if (name === "Card") return signature.replace(/children: \([^)]*\)\[\]/, "children: (<union>)[]");
  if (name === "FormControl") return signature.replace(/input: [^,]*,/, "input: <union>,");
  return signature;
}

describe("schema parity with the React default library", () => {
  const spec = loadSpec();
  const inkSchema = inkLibrary.toJSONSchema();
  const inkSpec = inkLibrary.toSpec();

  it("uses the same root", () => {
    expect(inkLibrary.root).toBe(spec.root);
  });

  for (const name of SHARED) {
    it(`${name} has the same JSON Schema (names, order, enums, required, defaults)`, () => {
      const expected = spec.schema.$defs[name];
      const actual = inkSchema.$defs?.[name] as Record<string, unknown> | undefined;
      expect(expected).toBeDefined();
      expect(actual).toBeDefined();
      expect(withNeutralUnions(name, actual ?? {})).toEqual(
        withNeutralUnions(name, expected ?? {}),
      );
    });

    it(`${name} has the same prompt signature and description`, () => {
      const expected = spec.components[name];
      const actual = inkSpec.components[name];
      expect(actual).toBeDefined();
      expect(withNeutralSignatureUnions(name, actual?.signature ?? "")).toBe(
        withNeutralSignatureUnions(name, expected?.signature ?? ""),
      );
      expect(actual?.description).toBe(expected?.description);
    });
  }

  it("shares the ActionExpression definition used by Button.action", () => {
    expect(inkSchema.$defs?.["ActionExpression"]).toEqual(spec.schema.$defs["ActionExpression"]);
  });
});
