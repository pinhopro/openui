import { Box, Text, useInput, type DOMElement } from "ink";
import { useRef } from "react";
import { useIsStreaming } from "../context";
import { pagerTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useMouse } from "../mouse/use-mouse";
import { isPressKey } from "./button-keys";
import { pageSummary, type PageBounds } from "./table-paging";

interface PagerButtonProps {
  label: string;
  disabled: boolean;
  onPress: () => void;
}

/** A focusable `[ prev ]` / `[ next ]`; dim and inert at the end of the table. A click presses it. */
function PagerButton({ label, disabled, onPress }: PagerButtonProps) {
  const isStreaming = useIsStreaming();
  const focusable = useFocusable({ isActive: !isStreaming });
  const boxRef = useRef<DOMElement | null>(null);
  useInput(
    function handlePagerKey(input, key) {
      if (disabled || !isPressKey(input, key)) return;
      onPress();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  useMouse(boxRef, {
    onClick: function handleClick() {
      if (disabled || isStreaming) return;
      focusable.focus();
      onPress();
    },
  });
  const style = pagerTextStyle(focusable.isFocused, disabled || isStreaming);
  return (
    <Box ref={boxRef}>
      <Text inverse={style.inverse} dimColor={style.dimColor}>
        [ {label} ]
      </Text>
    </Box>
  );
}

export interface TablePagerProps {
  bounds: PageBounds;
  rowCount: number;
  /** Moves by whole pages; the table clamps and applies it from its latest state. */
  onStep: (delta: number) => void;
}

/** The footer of a paged table: the row range and the two pager controls. */
export function TablePager({ bounds, rowCount, onStep }: TablePagerProps) {
  function previousPage(): void {
    onStep(-1);
  }
  function nextPage(): void {
    onStep(1);
  }
  return (
    <Box flexDirection="row" gap={2}>
      <Text dimColor>{pageSummary(bounds, rowCount)}</Text>
      <PagerButton label="prev" disabled={bounds.page === 0} onPress={previousPage} />
      <PagerButton label="next" disabled={bounds.page >= bounds.pageCount - 1} onPress={nextPage} />
    </Box>
  );
}
