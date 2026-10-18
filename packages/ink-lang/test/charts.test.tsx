import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { renderProgram } from "./helpers/render-program";

async function frameOf(program: string): Promise<string> {
  const rendered = await renderProgram(inkLibrary, program);
  const plain = stripAnsi(rendered.frame());
  rendered.unmount();
  return plain;
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

  it("draws line and area charts as sparklines with their range", async () => {
    const line = await frameOf(
      'root = Stack([LineChart(["a", "b", "c"], [Series("Visits", [1, 2, 3])])])',
    );
    expect(line).toContain("Visits");
    expect(line).toContain("▁");
    expect(line).toContain("█");
    expect(line).toContain("1");
    expect(line).toContain("3");
    const area = await frameOf('root = Stack([AreaChart(["a", "b"], [Series("v", [5, 9])])])');
    expect(area).toContain("▁█");
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

  it("summarizes a scatter chart per dataset", async () => {
    const plain = await frameOf(
      'root = Stack([ScatterChart([ScatterSeries("Sample", [Point(1, 2), Point(3, 4)])], "x", "y")])',
    );
    expect(plain).toContain("Sample");
    expect(plain).toContain("2 points");
    expect(plain).toContain("1");
    expect(plain).toContain("4");
  });

  it("renders nothing for a chart without data", async () => {
    const plain = await frameOf('root = Stack([TextContent("before"), BarChart([], [])])');
    expect(plain.trim()).toBe("before");
  });
});
