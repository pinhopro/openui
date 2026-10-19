import type { OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { showcasePages } from "../../examples/showcase/pages";
import { createShowcaseTools } from "../../examples/showcase/showcase-tools";
import { inkLibrary } from "../../src/default-library";
import { SUPPORTED_PROPERTIES } from "../../src/design/supported-properties";
import { stripAnsi } from "../helpers/ansi";
import { renderProgram } from "../helpers/render-program";
import { settle } from "../helpers/settle";

/** Legacy data-only components no signature of the React default library takes any more. */
const NOT_IN_ANY_SIGNATURE = ["Slice"];

/**
 * What the stylesheet of the CSS subset can address, besides properties: the
 * selector forms, the states, the table parts and the descendant forms. Each
 * must appear in some page's Theme(...) stylesheet.
 */
const SELECTOR_FEATURES = [
  "* {",
  ":focus",
  ":hover",
  ":pressed",
  ":disabled",
  ":cursor",
  "::placeholder",
  "Table thead",
  "Table tbody tr:odd",
  "tr:even",
  "tr:first",
  "tr:last",
  "Table th",
  "Table td",
  "td.number",
  "td.string",
  ".col-",
  "Table td Input",
  "Button.secondary",
  "Button.destructive",
  "FormControl .label",
  "FormControl .helper",
  "CardHeader .title",
  "CardHeader .subtitle",
  "Card.sunk",
  "Tooltip",
  "var(--",
];

/** Every string an enum of the library's JSON Schema admits, with the schema path it sits at. */
interface EnumValue {
  path: string;
  value: string;
}

function collectEnumValues(node: unknown, path: string, into: EnumValue[]): void {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (let index = 0; index < node.length; index += 1) {
      collectEnumValues(node[index], `${path}[${index}]`, into);
    }
    return;
  }
  const record = node as Record<string, unknown>;
  const options = record["enum"];
  if (Array.isArray(options)) {
    for (const option of options) {
      if (typeof option === "string") into.push({ path, value: option });
    }
  }
  for (const [key, value] of Object.entries(record)) {
    if (key === "enum" || key === "description") continue;
    collectEnumValues(value, `${path}.${key}`, into);
  }
}

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

  it("uses every enum value of every schema somewhere (sizes, variants, placements...)", () => {
    const programs = allPrograms();
    const found: EnumValue[] = [];
    collectEnumValues(inkLibrary.toJSONSchema(), "", found);
    expect(found.length).toBeGreaterThan(100);
    const missing: string[] = [];
    for (const entry of found) {
      if (!programs.includes(`"${entry.value}"`)) missing.push(`${entry.path} = ${entry.value}`);
    }
    expect(missing).toEqual([]);
  });

  it("writes every property of the CSS subset in some Theme(...) stylesheet", () => {
    const programs = allPrograms();
    const missing: string[] = [];
    for (const property of SUPPORTED_PROPERTIES) {
      if (!programs.includes(property + ":")) missing.push(property);
    }
    expect(missing).toEqual([]);
  });

  it("writes every selector feature of the CSS subset in some Theme(...) stylesheet", () => {
    const programs = allPrograms();
    const missing: string[] = [];
    for (const feature of SELECTOR_FEATURES) {
      if (!programs.includes(feature)) missing.push(feature);
    }
    expect(missing).toEqual([]);
  });

  for (const page of showcasePages) {
    it(`renders the "${page.title}" page without errors`, async () => {
      const reports: OpenUIError[][] = [];
      const rendered = await renderProgram(page.library ?? inkLibrary, page.program, {
        toolProvider: createShowcaseTools({ latencyMs: 0, healthFailsFirst: false }),
        onError: function onError(errors) {
          reports.push(errors);
        },
      });
      await settle(20);
      expect(reports[reports.length - 1] ?? []).toEqual([]);
      const plain = stripAnsi(rendered.frame());
      expect(plain.trim().length).toBeGreaterThan(0);
      // Pages that open with a CardHeader show their title; a product screen (the chat) has none.
      if (page.program.includes(`CardHeader("${page.title}"`)) expect(plain).toContain(page.title);
      rendered.unmount();
    });
  }
});
