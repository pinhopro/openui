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
  "TextArea",
  "DatePicker",
  "Slider",
  "CheckBoxGroup",
  "CheckBoxItem",
  "RadioGroup",
  "RadioItem",
  "SwitchGroup",
  "SwitchItem",
  "Chips",
  "ChipItem",
  "OptionCards",
  "OptionCard",
  "IconButton",
  "Modal",
  "Text",
  "BoldText",
  "IconText",
  "ImageText",
  "ImageTextLarge",
  "MetricIndicatorInline",
  "MetricIndicatorWithStrikethrough",
  "SnippetCardItem",
  "SnippetCardBlock",
  "OverviewCardItem",
  "OverviewCardBlock",
  "ContextCardItem",
  "ContextCardBlock",
  "CompositeCardItem",
  "CompositeCardBlock",
  "VisualCardItem",
  "VisualCardBlock",
];

function loadSpec(): LibrarySpecFile {
  const raw = readFileSync(SPEC_PATH, "utf8");
  return JSON.parse(raw) as LibrarySpecFile;
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
      expect(actual).toEqual(expected);
    });

    it(`${name} has the same prompt signature and description`, () => {
      const expected = spec.components[name];
      const actual = inkSpec.components[name];
      expect(actual).toBeDefined();
      expect(actual?.signature).toBe(expected?.signature);
      expect(actual?.description).toBe(expected?.description);
    });
  }

  it("shares the ActionExpression definition used by Button.action", () => {
    expect(inkSchema.$defs?.["ActionExpression"]).toEqual(spec.schema.$defs["ActionExpression"]);
  });
});
