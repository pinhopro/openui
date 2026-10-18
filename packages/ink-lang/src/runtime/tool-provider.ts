import {
  extractToolResult,
  ToolNotFoundError,
  type McpClientLike,
  type ToolProvider,
} from "@openuidev/lang-core";

export type ToolFunction = (args: Record<string, unknown>) => Promise<unknown>;

export type ToolFunctionMap = Record<string, ToolFunction>;

/** What a host may pass as `toolProvider`: a function map, an MCP client, or nothing. */
export type ToolProviderInput = ToolFunctionMap | McpClientLike | null | undefined;

export function isMcpClient(input: ToolFunctionMap | McpClientLike): input is McpClientLike {
  const candidate = input as { callTool?: unknown };
  return typeof candidate.callTool === "function";
}

/**
 * A ToolProvider whose identity never changes. It reads the host's current
 * input on every call, so the query manager is created once and still observes
 * provider swaps.
 */
export function createStableToolProvider(getInput: () => ToolProviderInput): ToolProvider {
  async function callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const current = getInput();
    if (current === null || current === undefined) {
      throw new Error("[openui] toolProvider is null");
    }
    if (isMcpClient(current)) {
      const envelope = await current.callTool({ name: toolName, arguments: args });
      return extractToolResult(envelope);
    }
    const fn = Object.hasOwn(current, toolName) ? current[toolName] : undefined;
    if (typeof fn !== "function") throw new ToolNotFoundError(toolName, Object.keys(current));
    return fn(args);
  }

  return { callTool };
}
