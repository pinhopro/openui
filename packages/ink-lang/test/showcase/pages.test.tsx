import type { OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { showcasePages } from "../../examples/showcase/pages";
import { createShowcaseTools } from "../../examples/showcase/showcase-tools";
import { inkLibrary } from "../../src/default-library";
import { stripAnsi } from "../helpers/ansi";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

/** Legacy data-only components no signature of the React default library takes any more. */
const NOT_IN_ANY_SIGNATURE = ["Slice"];

function allPrograms(): string {
  const programs: string[] = [];
  for (const page of showcasePages) {
    programs.push(page.program);
  }
  return programs.join("\n");
}

describe("showcase pages", () => {
  it("gives every page a unique id and a title", () => {
    const ids = new Set<string>();
    for (const page of showcasePages) {
      expect(page.title.length).toBeGreaterThan(0);
      expect(ids.has(page.id)).toBe(false);
      ids.add(page.id);
    }
    expect(showcasePages.length).toBeGreaterThanOrEqual(8);
  });

  it("uses every component of the library somewhere", () => {
    const programs = allPrograms();
    const missing: string[] = [];
    for (const name of Object.keys(inkLibrary.components)) {
      if (NOT_IN_ANY_SIGNATURE.includes(name)) continue;
      if (!programs.includes(name + "(")) missing.push(name);
    }
    expect(missing).toEqual([]);
  });

  for (const page of showcasePages) {
    it(`renders the "${page.title}" page without errors`, async () => {
      const reports: OpenUIError[][] = [];
      const rendered = await renderProgram(inkLibrary, page.program, {
        toolProvider: createShowcaseTools({ latencyMs: 0, healthFailsFirst: false }),
        onError: function onError(errors) {
          reports.push(errors);
        },
      });
      await settle(20);
      expect(reports[reports.length - 1] ?? []).toEqual([]);
      expect(stripAnsi(rendered.frame())).toContain(page.title);
      rendered.unmount();
    });
  }
});
