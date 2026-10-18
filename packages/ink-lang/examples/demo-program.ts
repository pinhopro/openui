/**
 * A mock OpenUI Lang response: exactly what a model would stream for the
 * React default library, rendered here by the terminal library instead.
 */
export const demoProgram = [
  '$region = ""',
  "root = Stack([header, intro, panel, regions, form])",
  'header = CardHeader("Deploy service", "Pick a region and confirm")',
  'intro = TextContent("The same OpenUI Lang program renders on the web with react-lang and in this terminal with ink-lang.")',
  'panel = Card([status, hint], "sunk")',
  'status = TextContent("Status: ready", "small-heavy")',
  'hint = TextContent("Tab moves focus, Enter presses a button, typing edits the field, Up and Down pick a region.", "small")',
  'regions = Table([Col("Region", ["us-east-1", "eu-west-1", "ap-south-1"]), Col("Location", ["N. Virginia", "Ireland", "Mumbai"]), Col("Latency (ms)", [12, 88, 140], "number")])',
  'form = Form("deploy", Buttons([confirm, cancel]), [regionField, tagField])',
  'regionField = FormControl("Region", Select("region", [us, eu, ap], "Pick a region", null, $region), "Chosen: " + $region)',
  'us = SelectItem("us-east-1", "US East (N. Virginia)")',
  'eu = SelectItem("eu-west-1", "EU West (Ireland)")',
  'ap = SelectItem("ap-south-1", "Asia Pacific (Mumbai)")',
  'tagField = FormControl("Tag", Input("tag", "v1.2.3"), "Release tag to deploy")',
  'confirm = Button("Deploy", @ToAssistant("Deploy " + $region), "primary")',
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
