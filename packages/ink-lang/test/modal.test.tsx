import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "$show = false",
  'root = Stack([open, Modal("Confirm", $show, [TextContent("Are you sure?"), Buttons([Button("Yes", @ToAssistant("Yes"))])])])',
  'open = Button("Open", @Set($show, true))',
].join("\n");

describe("Modal", () => {
  it("renders nothing while the binding is false", async () => {
    const rendered = await renderProgram(inkLibrary, program);
    expect(stripAnsi(rendered.frame())).not.toContain("Confirm");
    rendered.unmount();
  });

  it("opens with the binding and closes from its close button", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(inkLibrary, program, {
      onStateUpdate: function onStateUpdate(state) {
        snapshots.push(state);
      },
    });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("╭");
    expect(plain).toContain("Confirm");
    expect(plain).toContain("[ x ]");
    expect(plain).toContain("Are you sure?");
    expect(plain).toContain("[ Yes ]");
    // Opening moves focus to the dialog's first stop.
    expect(inverseSegments(rendered.frame())).toEqual(["[ x ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).not.toContain("Confirm");
    expect(snapshots[snapshots.length - 1]).toEqual({ $show: false });
    rendered.unmount();
  });
});
