import type { OpenUIError } from "@openuidev/lang-core";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { InkRenderer } from "../src/ink-renderer";
import {
  createLibrary,
  defineComponent,
  type ComponentRenderProps,
  type DefinedComponent,
  type Library,
} from "../src/library";
import { stripAnsi } from "./helpers/ansi";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([header, intro, form])",
  'header = CardHeader("Deploy service", "Pick a region and confirm")',
  'intro = TextContent("The same program renders on the web and in the terminal.")',
  'form = Form("deploy", Buttons([confirm, cancel]), [regionField])',
  'regionField = FormControl("Region", Input("region", "us-east-1"))',
  'confirm = Button("Deploy", @ToAssistant("Deploy to the selected region"), "primary")',
  'cancel = Button("Cancel", null, "secondary")',
].join("\n");

/** Every line end (a new statement can appear), every fourth character in between, and the end. */
function checkpoints(text: string): number[] {
  const lengths = new Set<number>();
  for (let index = 0; index < text.length; index += 1) {
    if (text.charAt(index) === "\n" || index % 4 === 0) lengths.add(index + 1);
  }
  lengths.add(text.length);
  const sorted = [...lengths];
  sorted.sort(function ascending(a, b) {
    return a - b;
  });
  return sorted;
}

/** The same library, with every renderer recording the errors it throws (the boundary hides them). */
function recordingLibrary(base: Library, thrown: string[]): Library {
  const components: DefinedComponent[] = [];
  for (const [name, definition] of Object.entries(base.components)) {
    const Original = definition.component;
    function Recording(props: ComponentRenderProps<any>) {
      try {
        return Original(props);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        thrown.push(`${name}: ${message}`);
        throw error;
      }
    }
    components.push(
      defineComponent({
        name,
        description: definition.description,
        props: definition.props,
        component: Recording,
      }),
    );
  }
  return createLibrary({ root: base.root, components });
}

function lineEnd(statementName: string): number {
  return program.indexOf("\n", program.indexOf(`${statementName} =`)) + 1;
}

describe("streaming", () => {
  it("renders every prefix of a program without throwing and converges on the batch frame", async () => {
    const thrown: string[] = [];
    const library = recordingLibrary(inkLibrary, thrown);
    const errorReports: OpenUIError[][] = [];
    function onError(errors: OpenUIError[]): void {
      errorReports.push(errors);
    }
    const instance = render(
      <InkRenderer library={library} response="" isStreaming={true} onError={onError} />,
    );
    const headerDone = lineEnd("header");
    const introDone = lineEnd("intro");
    const seenStatements = new Set<string>();
    for (const length of checkpoints(program)) {
      const prefix = program.slice(0, length);
      instance.rerender(
        <InkRenderer library={library} response={prefix} isStreaming={true} onError={onError} />,
      );
      if (prefix.endsWith("\n")) await settle(1);
      const frame = stripAnsi(instance.lastFrame() ?? "");
      expect(frame).toContain("streaming");
      if (length >= headerDone) expect(frame).toContain("Deploy service");
      if (length >= introDone) expect(frame).toContain("The same program renders");
      // Completed statements never disappear from later frames.
      for (const seen of seenStatements) expect(frame).toContain(seen);
      if (length >= headerDone) seenStatements.add("Deploy service");
      if (length >= introDone) seenStatements.add("The same program renders");
    }
    expect(thrown).toEqual([]);
    expect(errorReports).toEqual([]);

    instance.rerender(
      <InkRenderer library={library} response={program} isStreaming={false} onError={onError} />,
    );
    await settle();
    const streamed = stripAnsi(instance.lastFrame() ?? "");
    instance.unmount();

    const batch = render(
      <InkRenderer library={library} response={program} isStreaming={false} onError={onError} />,
    );
    await settle();
    const batched = stripAnsi(batch.lastFrame() ?? "");
    batch.unmount();

    expect(streamed).toBe(batched);
    expect(streamed).toContain("[ Deploy ]");
    expect(streamed).not.toContain("streaming");
    expect(errorReports[errorReports.length - 1]).toEqual([]);
    expect(thrown).toEqual([]);
  }, 20_000);

  it("shows the placeholder only until the root appears", async () => {
    const instance = render(
      <InkRenderer library={inkLibrary} response="root = Sta" isStreaming={true} />,
    );
    await settle(1);
    expect(stripAnsi(instance.lastFrame() ?? "").split("\n")).toContain("…");
    instance.rerender(
      <InkRenderer library={inkLibrary} response={"root = Stack([header])\n"} isStreaming={true} />,
    );
    await settle(1);
    expect(stripAnsi(instance.lastFrame() ?? "").split("\n")).not.toContain("…");
    instance.unmount();
  });
});
