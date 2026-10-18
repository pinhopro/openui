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
      "Button",
      "Buttons",
      "Card",
      "CardHeader",
      "Form",
      "FormControl",
      "Input",
      "Label",
      "Stack",
      "TextContent",
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
