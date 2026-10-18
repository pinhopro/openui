import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { ComputedStyle } from "../design/declarations";
import { useComponentStyle } from "../design/design-system-context";
import { transformText } from "../design/layout-props";
import { useTheme } from "../theme";
import { mergeTextStyle, textProps, type TextStyle } from "../theme-styles";
import { hasMarkdown, parseMarkdown, type MarkdownLine } from "./markdown";

export interface MarkdownTextProps {
  text: string;
  /** The component's computed style; headings merge their own `.h1`, `.h2`, `.h3` rules over it. */
  base: ComputedStyle;
}

interface LineProps {
  line: MarkdownLine;
  style: ComputedStyle;
  codeColor: string;
}

function indentation(line: MarkdownLine): string {
  const spaces = "  ".repeat(line.indent);
  if (line.marker === undefined) return spaces;
  return `${spaces}${line.marker} `;
}

/** The text style of a computed style, with a larger font size shown as bold. */
export function lineTextStyle(style: ComputedStyle): TextStyle {
  if (style.fontSize !== undefined && style.fontSize > 1) {
    return mergeTextStyle(style.text, { bold: true });
  }
  return style.text;
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
        bold={segment.bold ? true : undefined}
        italic={segment.italic ? true : undefined}
        color={segment.code ? codeColor : undefined}
      >
        {transformText(segment.text, style.transform)}
      </Text>,
    );
  }
  return (
    <Text {...textProps(lineTextStyle(style))}>
      {indentation(line)}
      {segments}
    </Text>
  );
}

/** The heading style for a level: the `.hN` rules of the component merged over the base. */
function headingStyle(base: ComputedStyle, heading: ComputedStyle): ComputedStyle {
  return {
    ...base,
    text: mergeTextStyle(base.text, heading.text),
    transform: heading.transform === "none" ? base.transform : heading.transform,
    fontSize: heading.fontSize ?? base.fontSize,
  };
}

/** The markdown subset (headings, lists, bold, italic, code, links) as Ink lines. */
export function MarkdownText({ text, base }: MarkdownTextProps) {
  const theme = useTheme();
  const h1 = headingStyle(base, useComponentStyle(["h1"]));
  const h2 = headingStyle(base, useComponentStyle(["h2"]));
  const h3 = headingStyle(base, useComponentStyle(["h3"]));
  if (!hasMarkdown(text)) {
    return <Text {...textProps(lineTextStyle(base))}>{transformText(text, base.transform)}</Text>;
  }
  const lines = parseMarkdown(text);
  const rendered: ReactNode[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;
    let style = base;
    if (line.kind === "heading") {
      if (line.level === 1) style = h1;
      else if (line.level === 2) style = h2;
      else style = h3;
    }
    rendered.push(
      <MarkdownLineText key={index} line={line} style={style} codeColor={theme.accent} />,
    );
  }
  return <Box flexDirection="column">{rendered}</Box>;
}
