import type { OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

const program = [
  'root = Stack([TextContent("Rows: " + data.total)])',
  'data = Query("stats", {}, {total: 0})',
].join("\n");

describe("query status", () => {
  it("offers a retry button when a query fails and re-runs the query when pressed", async () => {
    let calls = 0;
    const tools = {
      stats: async function stats() {
        calls += 1;
        if (calls === 1) throw new Error("down");
        return { total: 5 };
      },
    };
    const reports: OpenUIError[][] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      toolProvider: tools,
      onError: function onError(errors) {
        reports.push(errors);
      },
    });
    await settle();
    expect(calls).toBe(1);
    const plain = stripAnsi(rendered.frame());
    expect(plain).toContain("Rows: 0");
    expect(plain).toContain("[ retry ]");
    expect(reports[reports.length - 1]).toContainEqual(
      expect.objectContaining({ source: "query", code: "tool-error" }),
    );

    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ retry ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(calls).toBe(2);
    const after = stripAnsi(rendered.frame());
    expect(after).toContain("Rows: 5");
    expect(after).not.toContain("[ retry ]");
    expect(reports[reports.length - 1]).toEqual([]);
    rendered.unmount();
  });

  it("shows no retry button while the query is still loading", async () => {
    let release: () => void = function noop() {};
    const gate = new Promise<void>(function hold(resolve) {
      release = resolve;
    });
    const tools = {
      stats: async function stats() {
        await gate;
        throw new Error("down");
      },
    };
    const rendered = await renderProgram(inkLibrary, program, { toolProvider: tools });
    expect(stripAnsi(rendered.frame())).toContain("loading");
    expect(stripAnsi(rendered.frame())).not.toContain("[ retry ]");
    release();
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("[ retry ]");
    expect(stripAnsi(rendered.frame())).not.toContain("loading");
    rendered.unmount();
  });
});
