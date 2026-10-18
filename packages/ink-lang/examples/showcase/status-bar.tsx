/** @jsxRuntime automatic @jsxImportSource react */
import { Box, Text } from "ink";
import { fitLine } from "./host-log";

export interface StatusBarProps {
  /** Terminal width, so the lines never wrap. */
  columns: number;
  mouse: boolean;
  /** The last action the host received, already described. */
  lastAction: string;
  /** The last store snapshot, already described. */
  state: string;
  /** The current error list, one line, or an empty string. */
  errors: string;
}

const KEY_HELP = "Ctrl+N / Ctrl+P pages  Tab focus  Enter press  PgUp / PgDn scroll  Ctrl+Q quit";

/** The two lines at the bottom: the key help and what the host last received. */
export function StatusBar({ columns, mouse, lastAction, state, errors }: StatusBarProps) {
  const help = KEY_HELP + (mouse ? "  mouse on (hold Shift to select text)" : "  mouse off");
  const detail =
    errors === "" ? "action: " + lastAction + "  state: " + state : "errors: " + errors;
  return (
    <Box flexDirection="column" paddingX={1} flexShrink={0}>
      <Text dimColor>{fitLine(help, columns - 2)}</Text>
      <Text color={errors === "" ? undefined : "red"} dimColor={errors === ""}>
        {fitLine(detail, columns - 2)}
      </Text>
    </Box>
  );
}
