/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionEvent, OpenUIError } from "@openuidev/lang-core";
import {
  Box,
  measureElement,
  useApp,
  useFocusManager,
  useInput,
  useWindowSize,
  type DOMElement,
} from "ink";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { inkLibrary } from "../../src/default-library";
import { createDesignSystem } from "../../src/design/design-system";
import { elementRect } from "../../src/focus/element-rect";
import type { FocusStop } from "../../src/focus/focus-order";
import { FocusRegistryContext, type FocusEntry } from "../../src/focus/focus-registry";
import { FocusScope } from "../../src/focus/focus-scope";
import { InkRenderer } from "../../src/ink-renderer";
import type { Library } from "../../src/library";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import { useMouse } from "../../src/mouse/use-mouse";
import type { UiEvent } from "../../src/ui-events";
import { describeUiEvent } from "./event-line";
import { EventLog } from "./event-log";
import { describeAction, describeErrors, describeState } from "./host-log";
import type { ShowcasePage } from "./pages";
import { showcaseThemes, type ShowcaseTheme } from "./showcase-themes";
import type { ShowcaseTools } from "./showcase-tools";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { ThemeSelect } from "./theme-select";
import { useStreamedProgram, type StreamOptions } from "./use-streamed-program";

export interface ShowcaseAppProps {
  pages: ShowcasePage[];
  /** Serves the Query() and Mutation() calls of the pages. */
  tools: ShowcaseTools;
  /** Turns terminal mouse reporting on for the whole screen. */
  mouse: boolean;
  /** How fast each page streams in. */
  stream: StreamOptions;
}

const SIDEBAR_WIDTH = 26;
const WHEEL_ROWS = 3;
const ACCENT = "cyan";
const LOG_ROWS = 6;
const MAX_EVENTS = 300;

interface PaneHeights {
  viewport: number;
  content: number;
}

interface MouseScopeProps {
  enabled: boolean;
  children: ReactNode;
}

/** One provider for the whole screen, so the sidebar and the pages share it. */
function MouseScope({ enabled, children }: MouseScopeProps) {
  if (!enabled) return children;
  return <MouseProvider options={{ motion: true }}>{children}</MouseProvider>;
}

/** True when `element` sits inside `pane`. */
function isInsidePane(element: DOMElement, pane: DOMElement): boolean {
  let current: DOMElement | undefined = element;
  while (current !== undefined) {
    if (current === pane) return true;
    current = current.parentNode;
  }
  return false;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

interface PagePaneProps {
  pageId: string;
  response: string;
  isStreaming: boolean;
  library: Library;
  theme: ShowcaseTheme;
  /** The theme's app canvas color, painted behind the page. */
  canvas: string;
  tools: ShowcaseTools;
  onAction: (event: ActionEvent) => void;
  onStateUpdate: (state: Record<string, unknown>) => void;
  onError: (errors: OpenUIError[]) => void;
  onUiEvent: (event: UiEvent) => void;
}

/**
 * The scrollable pane the page streams into. It is its own component, mounted
 * inside the mouse scope, so its wheel handler can register with the provider.
 */
function PagePane({
  pageId,
  response,
  isStreaming,
  library,
  theme,
  canvas,
  tools,
  onAction,
  onStateUpdate,
  onError,
  onUiEvent,
}: PagePaneProps) {
  const [scroll, setScroll] = useState(0);
  const [heights, setHeights] = useState<PaneHeights>({ viewport: 0, content: 0 });
  const viewportRef = useRef<DOMElement | null>(null);
  const contentRef = useRef<DOMElement | null>(null);
  const registry = useContext(FocusRegistryContext);
  const manager = useFocusManager();

  // Back to the top whenever another page comes in.
  useEffect(
    function resetScroll() {
      setScroll(0);
    },
    [pageId],
  );

  // Measured after every render: the page grows while it streams.
  useEffect(function measurePane() {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (viewport === null || content === null) return;
    const viewportHeight = measureElement(viewport).clientHeight;
    const contentHeight = measureElement(content).height;
    setHeights(function keepIfSame(previous) {
      if (previous.viewport === viewportHeight && previous.content === contentHeight) {
        return previous;
      }
      return { viewport: viewportHeight, content: contentHeight };
    });
  });

  const maxScroll = Math.max(0, heights.content - heights.viewport);
  const pageStep = Math.max(1, heights.viewport - 2);

  function scrollBy(delta: number): void {
    setScroll(function move(previous) {
      return clamp(previous + delta, 0, maxScroll);
    });
  }

  // A stop that takes focus below or above the fold brings the pane to it.
  useEffect(
    function scrollFocusIntoView() {
      const viewport = viewportRef.current;
      if (registry === null || manager.activeId === undefined || viewport === null) return;
      const entry = registry.find(manager.activeId);
      if (entry === null || entry.ref.current === null) return;
      if (!isInsidePane(entry.ref.current, viewport)) return;
      const stop = elementRect(entry.ref.current);
      const frame = elementRect(viewport);
      const top = frame.y + 1;
      const bottom = frame.y + frame.height - 2;
      const stopBottom = stop.y + stop.height - 1;
      if (stop.y < top) scrollBy(stop.y - top);
      else if (stopBottom > bottom) scrollBy(Math.min(stopBottom - bottom, stop.y - top));
    },
    // Only a focus change moves the pane; the scroll itself must not re-trigger it.
    [manager.activeId],
  );

  useInput(function handleScrollKey(_input, key) {
    if (key.eventType === "release") return;
    if (key.pageDown) scrollBy(pageStep);
    if (key.pageUp) scrollBy(-pageStep);
  });

  useMouse(viewportRef, {
    onWheel: function handleWheel(event) {
      const rowsMoved = event.ticks * WHEEL_ROWS;
      scrollBy(event.direction === "up" || event.direction === "left" ? -rowsMoved : rowsMoved);
    },
  });

  return (
    <Box
      ref={viewportRef}
      flexDirection="column"
      flexGrow={1}
      borderStyle="round"
      borderColor={ACCENT}
      paddingX={1}
      overflowY="hidden"
      backgroundColor={canvas === "" ? undefined : canvas}
      contentOffsetY={clamp(scroll, 0, maxScroll)}
    >
      <Box ref={contentRef} flexDirection="column" flexShrink={0}>
        <InkRenderer
          response={response}
          library={library}
          isStreaming={isStreaming}
          designSystem={theme.designSystem}
          onAction={onAction}
          onStateUpdate={onStateUpdate}
          onError={onError}
          onUiEvent={onUiEvent}
          toolProvider={tools}
        />
      </Box>
    </Box>
  );
}

/** The Tab cycle of the showcase: the sidebar, the theme select, then the page. */
function showcaseCycle(program: FocusStop[], host: FocusEntry[]): string[] {
  const ids: string[] = [];
  for (const component of ["Sidebar", "ThemeSelect"]) {
    for (const entry of host) {
      if (entry.component === component) ids.push(entry.id);
    }
  }
  for (const stop of program) ids.push(stop.id);
  return ids;
}

/**
 * The full-screen showcase: a sidebar of pages on the left, the active page
 * streaming into InkRenderer on the right, and a status bar with the key
 * help and the last thing the host received.
 */
export function ShowcaseApp({ pages, tools, mouse, stream }: ShowcaseAppProps) {
  const { columns, rows } = useWindowSize();
  const app = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const page = pages[activeIndex];
  const program = page === undefined ? "" : page.program;
  const streamed = useStreamedProgram(program, stream);
  const [lastAction, setLastAction] = useState("none yet");
  const [state, setState] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<OpenUIError[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [themeIndex, setThemeIndex] = useState(0);
  const theme = showcaseThemes[themeIndex] ?? (showcaseThemes[0] as ShowcaseTheme);
  // The app canvas color of the theme paints the page pane.
  const canvas = createDesignSystem(theme.designSystem).tokens.color.semantic.canvas.app;

  function cycleTheme(delta: number): void {
    setThemeIndex(function move(previous) {
      const count = showcaseThemes.length;
      return (previous + delta + count) % count;
    });
  }

  function onUiEvent(event: UiEvent): void {
    setEvents(function append(previous) {
      const next = previous.concat(describeUiEvent(event));
      if (next.length <= MAX_EVENTS) return next;
      return next.slice(next.length - MAX_EVENTS);
    });
  }

  function selectPage(index: number): void {
    const next = clamp(index, 0, pages.length - 1);
    if (next === activeIndex) return;
    setActiveIndex(next);
    setState({});
    setErrors([]);
  }

  useInput(function handleGlobalKey(input, key) {
    if (key.eventType === "release") return;
    if (key.ctrl && input === "n") selectPage(activeIndex + 1);
    if (key.ctrl && input === "p") selectPage(activeIndex - 1);
    if (key.ctrl && input === "q") app.exit();
    if (key.ctrl && input === "t") cycleTheme(1);
  });

  function onAction(event: ActionEvent): void {
    setLastAction(describeAction(event));
  }

  return (
    <MouseScope enabled={mouse}>
      <FocusScope onUiEvent={onUiEvent} order={showcaseCycle}>
        <Box flexDirection="column" width={columns} height={rows}>
          <Box flexGrow={1} minHeight={0}>
            <Box
              flexDirection="column"
              width={SIDEBAR_WIDTH}
              flexShrink={0}
              borderStyle="single"
              borderDimColor
            >
              <Sidebar
                pages={pages}
                activeIndex={activeIndex}
                onSelect={selectPage}
                width={SIDEBAR_WIDTH - 2}
              />
              <Box paddingX={1}>
                <ThemeSelect
                  themes={showcaseThemes}
                  activeIndex={themeIndex}
                  onSelect={setThemeIndex}
                  width={SIDEBAR_WIDTH - 5}
                />
              </Box>
            </Box>
            <Box flexDirection="column" flexGrow={1} minWidth={0}>
              <PagePane
                pageId={page === undefined ? "" : page.id}
                response={streamed.response}
                isStreaming={streamed.isStreaming}
                library={page === undefined ? inkLibrary : (page.library ?? inkLibrary)}
                theme={theme}
                canvas={canvas}
                tools={tools}
                onAction={onAction}
                onStateUpdate={setState}
                onError={setErrors}
                onUiEvent={onUiEvent}
              />
              <EventLog entries={events} height={LOG_ROWS} columns={columns - SIDEBAR_WIDTH} />
            </Box>
          </Box>
          <StatusBar
            columns={columns}
            mouse={mouse}
            lastAction={lastAction}
            state={describeState(state)}
            errors={describeErrors(errors)}
          />
        </Box>
      </FocusScope>
    </MouseScope>
  );
}
