/** The landing page: what the showcase is and how to move around it. */
export const overviewProgram = [
  "root = Stack([header, intro, kpis, tags, actions, docsCode])",
  'header = CardHeader("Overview", "Every component of the React default library, rendered in the terminal")',
  'intro = TextContent("Pick a page in the sidebar. **Tab** moves focus, **Enter** presses, **Ctrl+N** and **Ctrl+P** switch pages. With the mouse on you can click, hover and scroll.")',
  'kpis = OverviewCardBlock([components, tests, deps], "grid")',
  'components = OverviewCardItem("components", IconText(Icon("box"), "info", "md", "Components", "shared with react-ui"), MetricIndicatorInline("90", "schemas", {direction: "up", value: 55}))',
  'tests = OverviewCardItem("tests", IconText(Icon("check"), "success", "md", "Tests", "vitest and ink-testing-library"), MetricIndicatorInline("620", "passing"))',
  'deps = OverviewCardItem("deps", IconText(Icon("package"), "neutral", "md", "Runtime dependencies", "lang-core only"), MetricIndicatorInline("1", "dependency", {direction: "down", value: 0}))',
  'tags = TagBlock(["Ink 8", "React 19", "Node 22", "ESM only"])',
  "actions = Buttons([hello, docs])",
  'hello = Button("Say hello", @ToAssistant("Hello from the showcase"))',
  'docs = Button("Open the docs", @OpenUrl("https://www.openui.com/docs"), "secondary")',
  'docsCode = Card([CardHeader("Scan for the docs", "a QrCode component, drawn with block characters"), QrCode("https://www.openui.com/docs")], "sunk")',
].join("\n");
