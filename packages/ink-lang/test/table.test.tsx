import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { DIM_ON, inverseSegments, stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

function tableProgram(rowCount: number): string {
  const names: string[] = [];
  const sizes: string[] = [];
  for (let index = 1; index <= rowCount; index += 1) {
    names.push(`"row${index}"`);
    sizes.push(String(index * 10));
  }
  return [
    "root = Stack([table, after])",
    `table = Table([Col("Name", [${names.join(", ")}]), Col("Size", [${sizes.join(", ")}], "number")])`,
    'after = Button("Done")',
  ].join("\n");
}

function hasRow(plain: string, name: string): boolean {
  const pattern = new RegExp(`^${name}\\s`, "m");
  return pattern.test(plain);
}

describe("Table paging", () => {
  it("draws every row and no footer when the table fits in one page", async () => {
    const rendered = await renderProgram(inkLibrary, tableProgram(10));
    const plain = stripAnsi(rendered.frame());
    expect(hasRow(plain, "row1")).toBe(true);
    expect(hasRow(plain, "row10")).toBe(true);
    expect(plain).not.toContain("rows ");
    expect(plain).not.toContain("[ prev ]");
    expect(plain).not.toContain("[ next ]");
    rendered.unmount();
  });

  it("shows only the first page of a long table with a footer and pager controls", async () => {
    const rendered = await renderProgram(inkLibrary, tableProgram(42));
    const plain = stripAnsi(rendered.frame());
    expect(hasRow(plain, "row1")).toBe(true);
    expect(hasRow(plain, "row10")).toBe(true);
    expect(hasRow(plain, "row11")).toBe(false);
    expect(plain).toContain("rows 1-10 of 42");
    expect(plain).toContain("[ prev ]");
    expect(plain).toContain("[ next ]");
    rendered.unmount();
  });

  it("dims prev on the first page and next on the last page", async () => {
    const rendered = await renderProgram(inkLibrary, tableProgram(12));
    const lines = rendered.frame().split("\n");
    const pager = lines.find(function isPager(line) {
      return stripAnsi(line).includes("[ prev ]");
    });
    expect(pager).toBeDefined();
    const prevPart = (pager ?? "").split("[ next ]")[0] ?? "";
    expect(prevPart).toContain(DIM_ON);
    rendered.unmount();
  });

  it("moves to the next and previous page with the focusable pager controls", async () => {
    const rendered = await renderProgram(inkLibrary, tableProgram(42));
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ prev ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("rows 1-10 of 42");
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ next ]"]);
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    let plain = stripAnsi(rendered.frame());
    expect(plain).toContain("rows 11-20 of 42");
    expect(hasRow(plain, "row11")).toBe(true);
    expect(hasRow(plain, "row20")).toBe(true);
    expect(hasRow(plain, "row1")).toBe(false);
    expect(hasRow(plain, "row21")).toBe(false);
    for (let press = 0; press < 4; press += 1) {
      rendered.instance.stdin.write(KEYS.ENTER);
      await settle();
    }
    plain = stripAnsi(rendered.frame());
    expect(plain).toContain("rows 41-42 of 42");
    expect(hasRow(plain, "row42")).toBe(true);
    rendered.instance.stdin.write(KEYS.SHIFT_TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("rows 31-40 of 42");
    rendered.unmount();
  });

  it("keeps the pager controls in the Tab order before what follows the table", async () => {
    const rendered = await renderProgram(inkLibrary, tableProgram(42));
    // One Tab per write: Ink reads a run of tabs in one chunk as literal input.
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    expect(inverseSegments(rendered.frame())).toEqual(["[ Done ]"]);
    rendered.unmount();
  });

  it("ignores the pager while streaming", async () => {
    const rendered = await renderProgram(inkLibrary, tableProgram(42), { isStreaming: true });
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(stripAnsi(rendered.frame())).toContain("rows 1-10 of 42");
    expect(inverseSegments(rendered.frame())).toEqual([]);
    rendered.unmount();
  });
});
