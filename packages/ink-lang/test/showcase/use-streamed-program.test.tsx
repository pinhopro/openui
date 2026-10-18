import { Text } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { useStreamedProgram } from "../../examples/showcase/use-streamed-program";
import { stripAnsi } from "../helpers/ansi";
import { settle } from "../helpers/settle";

interface ProbeProps {
  program: string;
}

function Probe({ program }: ProbeProps) {
  const stream = useStreamedProgram(program, { chunkSize: 4, intervalMs: 1 });
  return (
    <Text>
      {stream.isStreaming ? "streaming" : "done"}:{stream.response}
    </Text>
  );
}

describe("useStreamedProgram", () => {
  it("reveals the program chunk by chunk and ends with isStreaming false", async () => {
    const instance = render(<Probe program="abcdefghij" />);
    expect(stripAnsi(instance.lastFrame() ?? "")).toBe("streaming:");
    await settle(40);
    expect(stripAnsi(instance.lastFrame() ?? "")).toBe("done:abcdefghij");
    instance.unmount();
  });

  it("starts over when the program changes", async () => {
    const instance = render(<Probe program="first" />);
    await settle(40);
    expect(stripAnsi(instance.lastFrame() ?? "")).toBe("done:first");
    instance.rerender(<Probe program="second" />);
    await settle(1);
    expect(stripAnsi(instance.lastFrame() ?? "")).toMatch(/^streaming:/);
    await settle(40);
    expect(stripAnsi(instance.lastFrame() ?? "")).toBe("done:second");
    instance.unmount();
  });
});
