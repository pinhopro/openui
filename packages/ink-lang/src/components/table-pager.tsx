import { Box, Text, useInput } from "ink";
import { useIsStreaming } from "../context";
import { pagerTextStyle } from "../focus/focus-style";
import { useFocusable } from "../focus/use-focusable";
import { useTheme } from "../theme";
import { textProps } from "../theme-styles";
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
  const theme = useTheme();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: label,
    mouse: {
      onClick: function handleClick() {
        if (disabled || isStreaming) return;
        onPress();
      },
    },
  });
  useInput(
    function handlePagerKey(input, key) {
      if (disabled || !isPressKey(input, key)) return;
      onPress();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  const style = textProps(
    pagerTextStyle(focusable.isFocused, disabled || isStreaming, theme.button),
  );
  return (
    <Box ref={focusable.ref}>
      <Text {...style}>[ {label} ]</Text>
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
