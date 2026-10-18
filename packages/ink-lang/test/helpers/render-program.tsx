import { render } from "ink-testing-library";
import { InkRenderer, type InkRendererProps } from "../../src/ink-renderer";
import type { Library } from "../../src/library";
import { settle } from "./settle";

type Instance = ReturnType<typeof render>;

const MODE_SEQUENCES_ONLY = /^(\u001b\[\?\d+[hl])+$/;

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

  // Mode toggles (mouse reporting) go straight to stdout between frames; skip them.
  function frame(): string {
    const frames = instance.frames;
    for (let index = frames.length - 1; index >= 0; index -= 1) {
      const candidate = frames[index] ?? "";
      if (!MODE_SEQUENCES_ONLY.test(candidate)) return candidate;
    }
    return "";
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
