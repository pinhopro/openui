import { Box, Text, type DOMElement } from "ink";
import { useRef, useState, type ReactNode } from "react";
import type { z } from "zod/v4";
import { useIsStreaming } from "../context";
import type { ComputedStyle } from "../design/declarations";
import type { DesignSystem } from "../design/design-system";
import { useDesignSystem } from "../design/design-system-context";
import { layoutBoxProps, transformText } from "../design/layout-props";
import { ElementPathContext, useElementPath } from "../element-type-context";
import { defineComponent, type ComponentRenderProps } from "../library";
import { useMouse } from "../mouse/use-mouse";
import { TableSchema } from "../schemas/table-schema";
import { boxProps, textProps } from "../theme-styles";
import { cellText, tableLayout, type TableColumn } from "./table-layout";
import { TablePager } from "./table-pager";
import { pageBounds } from "./table-paging";

type TableProps = z.infer<typeof TableSchema>;

const COLUMN_GAP = 2;
const RULE = "─";
const PAGE_SIZE = 10;

/** The classes of a column's cells: its kind and its 1-based position. */
export function columnClasses(column: TableColumn, index: number): string[] {
  return [column.align === "right" ? "number" : "string", `col-${index + 1}`];
}

/** The states of a body row: odd or even (1-based), first and last. */
export function rowStates(rowIndex: number, rowCount: number): string[] {
  const states: string[] = [(rowIndex + 1) % 2 === 1 ? "odd" : "even"];
  if (rowIndex === 0) states.push("first");
  if (rowIndex === rowCount - 1) states.push("last");
  return states;
}

/** The styles of the table's HTML-like parts, resolved through the cascade. */
interface TableParts {
  table: ComputedStyle;
  head: ComputedStyle;
  header: (column: TableColumn, index: number) => ComputedStyle;
  row: (rowIndex: number, rowCount: number) => ComputedStyle;
  cell: (column: TableColumn, index: number, rowIndex: number, rowCount: number) => ComputedStyle;
  /** The element path of components rendered inside a cell (`Table tbody tr td`). */
  cellPath: string[];
}

function tableParts(system: DesignSystem, path: string[]): TableParts {
  function part(component: string, classes: string[], states: string[], below: string[]) {
    return system.style({ component, classes, states, ancestors: path.concat(below) });
  }
  return {
    table: system.style({
      component: "Table",
      classes: [],
      states: [],
      ancestors: path.slice(0, -1),
    }),
    head: part("thead", [], [], []),
    header: function header(column, index) {
      return part("th", columnClasses(column, index), [], ["thead", "tr"]);
    },
    row: function row(rowIndex, rowCount) {
      return part("tr", [], rowStates(rowIndex, rowCount), ["tbody"]);
    },
    cell: function cell(column, index, rowIndex, rowCount) {
      return part("td", columnClasses(column, index), rowStates(rowIndex, rowCount), [
        "tbody",
        "tr",
      ]);
    },
    cellPath: path.concat(["tbody", "tr", "td"]),
  };
}

interface CellProps {
  column: TableColumn;
  style: ComputedStyle;
  children: ReactNode;
}

/** A fixed-width cell: content wider than the column is cut, never wrapped. */
function Cell({ column, style, children }: CellProps) {
  const align = style.align ?? column.align;
  const justifyContent =
    align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  return (
    <Box
      width={column.width}
      flexShrink={0}
      justifyContent={justifyContent}
      backgroundColor={style.box.background}
    >
      {children}
    </Box>
  );
}

interface HeaderRowProps {
  columns: TableColumn[];
  parts: TableParts;
}

function HeaderRow({ columns, parts }: HeaderRowProps) {
  const cells: ReactNode[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as TableColumn;
    const style = parts.header(column, index);
    cells.push(
      <Cell key={index} column={column} style={style}>
        <Text wrap="truncate" {...textProps(style.text)}>
          {transformText(column.label, style.transform)}
        </Text>
      </Cell>,
    );
  }
  return (
    <Box flexDirection="row" gap={COLUMN_GAP} backgroundColor={parts.head.box.background}>
      {cells}
    </Box>
  );
}

function RuleRow({ columns }: { columns: TableColumn[] }) {
  const cells: ReactNode[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as TableColumn;
    cells.push(
      <Box key={index} width={column.width} flexShrink={0}>
        <Text dimColor wrap="truncate">
          {RULE.repeat(column.width)}
        </Text>
      </Box>,
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
  rowCount: number;
  parts: TableParts;
  renderNode: (value: unknown) => ReactNode;
}

function DataRow({ columns, rowIndex, rowCount, parts, renderNode }: DataRowProps) {
  const row = parts.row(rowIndex, rowCount);
  const cells: ReactNode[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as TableColumn;
    const cell = column.cells[rowIndex];
    const text = cellText(cell);
    const style = parts.cell(column, index, rowIndex, rowCount);
    cells.push(
      <Cell key={index} column={column} style={style}>
        {text === null ? (
          <ElementPathContext.Provider value={parts.cellPath}>
            {renderNode(cell)}
          </ElementPathContext.Provider>
        ) : (
          <Text wrap="truncate" {...textProps(style.text)}>
            {transformText(text, style.transform)}
          </Text>
        )}
      </Cell>,
    );
  }
  return (
    <Box flexDirection="row" gap={COLUMN_GAP} backgroundColor={row.box.background}>
      {cells}
    </Box>
  );
}

/**
 * Column-oriented table: a header, a dim rule, then one line per row. A
 * table longer than a page shows one page at a time with a pager footer; the
 * wheel over the table turns its pages too. The stylesheet addresses it as
 * `Table`, `Table thead`, `Table th.number`, `Table tbody tr:odd`,
 * `Table td.col-2` and the components inside a cell as `Table td Input`.
 */
function TableRenderer({ props, renderNode }: ComponentRenderProps<TableProps>) {
  const layout = tableLayout(Array.isArray(props.columns) ? props.columns : []);
  const isStreaming = useIsStreaming();
  const parts = tableParts(useDesignSystem(), useElementPath());
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
        rowCount={rowCount}
        parts={parts}
        renderNode={renderNode}
      />,
    );
  }
  const box = boxProps(parts.table.box);
  return (
    <Box
      ref={boxRef}
      flexDirection="column"
      overflow="hidden"
      borderStyle={box.borderStyle}
      borderColor={box.borderColor}
      borderDimColor={box.borderDimColor}
      backgroundColor={box.backgroundColor}
      paddingX={box.paddingX}
      paddingY={box.paddingY}
      {...layoutBoxProps(parts.table)}
    >
      <HeaderRow columns={layout.columns} parts={parts} />
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
