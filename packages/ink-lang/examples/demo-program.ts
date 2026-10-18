/**
 * A mock OpenUI Lang response: exactly what a model would stream for the
 * React default library, rendered here by the terminal library instead.
 */
export const demoProgram = [
  "root = Stack([header, intro, panel, form])",
  'header = CardHeader("Deploy service", "Pick a region and confirm")',
  'intro = TextContent("The same OpenUI Lang program renders on the web with react-lang and in this terminal with ink-lang.")',
  'panel = Card([status, hint], "sunk")',
  'status = TextContent("Status: ready", "small-heavy")',
  'hint = TextContent("Tab moves focus, Enter presses a button, typing edits the field.", "small")',
  'form = Form("deploy", Buttons([confirm, cancel]), [regionField])',
  'regionField = FormControl("Region", Input("region", "us-east-1"), "Any AWS region id")',
  'confirm = Button("Deploy", @ToAssistant("Deploy to the selected region"), "primary")',
  'cancel = Button("Cancel", null, "secondary")',
].join("\n");

/** Splits the program into fixed-size chunks, the way a model stream arrives. */
export function chunkProgram(program: string, size: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < program.length; index += size) {
    chunks.push(program.slice(index, index + size));
  }
  return chunks;
}
