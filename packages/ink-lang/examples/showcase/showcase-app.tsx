/** @jsxRuntime automatic @jsxImportSource react */
import type { ActionEvent, OpenUIError } from "@openuidev/lang-core";
import { Box, measureElement, useApp, useInput, useWindowSize, type DOMElement } from "ink";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { inkLibrary } from "../../src/default-library";
import { InkRenderer } from "../../src/ink-renderer";
import { MouseProvider } from "../../src/mouse/mouse-provider";
import { useMouse } from "../../src/mouse/use-mouse";
import { describeAction, describeErrors, describeState } from "./host-log";
import type { ShowcasePage } from "./pages";
import type { ShowcaseTools } from "./showcase-tools";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
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

const SIDEBAR_WIDTH = 20;
const WHEEL_ROWS = 3;
const ACCENT = "cyan";

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

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
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
  const [scroll, setScroll] = useState(0);
  const [heights, setHeights] = useState<PaneHeights>({ viewport: 0, content: 0 });
  const viewportRef = useRef<DOMElement | null>(null);
  const contentRef = useRef<DOMElement | null>(null);

  function selectPage(index: number): void {
    const next = clamp(index, 0, pages.length - 1);
    if (next === activeIndex) return;
    setActiveIndex(next);
    setScroll(0);
    setState({});
    setErrors([]);
  }

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

  useInput(function handleGlobalKey(input, key) {
    if (key.eventType === "release") return;
    if (key.ctrl && input === "n") selectPage(activeIndex + 1);
    if (key.ctrl && input === "p") selectPage(activeIndex - 1);
    if (key.ctrl && input === "q") app.exit();
    if (key.pageDown) scrollBy(pageStep);
    if (key.pageUp) scrollBy(-pageStep);
  });

  useMouse(viewportRef, {
    onWheel: function handleWheel(event) {
      const rowsMoved = event.ticks * WHEEL_ROWS;
      scrollBy(event.direction === "up" || event.direction === "left" ? -rowsMoved : rowsMoved);
    },
  });

  function onAction(event: ActionEvent): void {
    setLastAction(describeAction(event));
  }

  const safeScroll = clamp(scroll, 0, maxScroll);

  return (
    <MouseScope enabled={mouse}>
      <Box flexDirection="column" width={columns} height={rows}>
        <Box flexGrow={1} minHeight={0}>
          <Box flexDirection="column" width={SIDEBAR_WIDTH} borderStyle="single" borderDimColor>
            <Sidebar
              pages={pages}
              activeIndex={activeIndex}
              onSelect={selectPage}
              width={SIDEBAR_WIDTH - 2}
            />
          </Box>
          <Box
            ref={viewportRef}
            flexDirection="column"
            flexGrow={1}
            borderStyle="round"
            borderColor={ACCENT}
            paddingX={1}
            overflowY="hidden"
            contentOffsetY={safeScroll}
          >
            <Box ref={contentRef} flexDirection="column" flexShrink={0}>
              <InkRenderer
                response={streamed.response}
                library={inkLibrary}
                isStreaming={streamed.isStreaming}
                onAction={onAction}
                onStateUpdate={setState}
                onError={setErrors}
                toolProvider={tools}
              />
            </Box>
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
    </MouseScope>
  );
}
