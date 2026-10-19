import { describe, expect, it } from "vitest";
import { inkLibrary } from "../../src/default-library";
import type { DesignSystemInput } from "../../src/design/design-system";
import { stripAnsi } from "../helpers/ansi";
import { findCell } from "../helpers/find-cell";
import { MOUSE } from "../helpers/mouse";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

const MAGENTA_ON = "\u001b[35m";
const BLUE_ON = "\u001b[34m";
const BLUE_BG_ON = "\u001b[44m";

async function mount(program: string, designSystem: DesignSystemInput, mouse = false) {
  const rendered = await renderProgram(inkLibrary, program, { designSystem, mouse });
  function line(text: string): string {
    const found = rendered
      .frame()
      .split("\n")
      .find(function has(candidate) {
        return stripAnsi(candidate).includes(text);
      });
    return found ?? "";
  }
  return { rendered, line };
}

const table =
  'root = Stack([Table([Col("Name", ["ann", "bob", "cid"]), Col("Qty", [1, 22, 333], "number")])])';

describe("table styling", () => {
  it("draws the table border, header and striped rows from the stylesheet", async () => {
    const { rendered, line } = await mount(table, {
      css: "Table { border: solid } Table th { color: magenta } Table tbody tr:odd { background-color: blue }",
    });
    expect(stripAnsi(rendered.frame())).toContain("┌");
    expect(line("Name")).toContain(MAGENTA_ON);
    expect(line("ann")).toContain(BLUE_BG_ON);
    expect(line("bob")).not.toContain(BLUE_BG_ON);
    expect(line("cid")).toContain(BLUE_BG_ON);
    rendered.unmount();
  });

  it("aligns number cells to the right by default and follows text-align", async () => {
    const right = await mount(table, {});
    const plainRight = stripAnsi(right.rendered.frame());
    expect(findCell(plainRight, "1").x).toBeGreaterThan(findCell(plainRight, "Qty").x);
    right.rendered.unmount();
    const left = await mount(table, { css: "Table td.number { text-align: left }" });
    const plainLeft = stripAnsi(left.rendered.frame());
    expect(findCell(plainLeft, "1").x).toBe(findCell(plainLeft, "Qty").x);
    left.rendered.unmount();
  });

  it("gives a bordered field in a table a column wide enough for its frame", async () => {
    const { rendered } = await mount(
      'root = Stack([Table([Col("Note", [Input("q", "a longer placeholder")])])])',
      { tokens: { "shape.fieldBorder": "round" } },
    );
    expect(stripAnsi(rendered.frame())).toContain("a longer placeholder");
    rendered.unmount();
  });

  it("styles a field inside a table through a descendant selector", async () => {
    const { rendered, line } = await mount(
      'root = Stack([Table([Col("Search field", [Input("q", "Type here")])]), Input("other", "Elsewhere")])',
      { css: "Table Input::placeholder { color: magenta }" },
    );
    expect(line("Type here")).toContain(MAGENTA_ON);
    expect(line("Elsewhere")).not.toContain(MAGENTA_ON);
    rendered.unmount();
  });
});

describe("form and text parts", () => {
  it("styles the label, helper and error of a FormControl", async () => {
    const { rendered, line } = await mount(
      'root = Stack([FormControl("Email", Input("email", "you@example.com"), "Work address")])',
      { css: "FormControl .label { color: magenta } FormControl .helper { color: blue }" },
    );
    expect(line("Email")).toContain(MAGENTA_ON);
    expect(line("Work address")).toContain(BLUE_ON);
    rendered.unmount();
  });

  it("applies typography rules and text-transform to text content and markdown headings", async () => {
    const { rendered, line } = await mount(
      'root = Stack([TextContent("hello world", "large-heavy"), MarkDownRenderer("# Title\\n\\nbody")])',
      {
        css: "TextContent.large-heavy { text-transform: uppercase } MarkDownRenderer .h1 { color: magenta; font-size: 2em }",
      },
    );
    expect(stripAnsi(rendered.frame())).toContain("HELLO WORLD");
    expect(line("Title")).toContain(MAGENTA_ON);
    rendered.unmount();
  });

  it("transforms and sizes CardHeader titles through the cascade", async () => {
    const { rendered, line } = await mount('root = Stack([CardHeader("Section", "about it")])', {
      css: "CardHeader .title { text-transform: uppercase; font-size: x-large; color: magenta } CardHeader .subtitle { text-transform: lowercase; color: blue }",
    });
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("SECTION");
    expect(line("SECTION")).toContain(MAGENTA_ON);
    expect(line("SECTION")).toContain("\u001b[1m");
    expect(line("about it")).toContain(BLUE_ON);
    rendered.unmount();
  });

  it("styles InlineHeader parts", async () => {
    const { rendered, line } = await mount('root = Stack([InlineHeader("Section", "about it")])', {
      css: "InlineHeader .heading { color: magenta } InlineHeader .description { color: blue }",
    });
    expect(line("Section")).toContain(MAGENTA_ON);
    expect(line("about it")).toContain(BLUE_ON);
    rendered.unmount();
  });
});

describe("spacing, grid and box rules", () => {
  it("sizes Stack gaps from the spacing tokens", async () => {
    const program = 'root = Stack([TextContent("one"), TextContent("two")], "column", "l")';
    const { rendered } = await mount(program, { tokens: { "spacing.lg": 3 } });
    const plain = stripAnsi(rendered.frame());
    expect(findCell(plain, "two").y - findCell(plain, "one").y).toBe(4);
    rendered.unmount();
  });

  it("lays card blocks out in grid columns", async () => {
    const program =
      'root = Stack([SnippetCardBlock([SnippetCardItem("a", IconText(Icon("cpu"), null, null, "Alpha"), BoldText(null, "1")), SnippetCardItem("b", IconText(Icon("ram"), null, null, "Beta"), BoldText(null, "2"))], "grid")])';
    const stacked = await mount(program, {});
    const plainStacked = stripAnsi(stacked.rendered.frame());
    expect(findCell(plainStacked, "Alpha").y).not.toBe(findCell(plainStacked, "Beta").y);
    stacked.rendered.unmount();
    const grid = await mount(program, { tokens: { "grid.columns": 2 } });
    const plainGrid = stripAnsi(grid.rendered.frame());
    expect(findCell(plainGrid, "Alpha").y).toBe(findCell(plainGrid, "Beta").y);
    grid.rendered.unmount();
  });

  it("applies padding, margin and border rules to Stack and Card", async () => {
    const { rendered } = await mount('root = Stack([Card([TextContent("inside")], "clear")])', {
      css: "Stack { padding-left: 2 } Card.clear { border: double; margin-top: 1 }",
    });
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("╔");
    expect(findCell(plain, "╔").x).toBe(2);
    expect(findCell(plain, "╔").y).toBe(1);
    rendered.unmount();
  });
});

describe("button states", () => {
  it("styles hover and pressed through the cascade", async () => {
    const { rendered, line } = await mount(
      'root = Stack([TextContent("above"), Button("Go", @ToAssistant("Go"))])',
      { css: "Button:hover { color: magenta } Button:pressed { color: blue }" },
      true,
    );
    const cell = findCell(stripAnsi(rendered.frame()), "[ Go ]");
    rendered.instance.stdin.write(MOUSE.move(cell.x + 2, cell.y));
    await settle();
    expect(line("[ Go ]")).toContain(MAGENTA_ON);
    rendered.instance.stdin.write(MOUSE.press(cell.x + 2, cell.y));
    await settle();
    expect(line("[ Go ]")).toContain(BLUE_ON);
    rendered.instance.stdin.write(MOUSE.release(cell.x + 2, cell.y));
    await settle();
    expect(line("[ Go ]")).not.toContain(BLUE_ON);
    rendered.unmount();
  });
});
