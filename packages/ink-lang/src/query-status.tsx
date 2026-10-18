import { Box, Text, useAnimation, useInput } from "ink";
import { isPressKey } from "./components/button-keys";
import { buttonTextStyle } from "./focus/focus-style";
import { useFocusable } from "./focus/use-focusable";
import { useTheme } from "./theme";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;

export interface QueryStatusProps {
  isLoading: boolean;
  hasErrors: boolean;
  isStreaming: boolean;
  onRetry: () => void;
}

/** A spinner while queries load. */
function LoadingLine() {
  const animation = useAnimation({ interval: SPINNER_INTERVAL_MS });
  const glyph = SPINNER_FRAMES[animation.frame % SPINNER_FRAMES.length] ?? SPINNER_FRAMES[0];
  return <Text dimColor>{glyph} loading…</Text>;
}

interface RetryButtonProps {
  isStreaming: boolean;
  onRetry: () => void;
}

/** A focusable `[ retry ]` that re-runs the failed queries. */
function RetryButton({ isStreaming, onRetry }: RetryButtonProps) {
  const theme = useTheme();
  const focusable = useFocusable({
    isActive: !isStreaming,
    name: "retry",
    mouse: {
      onClick: function handleClick() {
        if (!isStreaming) onRetry();
      },
    },
  });
  useInput(
    function handleRetryKey(input, key) {
      if (!isPressKey(input, key)) return;
      onRetry();
    },
    { isActive: focusable.isFocused && !isStreaming },
  );
  const style = buttonTextStyle(focusable.isFocused, isStreaming, "secondary", undefined);
  return (
    <Box>
      <Box ref={focusable.ref}>
        <Text inverse={style.inverse} dimColor={style.dimColor} color={theme.danger}>
          [ retry ]
        </Text>
      </Box>
    </Box>
  );
}

/** The line under the program that reports query loading and failures. */
export function QueryStatus({ isLoading, hasErrors, isStreaming, onRetry }: QueryStatusProps) {
  if (isLoading) return <LoadingLine />;
  if (hasErrors) return <RetryButton isStreaming={isStreaming} onRetry={onRetry} />;
  return null;
}
