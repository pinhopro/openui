/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text, useFocus, useInput, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
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

/**
 * The theme select under the page list: a focus stop that shows the active
 * theme; Enter, Space or a click opens the list, Up and Down move, Enter
 * picks, Escape closes; the wheel cycles the themes while closed.
 */
export function ThemeSelect({ themes, activeIndex, onSelect, width }: ThemeSelectProps) {
  const focus = useFocus({ id: "showcase-theme" });
  const [isOpen, setOpen] = useState(false);
  const [cursor, setCursor] = useState(activeIndex);
  const boxRef = useRef<DOMElement | null>(null);
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

  useMouse(boxRef, {
    onClick: function handleClick() {
      if (isOpen) return;
      setCursor(activeIndex);
      setOpen(true);
    },
    onWheel: function handleWheel(event) {
      if (isOpen) return;
      cycle(event.direction === "up" || event.direction === "left" ? -1 : 1);
    },
  });

  const rows: ReactNode[] = [];
  if (isOpen) {
    for (let index = 0; index < themes.length; index += 1) {
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
  }
  return (
    <Box ref={boxRef} flexDirection="column" marginTop={1}>
      <Text dimColor={!focus.isFocused} inverse={focus.isFocused && !isOpen}>
        {fitLine(`Theme: ${active === undefined ? "" : active.name} ${isOpen ? "▴" : "▾"}`, width)}
      </Text>
      {isOpen ? (
        rows
      ) : (
        <Text dimColor>{fitLine(active === undefined ? "" : active.description, width)}</Text>
      )}
    </Box>
  );
}
