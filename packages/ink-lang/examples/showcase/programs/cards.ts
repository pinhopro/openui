/** The five card blocks and the building blocks their items take. */
export const cardsProgram = [
  "root = Stack([header, snippets, overview, context, composite, visual])",
  'header = CardHeader("Card blocks", "Snippet, overview, context, composite and visual cards")',
  'snippets = SnippetCardBlock([cpu, memory], "grid", true, @ToAssistant("Open the metric"))',
  'cpu = SnippetCardItem("cpu", IconText(Icon("cpu"), "info", "sm", "CPU", "4 cores"), BoldText("number", "38%"))',
  'memory = SnippetCardItem("memory", IconText(Icon("memory"), "warning", "sm", "Memory", "16 GB"), BoldText("number", "71%"))',
  'overview = OverviewCardBlock([mrr], "grid")',
  'mrr = OverviewCardItem("mrr", Text("text", "MRR", "monthly recurring revenue"), MetricIndicatorInline("$48.2k", "this month", {direction: "up", value: 8}))',
  'context = ContextCardBlock([incident, note], "carousel")',
  'incident = ContextCardItem("incident", "Incident 1042", "Elevated error rate in eu-west-1, mitigated", "gray")',
  'note = ContextCardItem("note", Tag("Note", null, "sm", "info"), "Use the sidebar to switch pages")',
  'composite = CompositeCardBlock([proPlan, teamPlan], "grid")',
  'proPlan = CompositeCardItem("pro", IconText(Icon("zap"), "info", "md", "Pro"), [Text(null, "For growing teams"), TagBlock(["SSO", "Audit log"]), MetricIndicatorInline("99.9%", "uptime")], {price: BoldText(null, "$29"), button: Button("Choose Pro", @ToAssistant("Choose Pro"))})',
  'teamPlan = CompositeCardItem("team", ImageText("https://example.com/team.png", "Team", "Team"), [BoldText(null, "Everything in Pro")], {price: MetricIndicatorWithStrikethrough("$79", "per month", "$99"), button: Button("Choose Team", @ToAssistant("Choose Team"), "secondary")})',
  'visual = VisualCardBlock([launch], "carousel")',
  'launch = VisualCardItem(BoldText(null, "Launch week"), "launch", "https://example.com/launch.png", Tag("New", null, "sm", "success"), "Launch banner")',
].join("\n");
