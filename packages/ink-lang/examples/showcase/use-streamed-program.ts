import { useEffect, useState } from "react";
import { chunkProgram } from "../demo-program";

export interface StreamOptions {
  /** Characters per chunk. */
  chunkSize: number;
  /** Milliseconds between chunks. */
  intervalMs: number;
}

export interface StreamedProgram {
  /** The part of the program revealed so far. */
  response: string;
  /** True until the last chunk has been appended. */
  isStreaming: boolean;
}

const EMPTY: StreamedProgram = { response: "", isStreaming: true };

/**
 * Reveals `program` chunk by chunk, the way a model response arrives, and
 * starts over whenever `program` changes.
 */
export function useStreamedProgram(program: string, options: StreamOptions): StreamedProgram {
  const [state, setState] = useState<StreamedProgram>(EMPTY);
  const { chunkSize, intervalMs } = options;

  useEffect(
    function streamProgram() {
      setState(EMPTY);
      const chunks = chunkProgram(program, chunkSize);
      let index = 0;
      const timer = setInterval(function pushChunk() {
        if (index >= chunks.length) {
          clearInterval(timer);
          setState(function finish(previous) {
            return { response: previous.response, isStreaming: false };
          });
          return;
        }
        const chunk = chunks[index] ?? "";
        index += 1;
        setState(function append(previous) {
          return { response: previous.response + chunk, isStreaming: true };
        });
      }, intervalMs);
      return function stopStreaming() {
        clearInterval(timer);
      };
    },
    [program, chunkSize, intervalMs],
  );

  return state;
}
