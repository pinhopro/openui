import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { TableSchema } from "../schemas/table-schema";
import { cellText, tableLayout, type TableColumn } from "./table-layout";

type TableProps = z.infer<typeof TableSchema>;

const COLUMN_GAP = 2;
const RULE = "─";

interface CellProps {
  column: TableColumn;
  children: ReactNode;
}

/** A fixed-width cell: content wider than the column is cut, never wrapped. */
function Cell({ column, children }: CellProps) {
  const justifyContent = column.align === "right" ? "flex-end" : "flex-start";
  return (
    <Box width={column.width} flexShrink={0} justifyContent={justifyContent}>
      {children}
    </Box>
  );
}

function HeaderRow({ columns }: { columns: TableColumn[] }) {
  const cells: ReactNode[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as TableColumn;
    cells.push(
      <Cell key={index} column={column}>
        <Text bold wrap="truncate">
          {column.label}
        </Text>
      </Cell>,
    );
  }
  return (
    <Box flexDirection="row" gap={COLUMN_GAP}>
      {cells}
    </Box>
  );
}

function RuleRow({ columns }: { columns: TableColumn[] }) {
  const cells: ReactNode[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as TableColumn;
    cells.push(
      <Cell key={index} column={column}>
        <Text dimColor wrap="truncate">
          {RULE.repeat(column.width)}
        </Text>
      </Cell>,
    );
  }
  return (
    <Box flexDirection="row" gap={COLUMN_GAP}>
      {cells}
    </Box>
  );
}

interface DataRowProps {
  columns: TableColumn[];
  rowIndex: number;
  renderNode: (value: unknown) => ReactNode;
}

function DataRow({ columns, rowIndex, renderNode }: DataRowProps) {
  const cells: ReactNode[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as TableColumn;
    const cell = column.cells[rowIndex];
    const text = cellText(cell);
    cells.push(
      <Cell key={index} column={column}>
        {text === null ? renderNode(cell) : <Text wrap="truncate">{text}</Text>}
      </Cell>,
    );
  }
  return (
    <Box flexDirection="row" gap={COLUMN_GAP}>
      {cells}
    </Box>
  );
}

/** Column-oriented table: bold header, a dim rule, then one line per row. */
function TableRenderer({ props, renderNode }: ComponentRenderProps<TableProps>) {
  const layout = tableLayout(Array.isArray(props.columns) ? props.columns : []);
  if (layout.columns.length === 0) return null;
  const rows: ReactNode[] = [];
  for (let rowIndex = 0; rowIndex < layout.rowCount; rowIndex += 1) {
    rows.push(
      <DataRow
        key={rowIndex}
        columns={layout.columns}
        rowIndex={rowIndex}
        renderNode={renderNode}
      />,
    );
  }
  return (
    <Box flexDirection="column" overflow="hidden">
      <HeaderRow columns={layout.columns} />
      <RuleRow columns={layout.columns} />
      {rows}
    </Box>
  );
}

export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description: "Data table — column-oriented. Each Col holds its own data array.",
  component: TableRenderer,
});
