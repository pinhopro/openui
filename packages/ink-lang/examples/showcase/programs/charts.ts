/** Every chart: text bars, braille lines and areas, proportion bars and a scatter plot. */
export const chartsProgram = [
  "root = Stack([header, bars, horizontal, radar, line, area, proportions, scatter])",
  'header = CardHeader("Charts", "Bars, lines, areas, proportions and scatter plots")',
  'months = ["Jan", "Feb", "Mar", "Apr"]',
  'visits = Series("Visits", [120, 180, 150, 210])',
  'signups = Series("Signups", [12, 25, 19, 30])',
  'bars = Card([CardHeader("BarChart", "grouped, then stacked"), BarChart(months, [visits, signups], "grouped", "Month", "Count"), BarChart(months, [visits, signups], "stacked", "Month", "Count")], "sunk")',
  'horizontal = Card([CardHeader("HorizontalBarChart"), HorizontalBarChart(["Chrome", "Safari", "Firefox"], [Series("Share", [64, 20, 16])], "grouped", "Share", "Browser")], "sunk")',
  'radar = Card([CardHeader("RadarChart"), RadarChart(["Speed", "Reliability", "Cost", "Support"], [Series("Plan A", [8, 6, 9, 7]), Series("Plan B", [6, 9, 5, 8])])], "sunk")',
  'line = Card([CardHeader("LineChart", "one braille polyline per series: natural, then step"), LineChart(months, [visits, signups], "natural", "Month", "Count", 6), LineChart(months, [signups], "step", "Month", "Signups")], "sunk")',
  'area = Card([CardHeader("AreaChart", "filled under the line: linear, then step"), AreaChart(months, [visits], "linear", "Month", "Visits"), AreaChart(months, [signups], "step", "Month", "Signups")], "sunk")',
  'proportions = Stack([PieChart(["Cached", "Origin", "Error"], [72, 25, 3], "donut"), PieChart(["Cached", "Origin", "Error"], [72, 25, 3], "pie", "circular"), PieChart(["Done", "Open"], [68, 32], "pie", "semiCircular"), RadialChart(["Done", "Open"], [68, 32]), SingleStackedBarChart(["Free", "Pro", "Team"], [55, 30, 15])], "column", "m")',
  'scatter = Card([CardHeader("ScatterChart", "every dataset on one canvas"), ScatterChart([latency, errors], "Hour", "Value")], "sunk")',
  'latency = ScatterSeries("Latency", [Point(1, 12), Point(2, 18), Point(3, 9), Point(4, 25)])',
  'errors = ScatterSeries("Errors", [Point(1, 2), Point(2, 4), Point(3, 1), Point(4, 6)])',
].join("\n");
