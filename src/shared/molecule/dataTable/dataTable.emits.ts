import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ExpandedState,
  RowData,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type { DataTablePagination, DataTableRowKey } from './dataTable.types'

export interface DataTableQueryChangePayload {
  pagination?: DataTablePagination
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
}

export interface DataTableEmits<TData extends RowData> {
  'update:selectedRowKeys': [keys: DataTableRowKey[]]
  'update:pagination': [value: DataTablePagination]
  'update:sorting': [value: SortingState]
  'update:columnFilters': [value: ColumnFiltersState]
  'update:globalFilter': [value: string]
  'update:columnVisibility': [value: VisibilityState]
  'update:columnOrder': [value: ColumnOrderState]
  'update:columnPinning': [value: ColumnPinningState]
  'update:expanded': [value: ExpandedState]

  'queryChange': [payload: DataTableQueryChangePayload]

  'rowClick': [payload: { row: TData, index: number }]
  'rowDblClick': [payload: { row: TData, index: number }]
  'selectionChange': [payload: { keys: DataTableRowKey[], rows: TData[] }]

  'go': [page: number, pageSize: number]
}
