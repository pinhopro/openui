import type { OpenUIError } from "@openuidev/lang-core";
import { Box, Text } from "ink";
import type { ReactNode } from "react";

export interface ErrorFooterProps {
  errors: OpenUIError[];
}

/** One line per error, drawn under the program when the host passes no onError. */
export function ErrorFooter({ errors }: ErrorFooterProps) {
  const lines: ReactNode[] = [];
  for (let index = 0; index < errors.length; index += 1) {
    const error = errors[index];
    if (error === undefined) continue;
    lines.push(
      <Text key={index} color="red" dimColor>
        {error.source}/{error.code}: {error.message}
      </Text>,
    );
  }
  return <Box flexDirection="column">{lines}</Box>;
}
