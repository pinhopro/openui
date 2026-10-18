import { useStdin, useStdout } from "ink";
import { createContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { measureTargets, targetsUnderCell } from "./hit-test";
import { createMouseDispatcher } from "./mouse-dispatcher";
import { mouseDisableSequence, mouseEnableSequence } from "./mouse-mode";
import type { MouseOptions } from "./mouse-options";
import { splitMouseSequences } from "./mouse-sequence";
import type { MouseTarget } from "./mouse-target";

/** What `useMouse` needs from the provider: a way to register a target. */
export interface MouseRegistry {
  register: (target: MouseTarget) => () => void;
}

export const MouseContext = createContext<MouseRegistry | null>(null);

export interface MouseProviderProps {
  options: MouseOptions;
  children: ReactNode;
}

/**
 * Turns the terminal's mouse reporting on while mounted, reads the SGR
 * reports Ink leaves on stdin, hit-tests them against the registered boxes
 * and calls their handlers. Layout coordinates match the terminal's only when
 * the app is rendered with `alternateScreen: true`.
 */
export function MouseProvider({ options, children }: MouseProviderProps) {
  const { stdin, setRawMode, isRawModeSupported } = useStdin();
  const { stdout } = useStdout();
  const targetsRef = useRef<Set<MouseTarget>>(new Set());
  const dispatcherRef = useRef(createMouseDispatcher());
  const motion = options.motion;

  const registry = useMemo<MouseRegistry>(function buildRegistry() {
    return {
      register: function register(target) {
        targetsRef.current.add(target);
        return function unregister() {
          targetsRef.current.delete(target);
          dispatcherRef.current.forget(target);
        };
      },
    };
  }, []);

  useEffect(
    function reportMouse() {
      if (!isRawModeSupported) return undefined;
      const dispatcher = dispatcherRef.current;
      let pending = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      function flushWheel(): void {
        flushTimer = null;
        dispatcher.flushWheel();
      }

      function handleData(chunk: unknown): void {
        const text = typeof chunk === "string" ? chunk : String(chunk);
        const split = splitMouseSequences(pending + text);
        pending = split.pending;
        if (split.events.length === 0) return;
        const measured = measureTargets(targetsRef.current);
        for (const event of split.events) {
          dispatcher.handle(event, targetsUnderCell(measured, event.x, event.y));
        }
        if (dispatcher.hasPendingWheel() && flushTimer === null) {
          flushTimer = setTimeout(flushWheel, 0);
        }
      }

      function disable(): void {
        stdout.write(mouseDisableSequence(motion));
      }

      setRawMode(true);
      stdout.write(mouseEnableSequence(motion));
      stdin.on("data", handleData);
      process.on("exit", disable);
      return function stopReporting() {
        process.off("exit", disable);
        stdin.off("data", handleData);
        if (flushTimer !== null) clearTimeout(flushTimer);
        disable();
        setRawMode(false);
      };
    },
    [isRawModeSupported, motion, setRawMode, stdin, stdout],
  );

  return <MouseContext.Provider value={registry}>{children}</MouseContext.Provider>;
}
