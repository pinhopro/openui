/**
 * The tokens of the active theme, drawn by the showcase's own TokenSheet
 * component, then a Theme(...) declared by the program itself: tokens plus
 * a stylesheet of the CSS subset.
 */
export const tokensProgram = [
  "root = Stack([header, intro, sheet, Separator(), programHeader, themed, plain])",
  'header = CardHeader("Design tokens", "What the active theme sets, and a Theme(...) declared by the program")',
  'intro = TextContent("Pick another theme in the sidebar: the sheet lists every token group of the active design system, the primitive scales as swatches, and marks the tokens the theme sets itself.")',
  "sheet = TokenSheet()",
  'programHeader = InlineHeader("Theme(...) in the program", "the box below carries its own Monokai tokens and stylesheet, whatever the page theme")',
  'themed = Theme({"color.primary": "#a6e22e", "color.error": "#f92672", "color.warning": "#e6db74", "color.info": "#66d9ef", "color.neutral": "#75715e", "color.canvas.surface": "#3e3d32", "color.text.value": "#f8f8f2", "color.text.helper": "#a59f85", "color.text.placeholder": "#75715e", "color.border.default": "#49483e", "color.border.focus": "#a6e22e", "shape.fieldBorder": "round", "shape.cardBorder": "double", "grid.columns": 2, "spacing.lg": 3, "typography.h4.transform": "uppercase"}, "Table { border: solid; border-color: #49483e } Table th { color: #66d9ef } Table tbody tr:odd { background-color: #3e3d32 } Table td.number { color: #ae81ff } Button:hover { background-color: #49483e } FormControl .label { color: #e6db74 } CardHeader .subtitle { font-style: italic }", [sample])',
  'sample = Card([sampleHeader, sampleText, metrics, form, table, actions], "card")',
  'sampleHeader = CardHeader("Monokai", "every color here comes from the tokens; the title is uppercase by typography.h4")',
  'sampleText = TextContent("Primary, error, warning and info are one hex each; the 100 to 900 stops are derived. `code` uses the primary color.")',
  'metrics = SnippetCardBlock([SnippetCardItem("errors", IconText(Icon("bug"), "danger", "sm", "Errors", "last hour"), BoldText("number", "3")), SnippetCardItem("latency", IconText(Icon("clock"), "info", "sm", "p95", "ms"), BoldText("number", "87"))], "grid")',
  'form = Form("tokens", Buttons([Button("Save", @ToAssistant("Save tokens")), Button("Reset", @Reset($query), "secondary")]), [FormControl("Query", Input("query", "Search the palette", "text", null, $query), "Rounded field, lime focus border"), FormControl("Scope", Select("scope", [SelectItem("all", "All tokens"), SelectItem("color", "Colors only")], "Pick a scope"), "")])',
  '$query = ""',
  'table = Table([Col("Token", ["color.primary", "color.error", "shape.fieldBorder"]), Col("Value", ["#a6e22e", "#f92672", "round"]), Col("Stops", [5, 5, 1], "number")])',
  'actions = Buttons([Button("Primary"), Button("Secondary", null, "secondary"), Button("Delete", null, "primary", "destructive")])',
  'plain = Card([CardHeader("Outside the Theme", "this card keeps the page design system"), TextContent("Switch the theme in the sidebar and only this card changes.")], "sunk")',
].join("\n");
