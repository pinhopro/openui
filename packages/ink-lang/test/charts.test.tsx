import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { CYAN_ON, stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

async function frameOf(program: string): Promise<string> {
  const rendered = await renderProgram(inkLibrary, program);
  const plain = stripAnsi(rendered.frame());
  rendered.unmount();
  return plain;
}

async function rawFrameOf(program: string): Promise<string> {
  const rendered = await renderProgram(inkLibrary, program);
  const frame = rendered.frame();
  rendered.unmount();
  return frame;
}

const BRAILLE = /[⠀-⣿]/;

/** How many braille dots are lit in the frame. */
function litDots(plain: string): number {
  let count = 0;
  for (const character of plain) {
    const code = character.charCodeAt(0);
    if (code < 0x2800 || code > 0x28ff) continue;
    let bits = code - 0x2800;
    while (bits > 0) {
      count += bits & 1;
      bits >>= 1;
    }
  }
  return count;
}

/** The lines of the frame that carry the given text. */
function linesWith(frame: string, text: string): string[] {
  const found: string[] = [];
  for (const line of frame.split("\n")) {
    if (stripAnsi(line).includes(text)) found.push(line);
  }
  return found;
}

describe("charts", () => {
  it("draws a bar chart as one bar per label and series with the value", async () => {
    const plain = await frameOf(
      'root = Stack([BarChart(["Mon", "Tue"], [Series("Views", [10, 20])], "grouped", "Day", "Views")])',
    );
    expect(plain).toContain("Mon");
    expect(plain).toContain("Tue");
    expect(plain).toContain("█");
    expect(plain).toContain("20");
    expect(plain).toContain("Views");
    expect(plain).toContain("Day");
  });

  it("draws horizontal bar and radar charts the same way", async () => {
    const horizontal = await frameOf(
      'root = Stack([HorizontalBarChart(["A", "B"], [Series("v", [1, 2])])])',
    );
    expect(horizontal).toContain("█");
    const radar = await frameOf('root = Stack([RadarChart(["A", "B"], [Series("v", [1, 2])])])');
    expect(radar).toContain("█");
    expect(radar).toContain("A");
  });

  it("draws a line chart as a braille polyline with the value range and the first and last label", async () => {
    const line = await frameOf(
      'root = Stack([LineChart(["a", "b", "c"], [Series("Visits", [1, 2, 3])], null, "Day", "Count")])',
    );
    expect(line).toMatch(BRAILLE);
    expect(line).toContain("Visits");
    expect(line).toMatch(/^\s*3 /m);
    expect(line).toMatch(/^\s*1 /m);
    expect(line).toContain("a … c");
    expect(line).toContain("x: Day");
    expect(line).toContain("y: Count");
  });

  it("draws an area chart filled under the line", async () => {
    const program = '(["a", "b", "c", "d"], [Series("v", [1, 4, 2, 5])])';
    const line = await frameOf(`root = Stack([LineChart${program}])`);
    const area = await frameOf(`root = Stack([AreaChart${program}])`);
    expect(area).toMatch(BRAILLE);
    expect(litDots(area)).toBeGreaterThan(litDots(line) * 2);
    expect(area).toContain("v");
  });

  it("lists one legend line per series in the accent color", async () => {
    const frame = await rawFrameOf(
      'root = Stack([LineChart(["a", "b"], [Series("Views", [1, 2]), Series("Clicks", [2, 1])])])',
    );
    const views = linesWith(frame, "Views");
    const clicks = linesWith(frame, "Clicks");
    expect(views).toHaveLength(1);
    expect(clicks).toHaveLength(1);
    expect(views[0]).toContain(CYAN_ON);
    expect(clicks[0]).toContain(CYAN_ON);
  });

  it("draws pie, radial and single stacked bar charts as a proportion bar with a legend", async () => {
    const pie = await frameOf('root = Stack([PieChart(["Low", "High"], [1, 3])])');
    expect(pie).toContain("Low");
    expect(pie).toContain("25%");
    expect(pie).toContain("High");
    expect(pie).toContain("75%");
    const radial = await frameOf('root = Stack([RadialChart(["A", "B"], [2, 2])])');
    expect(radial).toContain("50%");
    const stacked = await frameOf('root = Stack([SingleStackedBarChart(["A", "B"], [1, 1])])');
    expect(stacked).toContain("50%");
  });

  it("draws a scatter chart as braille points with the axis ranges and a legend per dataset", async () => {
    const frame = await rawFrameOf(
      'root = Stack([ScatterChart([ScatterSeries("Sample", [Point(1, 2), Point(3, 4)]), ScatterSeries("Other", [Point(2, 3)])], "x", "y")])',
    );
    const plain = stripAnsi(frame);
    expect(plain).toMatch(BRAILLE);
    expect(litDots(plain)).toBe(3);
    expect(plain).toMatch(/^\s*4 /m);
    expect(plain).toMatch(/^\s*2 /m);
    expect(plain).toContain("1 … 3");
    expect(plain).toContain("Sample");
    expect(plain).toContain("2 points");
    expect(plain).toContain("Other");
    expect(plain).toContain("1 point");
    expect(linesWith(frame, "Sample")[0]).toContain(CYAN_ON);
    expect(plain).toContain("x: x");
  });

  it("renders nothing for a chart without data", async () => {
    const plain = await frameOf('root = Stack([TextContent("before"), BarChart([], [])])');
    expect(plain.trim()).toBe("before");
    const braille = await frameOf(
      'root = Stack([TextContent("before"), LineChart([], []), AreaChart([], []), ScatterChart([]), ScatterChart([ScatterSeries("Empty", [])])])',
    );
    expect(braille.trim()).toBe("before");
  });
});
