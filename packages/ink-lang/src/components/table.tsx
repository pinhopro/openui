import { Box, Text, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { TableSchema } from "../schemas/table-schema";
import { cellText, tableLayout, type TableColumn } from "./table-layout";
import { TablePager } from "./table-pager";
import { pageBounds } from "./table-paging";

type TableProps = z.infer<typeof TableSchema>;

const COLUMN_GAP = 2;
const RULE = "─";
const PAGE_SIZE = 10;

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

/**
 * Column-oriented table: bold header, a dim rule, then one line per row. A
 * table longer than a page shows one page at a time with a pager footer; the
 * wheel over the table turns its pages too.
 */
function TableRenderer({ props, renderNode }: ComponentRenderProps<TableProps>) {
  const layout = tableLayout(Array.isArray(props.columns) ? props.columns : []);
  const isStreaming = useIsStreaming();
  const [page, setPage] = useState(0);
  const boxRef = useRef<DOMElement | null>(null);
  const rowCount = layout.rowCount;
  const isPaged = rowCount > PAGE_SIZE;

  // Several presses can arrive in one stdin chunk, so step from the latest page.
  function stepPage(delta: number): void {
    setPage(function movePage(previous) {
      const current = pageBounds(rowCount, PAGE_SIZE, previous);
      return pageBounds(rowCount, PAGE_SIZE, current.page + delta).page;
    });
  }

  useMouse(boxRef, {
    onWheel: function handleWheel(event) {
      if (!isPaged || isStreaming) return;
      stepPage(event.direction === "up" || event.direction === "left" ? -1 : 1);
    },
  });

  if (layout.columns.length === 0) return null;
  // Clamped on every render: rows can still arrive or shrink while streaming.
  const bounds = pageBounds(rowCount, PAGE_SIZE, page);
  const rows: ReactNode[] = [];
  for (let rowIndex = bounds.start; rowIndex < bounds.end; rowIndex += 1) {
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
    <Box ref={boxRef} flexDirection="column" overflow="hidden">
      <HeaderRow columns={layout.columns} />
      <RuleRow columns={layout.columns} />
      {rows}
      {isPaged ? <TablePager bounds={bounds} rowCount={layout.rowCount} onStep={stepPage} /> : null}
    </Box>
  );
}

export const Table = defineComponent({
  name: "Table",
  props: TableSchema,
  description: "Data table — column-oriented. Each Col holds its own data array.",
  component: TableRenderer,
});
