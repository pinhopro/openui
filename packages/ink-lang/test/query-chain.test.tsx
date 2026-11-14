import type { OpenUIError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { inkLibrary } from "../src/default-library";
import { stripAnsi } from "./helpers/ansi";
import { KEYS } from "./helpers/keys";
import { renderProgram } from "./helpers/render-program";
import { settle } from "./helpers/settle";

// OpenUI 1.1, language spec section 6.1: a query whose args read another query's result waits
// for it and runs again when it changes; queries that read each other never run (query-cycle);
// a `$state` reached through a referenced statement refetches when it changes.

describe("queries that read other queries (OpenUI 1.1)", () => {
  it("runs a query with another query's result once that query has one, in order", async () => {
    const calls: Array<{ tool: string; args: unknown }> = [];
    const tools = {
      user: async function user(args: unknown) {
        calls.push({ tool: "user", args });
        return { id: 42 };
      },
      orders: async function orders(args: unknown) {
        calls.push({ tool: "orders", args });
        return { count: 3 };
      },
    };
    const program = [
      'root = Stack([TextContent("Orders: " + orders.count)])',
      'user = Query("user", {}, {id: 0})',
      'orders = Query("orders", {userId: user.id}, {count: 0})',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program, { toolProvider: tools });
    await settle();
    expect(calls).toEqual([
      { tool: "user", args: {} },
      { tool: "orders", args: { userId: 42 } },
    ]);
    expect(stripAnsi(rendered.frame())).toContain("Orders: 3");
    rendered.unmount();
  });

  it("reports query-cycle and runs neither query when two read each other", async () => {
    const calls: string[] = [];
    const tools = {
      a: async function a() {
        calls.push("a");
        return { v: 1 };
      },
      b: async function b() {
        calls.push("b");
        return { v: 2 };
      },
    };
    const program = [
      'root = Stack([TextContent("A: " + a.v + " B: " + b.v)])',
      'a = Query("a", {from: b.v}, {v: 0})',
      'b = Query("b", {from: a.v}, {v: 0})',
    ].join("\n");
    const reports: OpenUIError[][] = [];
    const rendered = await renderProgram(inkLibrary, program, {
      toolProvider: tools,
      onError: function onError(errors) {
        reports.push(errors);
      },
    });
    await settle();
    expect(calls).toEqual([]);
    expect(stripAnsi(rendered.frame())).toContain("A: 0 B: 0");
    expect(reports[reports.length - 1]).toContainEqual(
      expect.objectContaining({ code: "query-cycle" }),
    );
    rendered.unmount();
  });

  it("refetches when a $state read through a referenced statement changes", async () => {
    const calls: unknown[] = [];
    const tools = {
      sales: async function sales(args: unknown) {
        calls.push(args);
        return { total: calls.length * 10 };
      },
    };
    const program = [
      '$region = "north"',
      "filters = {region: $region}",
      'root = Stack([TextContent("Total: " + data.total), Select("region", [SelectItem("north", "North"), SelectItem("south", "South")], null, null, $region)])',
      'data = Query("sales", filters, {total: 0})',
    ].join("\n");
    const rendered = await renderProgram(inkLibrary, program, { toolProvider: tools });
    await settle();
    expect(calls).toEqual([{ region: "north" }]);
    expect(stripAnsi(rendered.frame())).toContain("Total: 10");

    // Pick "South" in the select: Tab to it, Down to the second option, Enter.
    rendered.instance.stdin.write(KEYS.TAB);
    await settle();
    rendered.instance.stdin.write(KEYS.DOWN);
    await settle();
    rendered.instance.stdin.write(KEYS.ENTER);
    await settle();
    expect(calls).toEqual([{ region: "north" }, { region: "south" }]);
    expect(stripAnsi(rendered.frame())).toContain("Total: 20");
    rendered.unmount();
  });
});
