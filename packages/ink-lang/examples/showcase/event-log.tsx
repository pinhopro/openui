/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
import { useMouse } from "../../src/mouse/use-mouse";
import { fitLine } from "./host-log";

export interface EventLogProps {
  /** Oldest first; the log shows the newest unless scrolled back. */
  entries: string[];
  /** Rows available for entries (the title and the border take three more). */
  height: number;
  columns: number;
}

interface LogView {
  /** True while the log shows the newest entries and moves with them. */
  following: boolean;
  /** The index of the first visible entry while not following. */
  start: number;
}

const TAIL: LogView = { following: true, start: 0 };

/**
 * The panel of UI events under the page. The wheel scrolls back through
 * older entries and the view stays put while new ones arrive; scrolling to
 * the bottom makes it follow the newest entries again.
 */
export function EventLog({ entries, height, columns }: EventLogProps) {
  const [view, setView] = useState<LogView>(TAIL);
  const boxRef = useRef<DOMElement | null>(null);
  const maxStart = Math.max(0, entries.length - height);
  const start = view.following ? maxStart : Math.min(view.start, maxStart);

  useMouse(boxRef, {
    onWheel: function handleWheel(event) {
      const up = event.direction === "up" || event.direction === "left";
      const next = up ? start - event.ticks : start + event.ticks;
      if (next >= maxStart) {
        setView(TAIL);
        return;
      }
      setView({ following: false, start: Math.max(0, next) });
    },
  });

  const lines: ReactNode[] = [];
  const shown = entries.slice(start, start + height);
  for (let index = 0; index < shown.length; index += 1) {
    const isNewest = view.following && index === shown.length - 1;
    lines.push(
      <Text key={start + index} dimColor={!isNewest}>
        {fitLine(shown[index] ?? "", columns - 4)}
      </Text>,
    );
  }
  const title =
    `Events (${entries.length})` +
    (view.following ? "" : `  from ${start + 1}, wheel down to follow`);
  return (
    <Box
      ref={boxRef}
      flexDirection="column"
      height={height + 3}
      flexShrink={0}
      borderStyle="single"
      borderDimColor
      paddingX={1}
      overflowY="hidden"
    >
      <Text bold>{title}</Text>
      {lines}
    </Box>
  );
}
