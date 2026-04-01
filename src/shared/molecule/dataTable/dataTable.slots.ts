import type { Cell, Column, Header, RowData, Table } from '@tanstack/vue-table'
import type { DataTableQueryChangePayload } from './dataTable.emits'
import type { DataTablePagination, DataTableRowKey } from './dataTable.types'

export interface DataTableToolbarSlotProps<TData extends RowData> {
  table: Table<TData>
  selectedRowKeys: DataTableRowKey[]
  selectedRows: TData[]
  query: DataTableQueryChangePayload
}

export interface DataTableHeaderSlotProps<
  TData extends RowData,
  TValue = unknown,
> {
  table: Table<TData>
  header: Header<TData, TValue>
  column: Column<TData, TValue>
}

export interface DataTableCellSlotProps<
  TData extends RowData,
  TValue = unknown,
> {
  table: Table<TData>
  cell: Cell<TData, TValue>
  column: Column<TData, TValue>
  row: TData
  rowIndex: number
  value: TValue
}

export interface DataTableExpandedSlotProps<TData extends RowData> {
  table: Table<TData>
  row: TData
  rowIndex: number
}

export interface DataTablePaginationSlotProps<TData extends RowData> {
  table: Table<TData>
  pagination: DataTablePagination
}

export interface DataTableSelectionBarSlotProps<TData extends RowData> {
  selectedKeys: DataTableRowKey[]
  selectedRows: TData[]
  clearSelection: () => void
}

export type DataTableSlots<TData extends RowData, TValue = unknown> = {
  'toolbar'?: (props: DataTableToolbarSlotProps<TData>) => unknown
  'toolbar-left'?: (props: DataTableToolbarSlotProps<TData>) => unknown
  'toolbar-right'?: (props: DataTableToolbarSlotProps<TData>) => unknown

  'header'?: (props: DataTableHeaderSlotProps<TData, TValue>) => unknown
  'cell'?: (props: DataTableCellSlotProps<TData, TValue>) => unknown

  'expanded'?: (props: DataTableExpandedSlotProps<TData>) => unknown

  'loading'?: () => unknown
  'empty'?: () => unknown
  'error'?: (props: { error: string | null }) => unknown
  'pagination'?: (props: DataTablePaginationSlotProps<TData>) => unknown
  'selection-bar'?: (props: DataTableSelectionBarSlotProps<TData>) => unknown
} & {
  [K in `header-${string}`]?: (
    props: DataTableHeaderSlotProps<TData, TValue>,
  ) => unknown
} & {
  [K in `cell-${string}`]?: (
    props: DataTableCellSlotProps<TData, TValue>,
  ) => unknown
}
