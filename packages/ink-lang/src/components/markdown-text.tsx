import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useTheme } from "../theme";
import { hasMarkdown, parseMarkdown, type MarkdownLine } from "./markdown";
import type { TextContentStyle } from "./text-content-style";

export interface MarkdownTextProps {
  text: string;
  style: TextContentStyle;
}

interface LineProps {
  line: MarkdownLine;
  style: TextContentStyle;
  codeColor: string;
}

function indentation(line: MarkdownLine): string {
  const spaces = "  ".repeat(line.indent);
  if (line.marker === undefined) return spaces;
  return `${spaces}${line.marker} `;
}

function MarkdownLineText({ line, style, codeColor }: LineProps) {
  if (line.kind === "blank") return <Text> </Text>;
  const segments: ReactNode[] = [];
  for (let index = 0; index < line.segments.length; index += 1) {
    const segment = line.segments[index];
    if (segment === undefined) continue;
    segments.push(
      <Text
        key={index}
        bold={segment.bold}
        italic={segment.italic}
        color={segment.code ? codeColor : undefined}
      >
        {segment.text}
      </Text>,
    );
  }
  return (
    <Text bold={style.bold} dimColor={style.dimColor} underline={style.underline}>
      {indentation(line)}
      {segments}
    </Text>
  );
}

/** The markdown subset (headings, lists, bold, italic, code, links) as Ink lines. */
export function MarkdownText({ text, style }: MarkdownTextProps) {
  const theme = useTheme();
  if (!hasMarkdown(text)) {
    return (
      <Text bold={style.bold} dimColor={style.dimColor} underline={style.underline}>
        {text}
      </Text>
    );
  }
  const lines = parseMarkdown(text);
  const rendered: ReactNode[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;
    rendered.push(
      <MarkdownLineText key={index} line={line} style={style} codeColor={theme.accent} />,
    );
  }
  return <Box flexDirection="column">{rendered}</Box>;
}
