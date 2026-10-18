/** Tabs, an accordion, numbered steps and a carousel of slides. */
export const navigationProgram = [
  "root = Stack([header, tabs, accordion, steps, carousel])",
  'header = CardHeader("Navigation", "Tabs, accordion, steps and carousel")',
  "tabs = Tabs([metrics, logs, settings])",
  'metrics = TabItem("metrics", "Metrics", [BarChart(["Mon", "Tue", "Wed"], [Series("Builds", [14, 22, 9])], "grouped", "Day", "Builds")])',
  'logs = TabItem("logs", "Logs", [CodeBlock("log", "12:00 build started\\n12:03 build passed")])',
  'settings = TabItem("settings", "Settings", [TextContent("Settings live here."), Buttons([Button("Save", @ToAssistant("Save the settings"))])])',
  "accordion = Accordion([what, why])",
  'what = AccordionItem("what", "What is OpenUI Lang?", [TextContent("A small language models stream to describe a user interface.")])',
  'why = AccordionItem("why", "Why a terminal renderer?", [TextContent("The same program renders on the web and in the terminal."), Buttons([Button("Learn more", @OpenUrl("https://www.openui.com"), "secondary")])])',
  'steps = Steps([StepsItem("Install", "pnpm add @openuidev/ink-lang ink react"), StepsItem("Render", "Mount InkRenderer with a library and a response"), StepsItem("Stream", "Append chunks and flip isStreaming off at the end")])',
  'carousel = Carousel([[MarkDownRenderer("## Slide 1\\n\\nLeft and Right move between slides.")], [MarkDownRenderer("## Slide 2\\n\\nThe mouse wheel works too.")], [MarkDownRenderer("## Slide 3\\n\\nThe last one.")]], "card")',
].join("\n");
