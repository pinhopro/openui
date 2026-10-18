import { render } from "ink-testing-library";
import { InkRenderer, type InkRendererProps } from "../../src/ink-renderer";
import type { Library } from "../../src/library";
import { settle } from "./settle";

type Instance = ReturnType<typeof render>;

export interface RenderedProgram {
  instance: Instance;
  frame: () => string;
  update: (next: Partial<InkRendererProps>) => Promise<void>;
  unmount: () => void;
}

/** Mounts an InkRenderer for a program and returns helpers to read frames and re-render. */
export async function renderProgram(
  library: Library,
  response: string | null,
  options: Partial<InkRendererProps> = {},
): Promise<RenderedProgram> {
  let current: InkRendererProps = { library, response, isStreaming: false, ...options };
  const instance = render(<InkRenderer {...current} />);
  await settle();

  function frame(): string {
    return instance.lastFrame() ?? "";
  }

  async function update(next: Partial<InkRendererProps>): Promise<void> {
    current = { ...current, ...next };
    instance.rerender(<InkRenderer {...current} />);
    await settle();
  }

  function unmount(): void {
    instance.unmount();
  }

  return { instance, frame, update, unmount };
}
