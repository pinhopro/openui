/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
import { useFocusable } from "../../src/focus/use-focusable";
import { useMouse } from "../../src/mouse/use-mouse";
import { fitLine } from "./host-log";
import type { ShowcaseTheme } from "./showcase-themes";

export interface ThemeSelectProps {
  themes: ShowcaseTheme[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Cells available, so the description never wraps. */
  width: number;
}

interface OptionRowProps {
  theme: ShowcaseTheme;
  index: number;
  isActive: boolean;
  isCursor: boolean;
  onPick: (index: number) => void;
}

/** One theme in the open list; a click picks it. */
function OptionRow({ theme, index, isActive, isCursor, onPick }: OptionRowProps) {
  const rowRef = useRef<DOMElement | null>(null);
  useMouse(rowRef, {
    onClick: function handleClick() {
      onPick(index);
    },
  });
  return (
    <Box ref={rowRef}>
      <Text>
        {(isActive ? "● " : "○ ") + " "}
        <Text inverse={isCursor}>{theme.name}</Text>
      </Text>
    </Box>
  );
}

/** How many themes the open list shows at once; it scrolls to keep the cursor in view. */
const VISIBLE_ROWS = 8;

interface ListWindow {
  start: number;
  end: number;
}

/** The slice of the list that keeps `cursor` visible, moving only when the cursor leaves it. */
export function listWindow(count: number, cursor: number, previousStart: number): ListWindow {
  const size = Math.min(VISIBLE_ROWS, count);
  let start = previousStart;
  if (cursor < start) start = cursor;
  if (cursor >= start + size) start = cursor - size + 1;
  start = Math.max(0, Math.min(start, count - size));
  return { start, end: start + size };
}

/**
 * The theme select under the page list: a focus stop that shows the active
 * theme; Enter, Space or a click opens the list, Up and Down move, Enter
 * picks, Escape closes; the wheel cycles the themes while closed. The open
 * list shows a window of the themes with "more" hints at the clipped ends.
 */
export function ThemeSelect({ themes, activeIndex, onSelect, width }: ThemeSelectProps) {
  const [isOpen, setOpen] = useState(false);
  const [cursor, setCursor] = useState(activeIndex);
  const windowStartRef = useRef(0);
  const active = themes[activeIndex];

  function pick(index: number): void {
    const next = Math.min(themes.length - 1, Math.max(0, index));
    onSelect(next);
    setCursor(next);
    setOpen(false);
  }

  function cycle(delta: number): void {
    const count = themes.length;
    pick((activeIndex + delta + count) % count);
  }

  // The arrows are ours only while the list is open and the cursor can still move.
  const focus = useFocusable({
    isActive: true,
    component: "ThemeSelect",
    name: "theme",
    arrows: function claims(direction) {
      if (!isOpen) return false;
      if (direction === "up") return cursor > 0;
      if (direction === "down") return cursor < themes.length - 1;
      return false;
    },
    mouse: {
      onClick: function handleClick() {
        if (isOpen) return;
        setCursor(activeIndex);
        setOpen(true);
      },
      onWheel: function handleWheel(event) {
        if (isOpen) return;
        cycle(event.direction === "up" || event.direction === "left" ? -1 : 1);
      },
    },
  });

  useInput(
    function handleKey(input, key) {
      if (key.eventType === "release") return;
      if (!isOpen) {
        if (key.return || input === " ") {
          setCursor(activeIndex);
          setOpen(true);
        }
        return;
      }
      if (key.escape) {
        setOpen(false);
        return;
      }
      if (key.upArrow) setCursor(Math.max(0, cursor - 1));
      if (key.downArrow) setCursor(Math.min(themes.length - 1, cursor + 1));
      if (key.return || input === " ") pick(cursor);
    },
    { isActive: focus.isFocused },
  );

  const rows: ReactNode[] = [];
  if (isOpen) {
    const window = listWindow(themes.length, cursor, windowStartRef.current);
    windowStartRef.current = window.start;
    if (window.start > 0) {
      rows.push(
        <Text key="above" dimColor>
          {`   ▴ ${window.start} more`}
        </Text>,
      );
    }
    for (let index = window.start; index < window.end; index += 1) {
      const theme = themes[index] as ShowcaseTheme;
      rows.push(
        <OptionRow
          key={theme.id}
          theme={theme}
          index={index}
          isActive={index === activeIndex}
          isCursor={index === cursor}
          onPick={pick}
        />,
      );
    }
    if (window.end < themes.length) {
      rows.push(
        <Text key="below" dimColor>
          {`   ▾ ${themes.length - window.end} more`}
        </Text>,
      );
    }
  }
  return (
    <Box ref={focus.ref} flexDirection="column" marginTop={1}>
      <Text dimColor>Theme</Text>
      <Text dimColor={!focus.isFocused} inverse={focus.isFocused && !isOpen}>
        {fitLine(`${active === undefined ? "" : active.name} ${isOpen ? "▴" : "▾"}`, width)}
      </Text>
      {isOpen ? (
        rows
      ) : (
        <Text dimColor>{fitLine(active === undefined ? "" : active.description, width)}</Text>
      )}
    </Box>
  );
}
