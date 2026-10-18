import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { CodeBlockSchema } from "../schemas/code-block-schema";
import { displayText } from "./pad";

type CodeBlockProps = z.infer<typeof CodeBlockSchema>;

/** A single-line box: the dim language label, then every code line exactly as written. */
function CodeBlockRenderer({ props }: ComponentRenderProps<CodeBlockProps>) {
  const language = displayText(props.language);
  const code = displayText(props.codeString);
  const lines: ReactNode[] = [];
  const codeLines = code.split("\n");
  for (let index = 0; index < codeLines.length; index += 1) {
    lines.push(
      <Text key={index} wrap="truncate-end">
        {codeLines[index] === "" ? " " : codeLines[index]}
      </Text>,
    );
  }
  return (
    <Box flexDirection="column" borderStyle="single" borderDimColor paddingX={1}>
      {language === "" ? null : <Text dimColor>{language}</Text>}
      {lines}
    </Box>
  );
}

export const CodeBlock = defineComponent({
  name: "CodeBlock",
  props: CodeBlockSchema,
  description: "Syntax-highlighted code block",
  component: CodeBlockRenderer,
});
