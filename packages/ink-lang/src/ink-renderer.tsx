import type { ActionEvent, OpenUIError, ParseResult } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import { useEffect, useMemo, useRef } from "react";
import { OpenUIContext } from "./context";
import { ErrorFooter } from "./error-footer";
import type { Library } from "./library";
import { RenderNode } from "./render-node";
import { renderValue } from "./render-value";
import type { ToolProviderInput } from "./runtime/tool-provider";
import { resolveTheme, ThemeContext, type InkTheme } from "./theme";
import { useOpenUIRuntime } from "./use-openui-runtime";

export interface InkRendererProps {
  /** The accumulated OpenUI Lang response, or a stored message with protocol markers. */
  response: string | null;
  /** Component library from createLibrary(). */
  library: Library;
  /** True while the model is still streaming; disables interaction and defers queries. */
  isStreaming?: boolean;
  /** Receives every action a component fires (button presses, custom actions). */
  onAction?: (event: ActionEvent) => void;
  /** Receives the store snapshot after each user edit. */
  onStateUpdate?: (state: Record<string, unknown>) => void;
  /** State to restore: `$`-prefixed keys are bindings, other keys are form state. */
  initialState?: Record<string, unknown>;
  /** Receives the raw parse result whenever it changes. */
  onParseResult?: (result: ParseResult | null) => void;
  /** Function map or MCP client that serves Query() and Mutation() calls. */
  toolProvider?: ToolProviderInput;
  /** Receives the structured error list once streaming ends; without it, errors are drawn in the frame. */
  onError?: (errors: OpenUIError[]) => void;
  /** Colors for borders, headings, destructive buttons and hints; slots left out use the defaults. */
  theme?: Partial<InkTheme>;
}

/** Renders a streaming OpenUI Lang program in the terminal. */
export function InkRenderer(props: InkRendererProps) {
  const isStreaming = props.isStreaming ?? false;
  const runtime = useOpenUIRuntime({
    response: props.response,
    library: props.library,
    isStreaming,
    onAction: props.onAction,
    onStateUpdate: props.onStateUpdate,
    initialState: props.initialState,
    toolProvider: props.toolProvider,
    onError: props.onError,
    renderNode: renderValue,
  });

  const onParseResultRef = useRef(props.onParseResult);
  onParseResultRef.current = props.onParseResult;
  useEffect(
    function notifyParseResult() {
      onParseResultRef.current?.(runtime.parseResult);
    },
    [runtime.parseResult],
  );

  const theme = useMemo(
    function buildTheme() {
      return resolveTheme(props.theme);
    },
    [props.theme],
  );
  const showPlaceholder = isStreaming && runtime.root === null;
  const showErrors = props.onError === undefined && runtime.errors.length > 0;

  return (
    <OpenUIContext.Provider value={runtime.contextValue}>
      <ThemeContext.Provider value={theme}>
        <Box flexDirection="column">
          {runtime.root !== null ? <RenderNode node={runtime.root} /> : null}
          {showPlaceholder ? <Text dimColor>…</Text> : null}
          {isStreaming ? <Text dimColor>streaming…</Text> : null}
          {runtime.isQueryLoading ? <Text dimColor>loading…</Text> : null}
          {showErrors ? <ErrorFooter errors={runtime.errors} /> : null}
        </Box>
      </ThemeContext.Provider>
    </OpenUIContext.Provider>
  );
}
