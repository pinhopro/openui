import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, DIM_ON, stripAnsi, UNDERLINE_ON } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

function lines(frame: string): string[] {
  const plain = stripAnsi(frame);
  const result: string[] = [];
  for (const line of plain.split("\n")) {
    result.push(line.trimEnd());
  }
  return result;
}

describe("default library", () => {
  it("uses Stack as the root like the React default library", () => {
    expect(inkLibrary.root).toBe("Stack");
    expect(Object.keys(inkLibrary.components).sort()).toEqual([
      "Accordion",
      "AccordionItem",
      "AreaChart",
      "BarChart",
      "BoldText",
      "Button",
      "Buttons",
      "Callout",
      "Card",
      "CardHeader",
      "Carousel",
      "CheckBoxGroup",
      "CheckBoxItem",
      "ChipItem",
      "Chips",
      "CodeBlock",
      "Col",
      "Combobox",
      "CompositeCardBlock",
      "CompositeCardItem",
      "ContextCardBlock",
      "ContextCardItem",
      "DatePicker",
      "EditableTable",
      "EntityList",
      "Form",
      "FormControl",
      "HorizontalBarChart",
      "Icon",
      "IconButton",
      "IconText",
      "Image",
      "ImageBlock",
      "ImageGallery",
      "ImageText",
      "ImageTextLarge",
      "InlineHeader",
      "Input",
      "Label",
      "LineChart",
      "ListBlock",
      "ListItem",
      "MarkDownRenderer",
      "MetricIndicatorInline",
      "MetricIndicatorWithStrikethrough",
      "Modal",
      "ModalDialog",
      "OptionCard",
      "OptionCards",
      "OverviewCardBlock",
      "OverviewCardItem",
      "PieChart",
      "Point",
      "QrCode",
      "RadarChart",
      "RadialChart",
      "RadioGroup",
      "RadioItem",
      "ScatterChart",
      "ScatterSeries",
      "Select",
      "SelectItem",
      "Separator",
      "Series",
      "SingleStackedBarChart",
      "Slice",
      "Slider",
      "SnippetCardBlock",
      "SnippetCardItem",
      "Stack",
      "Steps",
      "StepsItem",
      "SwitchGroup",
      "SwitchItem",
      "TabItem",
      "Table",
      "Tabs",
      "Tag",
      "TagBlock",
      "Text",
      "TextArea",
      "TextCallout",
      "TextContent",
      "Theme",
      "Tooltip",
      "VisualCardBlock",
      "VisualCardItem",
    ]);
  });
});

describe("Stack", () => {
  it("stacks children in a column by default", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([TextContent("a"), TextContent("b")])',
    );
    expect(lines(rendered.frame())).toEqual(["a", "", "b"]);
    rendered.unmount();
  });

  it("lays children out in a row with a gap", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([TextContent("a"), TextContent("b")], "row")',
    );
    expect(lines(rendered.frame())).toEqual(["a b"]);
    rendered.unmount();
  });
});

describe("Card", () => {
  it("draws a round border by default", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Card([TextContent("inside")])])',
    );
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("╭");
    expect(plain).toContain("inside");
    rendered.unmount();
  });

  it("draws a single-line border for the sunk variant and none for clear", async () => {
    const sunk = await renderProgram(
      inkLibrary,
      'root = Stack([Card([TextContent("x")], "sunk")])',
    );
    expect(stripAnsi(sunk.frame())).toContain("┌");
    sunk.unmount();
    const clear = await renderProgram(
      inkLibrary,
      'root = Stack([Card([TextContent("x")], "clear")])',
    );
    const plain = stripAnsi(clear.frame());
    expect(plain).not.toContain("╭");
    expect(plain).not.toContain("┌");
    expect(plain).toContain("x");
    clear.unmount();
  });
});

describe("CardHeader", () => {
  it("renders a bold title and a dim subtitle", async () => {
    const rendered = await renderProgram(
      inkLibrary,
      'root = Stack([Card([CardHeader("Deploy", "Pick a region")])])',
    );
    const frame = rendered.frame();
    expect(frame).toContain(BOLD_ON);
    expect(frame).toContain(DIM_ON);
    expect(stripAnsi(frame)).toContain("Deploy");
    expect(stripAnsi(frame)).toContain("Pick a region");
    rendered.unmount();
  });
});

describe("TextContent", () => {
  it("maps sizes to terminal styles", async () => {
    const small = await renderProgram(inkLibrary, 'root = Stack([TextContent("s", "small")])');
    expect(small.frame()).toContain(DIM_ON);
    small.unmount();
    const large = await renderProgram(inkLibrary, 'root = Stack([TextContent("l", "large")])');
    expect(large.frame()).toContain(BOLD_ON);
    large.unmount();
    const heavy = await renderProgram(
      inkLibrary,
      'root = Stack([TextContent("h", "large-heavy")])',
    );
    expect(heavy.frame()).toContain(UNDERLINE_ON);
    heavy.unmount();
  });
});

describe("TextContent markdown", () => {
  it("renders bold, code and bullet lists", async () => {
    const program =
      'root = Stack([TextContent("Deploy **now** with `kubectl`\\n- first\\n- second")])';
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Deploy now with kubectl");
    expect(plain).toContain("• first");
    expect(plain).toContain("• second");
    expect(plain).not.toContain("**");
    expect(rendered.frame()).toContain(BOLD_ON);
    rendered.unmount();
  });
});

describe("Buttons", () => {
  it("lays buttons out in a row by default and in a column on request", async () => {
    const row = await renderProgram(
      inkLibrary,
      'root = Stack([Buttons([Button("A"), Button("B")])])',
    );
    expect(lines(row.frame())).toEqual(["[ A ] [ B ]"]);
    row.unmount();
    const column = await renderProgram(
      inkLibrary,
      'root = Stack([Buttons([Button("A"), Button("B")], "column")])',
    );
    expect(lines(column.frame())).toEqual(["[ A ]", "", "[ B ]"]);
    column.unmount();
  });
});

describe("Form, FormControl and Label", () => {
  it("renders the fields with their labels and hints, then the buttons", async () => {
    const program = [
      'root = Stack([form, Label("Done")])',
      'form = Form("signup", Buttons([go]), [emailField])',
      'emailField = FormControl("Email", Input("email", "you@example.com"), "We never share it")',
      'go = Button("Go")',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Email");
    expect(plain).toContain("you@example.com");
    expect(plain).toContain("We never share it");
    expect(plain).toContain("[ Go ]");
    expect(plain).toContain("Done");
    expect(plain.indexOf("Email")).toBeLessThan(plain.indexOf("[ Go ]"));
    rendered.unmount();
  });
});

describe("Table", () => {
  it("draws a bold header, a separator and one line per row with aligned columns", async () => {
    const program = [
      "root = Stack([table])",
      'table = Table([Col("Name", ["Ada", "Grace"]), Col("Age", [36, 45], "number")])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    expect(lines(rendered.frame())).toEqual([
      "Name   Age",
      "─────  ───",
      "Ada     36",
      "Grace   45",
    ]);
    const headerLine = rendered.frame().split("\n")[0] ?? "";
    expect(headerLine).toContain(BOLD_ON);
    rendered.unmount();
  });

  it("renders component cells through the library", async () => {
    const program = [
      "root = Stack([table])",
      'table = Table([Col("Task", ["Deploy"]), Col("Action", [Button("Go")], "action")])',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Deploy");
    expect(plain).toContain("[ Go ]");
    rendered.unmount();
  });

  it("clips rows wider than the terminal instead of wrapping them", async () => {
    const long = "x".repeat(150);
    const program = `root = Stack([Table([Col("Wide", ["${long}"]), Col("B", ["b"])])])`;
    const rendered = await renderProgram(inkLibrary, program);
    const plain = lines(rendered.frame());
    expect(plain).toHaveLength(3);
    for (const line of plain) {
      expect(line.length).toBeLessThanOrEqual(100);
    }
    rendered.unmount();
  });

  it("renders nothing for a table without columns", async () => {
    const rendered = await renderProgram(inkLibrary, "root = Stack([Table([])])");
    expect(stripAnsi(rendered.frame()).trim()).toBe("");
    rendered.unmount();
  });
});
