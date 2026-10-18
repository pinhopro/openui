import { ToolNotFoundError } from "@openuidev/lang-core";
import { describe, expect, it } from "vitest";
import { createStableToolProvider, type ToolProviderInput } from "../../src/runtime/tool-provider";

describe("createStableToolProvider", () => {
  it("calls the matching function of a function map", async () => {
    const calls: unknown[] = [];
    const tools: ToolProviderInput = {
      listTickets: async function listTickets(args: Record<string, unknown>) {
        calls.push(args);
        return { rows: [1] };
      },
    };
    const provider = createStableToolProvider(function getInput() {
      return tools;
    });
    await expect(provider.callTool("listTickets", { status: "open" })).resolves.toEqual({
      rows: [1],
    });
    expect(calls).toEqual([{ status: "open" }]);
  });

  it("throws ToolNotFoundError with the available names for an unknown tool", async () => {
    const provider = createStableToolProvider(function getInput() {
      return { a: async function a() {}, b: async function b() {} };
    });
    const promise = provider.callTool("missing", {});
    await expect(promise).rejects.toBeInstanceOf(ToolNotFoundError);
    await expect(promise).rejects.toMatchObject({ availableTools: ["a", "b"] });
  });

  it("does not resolve inherited Object.prototype keys as tools", async () => {
    const provider = createStableToolProvider(function getInput() {
      return {
        listTickets: async function listTickets() {
          return [];
        },
      };
    });
    await expect(provider.callTool("constructor", {})).rejects.toBeInstanceOf(ToolNotFoundError);
    await expect(provider.callTool("toString", {})).rejects.toBeInstanceOf(ToolNotFoundError);
    await expect(provider.callTool("hasOwnProperty", {})).rejects.toBeInstanceOf(ToolNotFoundError);
  });

  it("unwraps the result of an MCP client", async () => {
    const client = {
      callTool: async function callTool(params: {
        name: string;
        arguments?: Record<string, unknown>;
      }) {
        return { content: [{ type: "text", text: JSON.stringify({ echoed: params.name }) }] };
      },
    };
    const provider = createStableToolProvider(function getInput() {
      return client;
    });
    await expect(provider.callTool("ping", {})).resolves.toEqual({ echoed: "ping" });
  });

  it("rejects when no provider is configured", async () => {
    const provider = createStableToolProvider(function getInput() {
      return null;
    });
    await expect(provider.callTool("x", {})).rejects.toThrow(/toolProvider is null/);
  });

  it("reads the latest input on every call", async () => {
    let current: ToolProviderInput = {
      one: async function one() {
        return 1;
      },
    };
    const provider = createStableToolProvider(function getInput() {
      return current;
    });
    await expect(provider.callTool("one", {})).resolves.toBe(1);
    current = {
      one: async function one() {
        return 2;
      },
    };
    await expect(provider.callTool("one", {})).resolves.toBe(2);
  });
});
