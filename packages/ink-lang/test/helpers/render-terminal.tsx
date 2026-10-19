import { render as inkRender } from "ink";
import { EventEmitter } from "node:events";
import type { ReactNode } from "react";

/** A terminal's output stream of a given width that keeps every frame Ink writes. */
class TerminalStdout extends EventEmitter {
  columns: number;
  rows = 40;
  frames: string[] = [];

  constructor(columns: number) {
    super();
    this.columns = columns;
  }

  write = (frame: string): boolean => {
    this.frames.push(frame);
    return true;
  };
}

/** A terminal's input stream: `write` delivers bytes as if typed. */
class TerminalStdin extends EventEmitter {
  isTTY = true;
  private data: string | null = null;

  write = (data: string): void => {
    this.data = data;
    this.emit("readable");
    this.emit("data", data);
  };

  read = (): string | null => {
    const data = this.data;
    this.data = null;
    return data;
  };

  setEncoding(): void {}
  setRawMode(): void {}
  resume(): void {}
  pause(): void {}
  ref(): void {}
  unref(): void {}
}

export interface RenderedTerminal {
  stdin: TerminalStdin;
  /** Every frame written so far, oldest first. */
  frames: string[];
  lastFrame: () => string;
  /** Changes the terminal's width and tells Ink, as a real terminal resize does. */
  resize: (columns: number) => void;
  rerender: (tree: ReactNode) => void;
  unmount: () => void;
}

/**
 * Renders `tree` the way a real terminal runs it, unlike ink-testing-library:
 * Ink is interactive, so it follows `resize` events of its stdout (it lays the
 * tree out again and notifies its layout listeners) and lays out at `columns`.
 * Frames are written whole on every render (debug mode), as in
 * ink-testing-library.
 */
export function renderTerminal(tree: ReactNode, columns = 100): RenderedTerminal {
  const stdout = new TerminalStdout(columns);
  const stdin = new TerminalStdin();
  const stderr = new TerminalStdout(columns);
  const instance = inkRender(tree, {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stderr: stderr as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    debug: true,
    interactive: true,
    exitOnCtrlC: false,
    patchConsole: false,
  });

  function lastFrame(): string {
    return stdout.frames[stdout.frames.length - 1] ?? "";
  }

  function resize(nextColumns: number): void {
    stdout.columns = nextColumns;
    stdout.emit("resize");
  }

  function rerender(next: ReactNode): void {
    instance.rerender(next);
  }

  function unmount(): void {
    instance.unmount();
    instance.cleanup();
  }

  return { stdin, frames: stdout.frames, lastFrame, resize, rerender, unmount };
}
