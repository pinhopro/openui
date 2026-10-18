import type { ActionEvent, OpenUIError, ParseResult } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { OpenUIContext } from "./context";
import {
  createDesignSystem,
  defaultDesignSystem,
  type DesignSystemInput,
} from "./design/design-system";
import { DesignSystemContext } from "./design/design-system-context";
import { ErrorFooter } from "./error-footer";
import { ArrowNavigator } from "./focus/arrow-navigator";
import { createFocusRegistry, FocusRegistryContext } from "./focus/focus-registry";
import { KeyReporter } from "./focus/key-reporter";
import type { Library } from "./library";
import { resolveMouseOptions, type MouseOptions } from "./mouse/mouse-options";
import { MouseProvider } from "./mouse/mouse-provider";
import { QueryStatus } from "./query-status";
import { RenderNode } from "./render-node";
import { renderValue } from "./render-value";
import type { ToolProviderInput } from "./runtime/tool-provider";
import { mergeTheme, ThemeContext, type InkThemeOverrides } from "./theme";
import { UiEventContext, type UiEvent } from "./ui-events";
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
  /**
   * The palette (`accent`, `danger`...) and the CSS-like style slots
   * (`field`, `button`, `card`, `heading`, `subtext`, `focusRing`); anything
   * left out keeps the default, derived from the palette.
   */
  theme?: InkThemeOverrides;
  /**
   * A design system: tokens (primitive and semantic colors, spacing, grid,
   * typography, shape, light or dark mode) plus a stylesheet of the CSS
   * subset. The theme slots derive from it; `theme` merges over them.
   */
  designSystem?: DesignSystemInput;
  /**
   * Turns terminal mouse reporting on: clicks, hover and the wheel reach the
   * components. `true` reports every move; `{ motion: false }` reports presses
   * and drags only. Render the app with `alternateScreen: true` so layout cells
   * line up with the terminal's.
   */
  mouse?: boolean | Partial<MouseOptions>;
  /**
   * Receives the browser-like UI events of every component: focus and blur,
   * keydown and keyup, input and change, and the mouse events (mousedown,
   * mouseup, click, dblclick, contextmenu, mouseenter, mouseleave, mousemove,
   * wheel) when `mouse` is on.
   */
  onUiEvent?: (event: UiEvent) => void;
}

/** The palette colors of a theme as primitive tokens, so the cascade derives every slot from them. */
function paletteTokensOf(theme: InkThemeOverrides | undefined): Record<string, unknown> | null {
  if (theme === undefined) return null;
  const tokens: Record<string, unknown> = {};
  if (theme.accent !== undefined) tokens["color.primary"] = theme.accent;
  if (theme.danger !== undefined) tokens["color.error"] = theme.danger;
  if (theme.muted !== undefined) tokens["color.neutral"] = theme.muted;
  if (theme.success !== undefined) tokens["color.success"] = theme.success;
  if (theme.warning !== undefined) tokens["color.warning"] = theme.warning;
  return Object.keys(tokens).length === 0 ? null : tokens;
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

  const designSystem = useMemo(
    function buildDesignSystem() {
      const paletteTokens = paletteTokensOf(props.theme);
      if (props.designSystem === undefined && paletteTokens === null) return defaultDesignSystem;
      const input = props.designSystem ?? {};
      if (paletteTokens === null) return createDesignSystem(input);
      return createDesignSystem({
        ...input,
        tokens: { ...(input.tokens ?? {}), ...paletteTokens },
      });
    },
    [props.designSystem, props.theme],
  );
  const theme = useMemo(
    function buildTheme() {
      return mergeTheme(designSystem.theme, props.theme);
    },
    [designSystem, props.theme],
  );
  const mouseOptions = useMemo(
    function buildMouseOptions() {
      return resolveMouseOptions(props.mouse);
    },
    [props.mouse],
  );
  const onUiEventRef = useRef(props.onUiEvent);
  onUiEventRef.current = props.onUiEvent;
  const emitUiEvent = useCallback(function emitUiEvent(event: UiEvent) {
    onUiEventRef.current?.(event);
  }, []);
  const focusRegistry = useMemo(createFocusRegistry, []);
  const showPlaceholder = isStreaming && runtime.root === null;
  const showErrors = props.onError === undefined && runtime.errors.length > 0;

  const tree = (
    <Box flexDirection="column">
      <ArrowNavigator />
      <KeyReporter />
      {runtime.root !== null ? <RenderNode node={runtime.root} /> : null}
      {showPlaceholder ? <Text dimColor>…</Text> : null}
      {isStreaming ? <Text dimColor>streaming…</Text> : null}
      <QueryStatus
        isLoading={runtime.isQueryLoading}
        hasErrors={runtime.queryErrors.length > 0}
        isStreaming={isStreaming}
        onRetry={runtime.retryQueries}
      />
      {showErrors ? <ErrorFooter errors={runtime.errors} /> : null}
    </Box>
  );

  return (
    <OpenUIContext.Provider value={runtime.contextValue}>
      <ThemeContext.Provider value={theme}>
        <DesignSystemContext.Provider value={designSystem}>
          <UiEventContext.Provider value={emitUiEvent}>
            <FocusRegistryContext.Provider value={focusRegistry}>
              {mouseOptions === null ? (
                tree
              ) : (
                <MouseProvider options={mouseOptions}>{tree}</MouseProvider>
              )}
            </FocusRegistryContext.Provider>
          </UiEventContext.Provider>
        </DesignSystemContext.Provider>
      </ThemeContext.Provider>
    </OpenUIContext.Provider>
  );
}
