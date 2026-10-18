/**
 * The host side of the Feedback page: fake tools that serve its `Query()` and
 * `Mutation()` calls with a little latency, so the spinner and the retry
 * control have something to show.
 */

export interface ShowcaseToolOptions {
  /** How long every tool takes to answer. */
  latencyMs: number;
  /** When true, the `health` query fails on its first call and succeeds afterwards. */
  healthFailsFirst: boolean;
}

export type ShowcaseTools = Record<string, (args: unknown) => Promise<unknown>>;

function wait(ms: number): Promise<void> {
  return new Promise(function schedule(resolve) {
    setTimeout(resolve, ms);
  });
}

/** Builds the tool map the showcase passes to `InkRenderer` as `toolProvider`. */
export function createShowcaseTools(options: ShowcaseToolOptions): ShowcaseTools {
  let healthCalls = 0;
  let ticketCount = 0;

  async function stats(): Promise<unknown> {
    await wait(options.latencyMs);
    return { total: 1204331, p95: 87 };
  }

  async function health(): Promise<unknown> {
    await wait(options.latencyMs);
    healthCalls += 1;
    if (options.healthFailsFirst && healthCalls === 1) {
      throw new Error("upstream timed out");
    }
    return { status: "ok" };
  }

  async function createTicket(args: unknown): Promise<unknown> {
    await wait(options.latencyMs);
    ticketCount += 1;
    const title = readTitle(args);
    return { id: "TCK-" + String(100 + ticketCount), title };
  }

  return { stats, health, create_ticket: createTicket };
}

function readTitle(args: unknown): string {
  if (args === null || typeof args !== "object") return "";
  const record = args as Record<string, unknown>;
  const title = record["title"];
  return typeof title === "string" ? title : "";
}
