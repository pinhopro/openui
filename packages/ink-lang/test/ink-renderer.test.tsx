import type { ActionEvent, OpenUIError, ParseResult } from "@openuidev/lang-core";
import { afterEach, describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { mouseDisableSequence, mouseEnableSequence } from "../src/mouse/mouse-mode";
import { DIM_ON, RED_ON, stripAnsi } from "./helpers/ansi";
import { fillerRows, fillerText } from "./helpers/filler-rows";
import {
  clicks,
  makeInkTestLibrary,
  probe,
  resetInkTestLibrary,
  setters,
} from "./helpers/ink-test-library";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

afterEach(resetInkTestLibrary);

describe("InkRenderer", () => {
  it("renders the evaluated program", async () => {
    const rendered = await renderProgram(
      makeInkTestLibrary(),
      '$count = 2\nroot = Stack([Title("Count: " + $count)])',
    );
    expect(rendered.frame()).toContain("Count: 2");
    rendered.unmount();
  });

  it("shows a placeholder and a status line while streaming before the root exists", async () => {
    const rendered = await renderProgram(makeInkTestLibrary(), "root = Sta", {
      isStreaming: true,
    });
    const lines = stripAnsi(rendered.frame()).split("\n");
    expect(lines).toContain("…");
    expect(rendered.frame()).toContain("streaming");
    rendered.unmount();
  });

  it("shows the placeholder while streaming even before the first chunk arrives", async () => {
    const rendered = await renderProgram(makeInkTestLibrary(), "", { isStreaming: true });
    expect(stripAnsi(rendered.frame()).split("\n")).toContain("…");
    rendered.unmount();
  });

  it("drops the placeholder once the root renders and the status line when streaming ends", async () => {
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack([Title("hi")])\n', {
      isStreaming: true,
    });
    expect(stripAnsi(rendered.frame()).split("\n")).not.toContain("…");
    expect(rendered.frame()).toContain("streaming");
    await rendered.update({ isStreaming: false });
    expect(rendered.frame()).not.toContain("streaming");
    expect(rendered.frame()).toContain("hi");
    rendered.unmount();
  });

  it("calls onParseResult with the raw parse result", async () => {
    const results: Array<ParseResult | null> = [];
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack([Title("hi")])', {
      onParseResult: function onParseResult(result) {
        results.push(result);
      },
    });
    const last = results[results.length - 1];
    expect(last?.root?.typeName).toBe("Stack");
    expect(last?.meta.statementCount).toBe(1);
    rendered.unmount();
  });

  it("reports parser errors through onError after streaming and clears them on a new stream", async () => {
    const reports: OpenUIError[][] = [];
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack([Ghost("x")])', {
      onError: function onError(errors) {
        reports.push(errors);
      },
    });
    const settled = reports[reports.length - 1] ?? [];
    expect(settled).toContainEqual(expect.objectContaining({ code: "unknown-component" }));
    expect(stripAnsi(rendered.frame())).not.toContain("unknown-component");
    await rendered.update({ isStreaming: true });
    expect(reports[reports.length - 1]).toEqual([]);
    rendered.unmount();
  });

  it("draws the errors in the frame when the host passes no onError", async () => {
    const rendered = await renderProgram(makeInkTestLibrary(), 'root = Stack([Ghost("x")])');
    const plain = stripAnsi(rendered.frame());
    expect(plain).toMatch(/parser\/unknown-component: /);
    const footerLine = rendered
      .frame()
      .split("\n")
      .find(function isFooter(line) {
        return stripAnsi(line).startsWith("parser/unknown-component");
      });
    expect(footerLine).toContain(RED_ON);
    expect(footerLine).toContain(DIM_ON);
    rendered.unmount();
  });

  it("initializes $variables from their declarations and re-renders on store changes", async () => {
    const snapshots: Array<Record<string, unknown>> = [];
    const rendered = await renderProgram(
      makeInkTestLibrary(),
      '$q = "x"\nroot = Stack([f, Title("You typed: " + $q)])\nf = Field("q", $q)',
      {
        onStateUpdate: function onStateUpdate(state) {
          snapshots.push(state);
        },
      },
    );
    expect(rendered.frame()).toContain("You typed: x");
    expect(snapshots).toEqual([]);
    const setter = setters.get("q");
    expect(setter).toBeDefined();
    setter?.("late");
    await settle();
    expect(rendered.frame()).toContain("You typed: late");
    expect(probe.context).toBeNull();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({ $q: "late" });
    rendered.unmount();
  });

  it("runs queries only after streaming ends, showing defaults while loading", async () => {
    const calls: string[] = [];
    let release: () => void = function noop() {};
    const gate = new Promise<void>(function hold(resolve) {
      release = resolve;
    });
    const tools = {
      stats: async function stats() {
        calls.push("stats");
        await gate;
        return { total: 5 };
      },
    };
    const program =
      'root = Stack([Title("Rows: " + data.total)])\ndata = Query("stats", {}, {total: 0})';
    const rendered = await renderProgram(makeInkTestLibrary(), program, {
      isStreaming: true,
      toolProvider: tools,
    });
    expect(calls).toEqual([]);
    await rendered.update({ isStreaming: false });
    expect(calls).toEqual(["stats"]);
    expect(rendered.frame()).toContain("Rows: 0");
    expect(rendered.frame()).toContain("loading");
    release();
    await settle();
    expect(rendered.frame()).toContain("Rows: 5");
    expect(rendered.frame()).not.toContain("loading");
    rendered.unmount();
  });

  it("delivers button actions to onAction", async () => {
    const events: ActionEvent[] = [];
    const rendered = await renderProgram(
      makeInkTestLibrary(),
      'root = Stack([b])\nb = Button("Go", @ToAssistant("Explain"))',
      {
        onAction: function onAction(event) {
          events.push(event);
        },
      },
    );
    const click = clicks.get("b");
    expect(click).toBeDefined();
    await click?.();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("continue_conversation");
    expect(events[0]?.humanFriendlyMessage).toBe("Explain");
    rendered.unmount();
  });

  it("turns mouse reporting on only when the mouse prop is set", async () => {
    const program = 'root = Stack([Title("Hi")])';
    const silent = await renderProgram(makeInkTestLibrary(), program);
    expect(silent.instance.stdout.frames).not.toContain(mouseEnableSequence(true));
    silent.unmount();

    const full = await renderProgram(makeInkTestLibrary(), program, { mouse: true });
    expect(full.instance.stdout.frames).toContain(mouseEnableSequence(true));
    expect(full.frame()).toContain("Hi");
    full.unmount();
    expect(full.instance.stdout.frames).toContain(mouseDisableSequence(true));

    const still = await renderProgram(makeInkTestLibrary(), program, { mouse: { motion: false } });
    expect(still.instance.stdout.frames).toContain(mouseEnableSequence(false));
    still.unmount();
  });

  describe("dim behind a modal", () => {
    /** A text row, a ModalDialog bound to `$open` and filler rows the dialog floats over. */
    function dimProgram(open: boolean): string {
      return [
        `$open = ${open}`,
        `root = Stack([TextContent("row above the dialog"), dialog, ${fillerRows(10)}], "column", "none")`,
        'dialog = ModalDialog("info", "Saved notice", "Your changes are safe.", null, "OK", $open)',
      ].join("\n");
    }

    /** The raw line of the frame whose plain text contains `text`. */
    function rawLine(frame: string, text: string): string {
      const line = frame.split("\n").find(function has(candidate) {
        return stripAnsi(candidate).includes(text);
      });
      if (line === undefined) throw new Error(`no line with ${text}`);
      return line;
    }

    /** The raw text of a line between the dialog's left and right borders. */
    function insideBorders(line: string): string {
      return line.slice(line.indexOf("│"), line.lastIndexOf("│") + 1);
    }

    it("dims the page's text while a modal is open, not the dialog", async () => {
      const rendered = await renderProgram(inkLibrary, dimProgram(true));
      const frame = rendered.frame();
      expect(rawLine(frame, "row above the dialog")).toContain(DIM_ON);
      expect(rawLine(frame, fillerText(10))).toContain(DIM_ON);
      const titleLine = rawLine(frame, "Saved notice");
      expect(insideBorders(titleLine)).toContain("Saved notice");
      expect(insideBorders(titleLine)).not.toContain(DIM_ON);
      expect(insideBorders(rawLine(frame, "Your changes are safe."))).not.toContain(DIM_ON);
      rendered.unmount();
    });

    it("leaves the page undimmed with dimBehindModal false", async () => {
      const rendered = await renderProgram(inkLibrary, dimProgram(true), {
        dimBehindModal: false,
      });
      const frame = rendered.frame();
      expect(stripAnsi(frame)).toContain("Saved notice");
      expect(frame).not.toContain(DIM_ON);
      rendered.unmount();
    });

    it("leaves the page undimmed with no modal open, and undims it once the modal closes", async () => {
      const closed = await renderProgram(inkLibrary, dimProgram(false));
      expect(closed.frame()).not.toContain(DIM_ON);
      closed.unmount();

      const open = await renderProgram(inkLibrary, dimProgram(true));
      expect(rawLine(open.frame(), "row above the dialog")).toContain(DIM_ON);
      open.instance.stdin.write("\u001b");
      // Ink holds a lone Escape for 20ms in case a sequence follows.
      await settle(60);
      expect(stripAnsi(open.frame())).not.toContain("Saved notice");
      expect(open.frame()).not.toContain(DIM_ON);
      open.unmount();
    });
  });
});
