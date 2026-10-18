import { Box, Text } from "ink";

export interface TitledLineProps {
  /** The glyph before the title: an icon name or the image mark. */
  lead: string;
  leadColor: string | undefined;
  title: string;
  subtitle: string;
  bold: boolean;
  /** `vertical` puts the lead on its own line above the title. */
  layout: unknown;
}

/** `lead title` with a dim subtitle under it; the shape IconText and ImageText share. */
export function TitledLine({ lead, leadColor, title, subtitle, bold, layout }: TitledLineProps) {
  const isVertical = layout === "vertical";
  const indent = isVertical ? "" : " ".repeat(lead.length + 1);
  return (
    <Box flexDirection="column">
      {isVertical ? (
        <Text color={leadColor} dimColor={leadColor === undefined}>
          {lead}
        </Text>
      ) : null}
      <Text>
        {isVertical ? null : (
          <Text color={leadColor} dimColor={leadColor === undefined}>
            {lead + " "}
          </Text>
        )}
        <Text bold={bold}>{title}</Text>
      </Text>
      {subtitle === "" ? null : <Text dimColor>{indent + subtitle}</Text>}
    </Box>
  );
}
