import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import { defineComponent, type ComponentRenderProps } from "../library";
import { EditableTableSchema } from "../schemas/editable-table-schema";
import { useStateField } from "../use-state-field";
import { EditableCell } from "./editable-cell";
import {
  editableColumnWidths,
  editableColumns,
  editableRows,
  withCellValue,
  type EditableColumn,
  type EditableRow,
} from "./editable-table-layout";
import { padEnd } from "./pad";

type EditableTableProps = z.infer<typeof EditableTableSchema>;

const CELL_GAP = 2;

/**
 * A grid of focusable cells. The edited rows (`{ id, values }[]`) are stored
 * as the form field named after the table; until the first edit the cells
 * show the declared data.
 */
function EditableTableRenderer({ props }: ComponentRenderProps<EditableTableProps>) {
  const field = useStateField<unknown>(props.name);
  const columns = editableColumns(props.columns);
  const rows = editableRows(field.value === undefined ? props.data : field.value);
  const widths = editableColumnWidths(columns, rows);
  if (columns.length === 0) return null;

  function changeCell(rowIndex: number, columnIndex: number, value: unknown): void {
    field.setValue(withCellValue(rows, rowIndex, columnIndex, value));
  }

  const headerCells: ReactNode[] = [];
  let totalWidth = 0;
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index] as EditableColumn;
    const width = widths[index] ?? 1;
    totalWidth += width;
    headerCells.push(
      <Text key={index} bold>
        {padEnd(column.header, width)}
      </Text>,
    );
  }
  totalWidth += CELL_GAP * (columns.length - 1);

  const lines: ReactNode[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] as EditableRow;
    const cells: ReactNode[] = [];
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex] as EditableColumn;
      cells.push(
        <EditableCell
          key={columnIndex}
          name={field.name}
          column={column}
          value={row.values[columnIndex]}
          width={widths[columnIndex] ?? 1}
          onChange={function changeThisCell(value) {
            changeCell(rowIndex, columnIndex, value);
          }}
        />,
      );
    }
    lines.push(
      <Box key={row.id === "" ? rowIndex : row.id} flexDirection="row" gap={CELL_GAP}>
        {cells}
      </Box>,
    );
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="row" gap={CELL_GAP}>
        {headerCells}
      </Box>
      <Text dimColor>{"─".repeat(totalWidth)}</Text>
      {lines}
    </Box>
  );
}

export const EditableTable = defineComponent({
  name: "EditableTable",
  props: EditableTableSchema,
  description:
    "Spreadsheet-like table whose cells the user can edit inline (text, number, url, date, select columns); edits are saved back as a form field",
  component: EditableTableRenderer,
});
