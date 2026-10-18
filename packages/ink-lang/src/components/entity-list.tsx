import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { EntityListSchema } from "../schemas/entity-list-schema";
import { entityListLayout, type EntityListLayout, type EntityRow } from "./entity-list-rows";
import { padEnd, padStart } from "./pad";

type EntityListProps = z.infer<typeof EntityListSchema>;

const COLUMN_GAP = "  ";

function rowText(row: EntityRow, layout: EntityListLayout): string {
  const right = row.isNumber ? padStart(row.right, layout.rightWidth) : row.right;
  return padEnd(row.left, layout.leftWidth) + COLUMN_GAP + right;
}

/** Two aligned columns; the header is bold and the footer sits under a dim rule. */
function EntityListRenderer({ props }: ComponentRenderProps<EntityListProps>) {
  const layout = entityListLayout(props.rows, props.size, props.header, props.footer);
  const lines: ReactNode[] = [];
  if (layout.header !== undefined) {
    lines.push(
      <Text key="header" bold>
        {rowText(layout.header, layout)}
      </Text>,
    );
  }
  for (let index = 0; index < layout.rows.length; index += 1) {
    const row = layout.rows[index] as EntityRow;
    lines.push(<Text key={index}>{rowText(row, layout)}</Text>);
  }
  if (layout.footer !== undefined) {
    const width = layout.leftWidth + COLUMN_GAP.length + layout.rightWidth;
    lines.push(
      <Text key="rule" dimColor>
        {"─".repeat(width)}
      </Text>,
    );
    lines.push(
      <Text key="footer" bold>
        {rowText(layout.footer, layout)}
      </Text>,
    );
  }
  if (lines.length === 0) return null;
  return <Box flexDirection="column">{lines}</Box>;
}

export const EntityList = defineComponent({
  name: "EntityList",
  props: EntityListSchema,
  description:
    "Two-column key/value rows (left label, right value). size 'default' supports optional header and footer rows; rightVariant 'number' uses tabular numbers.",
  component: EntityListRenderer,
});
