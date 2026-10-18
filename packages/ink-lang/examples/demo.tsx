/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionEvent, OpenUIError } from "@openuidev/lang-core";
import { Box, render, Text, useApp, useInput } from "ink";
import { useEffect, useState, type ReactNode } from "react";
import { inkLibrary } from "../src/default-library";
import { InkRenderer } from "../src/ink-renderer";
import { chunkProgram, demoProgram } from "./demo-program";

const CHUNK_SIZE = 6;
const CHUNK_INTERVAL_MS = 40;
// `--mouse` turns terminal mouse reporting on; the app then takes the alternate
// screen so Ink's layout cells line up with the terminal's.
const withMouse = process.argv.includes("--mouse");

function describeEvent(event: ActionEvent): string {
  const params = JSON.stringify(event.params);
  const state = JSON.stringify(event.formState ?? {});
  return `${event.type} "${event.humanFriendlyMessage}" params=${params} formState=${state}`;
}

function describeErrors(errors: OpenUIError[]): string {
  if (errors.length === 0) return "none";
  const lines: string[] = [];
  for (const error of errors) {
    lines.push(`${error.source}/${error.code}: ${error.message}`);
  }
  return lines.join("; ");
}

interface DemoProps {
  mouse: boolean;
}

/** Streams the mock response chunk by chunk into InkRenderer and logs what the host receives. */
function Demo({ mouse }: DemoProps) {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const [state, setState] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<string>("none");
  const app = useApp();

  useEffect(function streamProgram() {
    const chunks = chunkProgram(demoProgram, CHUNK_SIZE);
    let index = 0;
    const timer = setInterval(function pushChunk() {
      if (index >= chunks.length) {
        clearInterval(timer);
        setIsStreaming(false);
        return;
      }
      const chunk = chunks[index] ?? "";
      index += 1;
      setResponse(function append(previous) {
        return previous + chunk;
      });
    }, CHUNK_INTERVAL_MS);
    return function stopStreaming() {
      clearInterval(timer);
    };
  }, []);

  useInput(function handleGlobalKey(_input, key) {
    if (key.escape) app.exit();
  });

  function onAction(event: ActionEvent): void {
    setEvents(function append(previous) {
      return [...previous, describeEvent(event)];
    });
  }

  function onError(nextErrors: OpenUIError[]): void {
    setErrors(describeErrors(nextErrors));
  }

  const eventLines: ReactNode[] = [];
  for (let index = 0; index < events.length; index += 1) {
    eventLines.push(
      <Text key={index} color="green">
        onAction: {events[index]}
      </Text>,
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <InkRenderer
        response={response}
        library={inkLibrary}
        isStreaming={isStreaming}
        onAction={onAction}
        onStateUpdate={setState}
        onError={onError}
        mouse={mouse}
      />
      <Box flexDirection="column" marginTop={1} borderStyle="single" borderDimColor paddingX={1}>
        <Text dimColor>
          Tab / Shift+Tab move focus. Enter or Space presses a button or picks an option. Up / Down
          move through the select. Type into the field. Esc or Ctrl+C quits.
        </Text>
        <Text dimColor>
          {mouse
            ? "Mouse on: click buttons, tabs, options and fields; the wheel moves tabs and options. Hold Shift (or Option) to select text."
            : "Run with --mouse to click and scroll."}
        </Text>
        <Text dimColor>onStateUpdate: {JSON.stringify(state)}</Text>
        <Text dimColor>onError: {errors}</Text>
        {eventLines}
      </Box>
    </Box>
  );
}

render(<Demo mouse={withMouse} />, { alternateScreen: withMouse });
