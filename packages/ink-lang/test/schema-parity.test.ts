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
  "Tabs",
  "TabItem",
  "Select",
  "SelectItem",
  "Series",
  "Slice",
  "Point",
  "ScatterSeries",
  "BarChart",
  "LineChart",
  "AreaChart",
  "PieChart",
  "RadialChart",
  "SingleStackedBarChart",
  "HorizontalBarChart",
  "RadarChart",
  "ScatterChart",
  "MarkDownRenderer",
  "Callout",
  "TextCallout",
  "Image",
  "ImageBlock",
  "ImageGallery",
  "CodeBlock",
  "InlineHeader",
  "EditableTable",
  "Accordion",
  "AccordionItem",
  "Steps",
  "StepsItem",
  "Carousel",
  "Separator",
  "TagBlock",
  "Tag",
  "Icon",
  "EntityList",
  "ListBlock",
  "ListItem",
];

/** The props whose union of child components is a deliberate subset in the terminal library. */
const UNION_PROPS: Record<string, string[]> = {
  Card: ["children"],
  FormControl: ["input"],
  TabItem: ["content"],
  AccordionItem: ["content"],
  Carousel: ["children"],
};

function loadSpec(): LibrarySpecFile {
  const raw = readFileSync(SPEC_PATH, "utf8");
  return JSON.parse(raw) as LibrarySpecFile;
}

/** Replaces an `anyOf` list on the schema node or on its (nested) array items. */
function neutralizeUnion(node: Record<string, unknown>): void {
  if (node["anyOf"] !== undefined) node["anyOf"] = "<union>";
  const items = node["items"] as Record<string, unknown> | undefined;
  if (items !== undefined) neutralizeUnion(items);
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
    neutralizeUnion(prop);
  }
  return clone;
}

/** Replaces the union member list inside a prompt signature: `prop: (A | B)[]` and `input: A | B,`. */
function withNeutralSignatureUnions(name: string, signature: string): string {
  let result = signature;
  for (const propName of UNION_PROPS[name] ?? []) {
    if (name === "FormControl") {
      result = result.replace(/input: [^,]*,/, "input: <union>,");
      continue;
    }
    const pattern = new RegExp(`${propName}: \\([^)]*\\)(\\[\\])+`);
    result = result.replace(pattern, `${propName}: (<union>)`);
  }
  return result;
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
