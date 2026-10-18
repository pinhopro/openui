/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef, type ReactNode } from "react";
import { useFocusable } from "../../src/focus/use-focusable";
import { useMouse } from "../../src/mouse/use-mouse";

export interface SidebarEntry {
  id: string;
  title: string;
}

export interface SidebarProps {
  pages: SidebarEntry[];
  activeIndex: number;
  onSelect: (index: number) => void;
  width: number;
}

const ACTIVE_MARK = "▸ ";
const INACTIVE_MARK = "  ";
const ACCENT = "cyan";

interface SidebarRowProps {
  page: SidebarEntry;
  index: number;
  isActive: boolean;
  isFocused: boolean;
  onSelect: (index: number) => void;
}

/** One page of the sidebar; a click selects it. */
function SidebarRow({ page, index, isActive, isFocused, onSelect }: SidebarRowProps) {
  const rowRef = useRef<DOMElement | null>(null);
  useMouse(rowRef, {
    onClick: function handleClick() {
      onSelect(index);
    },
  });
  const mark = isActive ? ACTIVE_MARK : INACTIVE_MARK;
  return (
    <Box ref={rowRef}>
      <Text color={isActive ? ACCENT : undefined} bold={isActive} inverse={isActive && isFocused}>
        {mark + page.title}
      </Text>
    </Box>
  );
}

/**
 * The page list on the left: one focus stop where Up and Down change the
 * page (and leave the list at its ends, so the arrows reach the panels
 * around it); a click picks a page and the wheel moves through them.
 */
export function Sidebar({ pages, activeIndex, onSelect, width }: SidebarProps) {
  function move(delta: number): void {
    const next = activeIndex + delta;
    if (next < 0 || next >= pages.length || next === activeIndex) return;
    onSelect(next);
  }

  const focus = useFocusable({
    isActive: true,
    autoFocus: true,
    component: "Sidebar",
    name: "pages",
    arrows: function claims(direction) {
      if (direction === "up") return activeIndex > 0;
      if (direction === "down") return activeIndex < pages.length - 1;
      return false;
    },
    mouse: {
      onWheel: function handleWheel(event) {
        move(event.direction === "up" || event.direction === "left" ? -event.ticks : event.ticks);
      },
    },
  });

  useInput(
    function handleSidebarKey(_input, key) {
      if (key.eventType === "release") return;
      if (key.upArrow) move(-1);
      if (key.downArrow) move(1);
    },
    { isActive: focus.isFocused },
  );

  const rows: ReactNode[] = [];
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index] as SidebarEntry;
    rows.push(
      <SidebarRow
        key={page.id}
        page={page}
        index={index}
        isActive={index === activeIndex}
        isFocused={focus.isFocused}
        onSelect={onSelect}
      />,
    );
  }

  return (
    <Box ref={focus.ref} flexDirection="column" width={width} paddingX={1}>
      <Text bold color={ACCENT}>
        OpenUI Ink
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {rows}
      </Box>
    </Box>
  );
}
