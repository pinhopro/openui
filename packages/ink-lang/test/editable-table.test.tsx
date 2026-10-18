import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { BOLD_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  "root = Stack([grid])",
  'grid = EditableTable("grid", [{type: "text", key: "name", header: "Name"}, {type: "number", key: "qty", header: "Qty"}, {type: "select", key: "status", header: "Status", options: [{value: "open", label: "Open"}, {value: "done", label: "Done"}]}], [{id: "r1", values: ["Pens", 2, "open"]}, {id: "r2", values: ["Ink", 10, "done"]}])',
].join("\n");

function lines(frame: string): string[] {
  const result: string[] = [];
  for (const line of stripAnsi(frame).split("\n")) result.push(line.trimEnd());
  return result;
}

async function renderGrid() {
  const snapshots: Array<Record<string, unknown>> = [];
  const rendered = await renderProgram(inkLibrary, program, {
    onStateUpdate: function onStateUpdate(state) {
      snapshots.push(state);
    },
  });
  return { rendered, snapshots };
}

describe("EditableTable", () => {
  it("draws a bold header, a rule and one line per row", async () => {
    const { rendered } = await renderGrid();
    const frame = rendered.frame();
    expect(lines(frame)).toEqual([
      "Name  Qty  Status",
      "─────────────────",
      "Pens    2  Open",
      "Ink    10  Done",
    ]);
    expect(frame.split("\n")[0]).toContain(BOLD_ON);
    rendered.unmount();
  });

  it("edits the focused cell and stores the rows under the table name", async () => {
    const { rendered, snapshots } = await renderGrid();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual([" "]);
    rendered.instance.stdin.write("!");
    await settle();
    // The focused cell keeps one extra cell for the cursor after the text.
    expect(lines(rendered.frame())[2]).toBe("Pens!     2  Open");
    expect(snapshots[snapshots.length - 1]).toEqual({
      grid: {
        value: [
          { id: "r1", values: ["Pens!", 2, "open"] },
          { id: "r2", values: ["Ink", 10, "done"] },
        ],
        componentType: undefined,
      },
    });
    rendered.unmount();
  });

  it("moves between cells with Tab and stores numbers for number columns", async () => {
    const { rendered, snapshots } = await renderGrid();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write("5");
    await settle();
    const last = snapshots[snapshots.length - 1] as { grid: { value: unknown } };
    expect(last.grid.value).toEqual([
      { id: "r1", values: ["Pens", 25, "open"] },
      { id: "r2", values: ["Ink", 10, "done"] },
    ]);
    rendered.unmount();
  });

  it("cycles the options of a select cell with Down and Up", async () => {
    const { rendered, snapshots } = await renderGrid();
    for (let press = 0; press < 3; press += 1) {
      rendered.instance.stdin.write(KEYS.TAB);
      await settle();
    }
    expect(inverseSegments(rendered.frame())).toEqual(["Open"]);
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    expect(lines(rendered.frame())[2]).toBe("Pens    2  Done");
    const last = snapshots[snapshots.length - 1] as { grid: { value: unknown } };
    expect(last.grid.value).toEqual([
      { id: "r1", values: ["Pens", 2, "done"] },
      { id: "r2", values: ["Ink", 10, "done"] },
    ]);
    rendered.instance.stdin.write(KEYS.UP);
    await settle();
    expect(lines(rendered.frame())[2]).toBe("Pens    2  Open");
    rendered.unmount();
  });
});
