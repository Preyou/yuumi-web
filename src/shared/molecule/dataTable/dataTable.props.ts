import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ExpandedState,
  RowData,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import type {
  DataTableColumnDef,
  DataTablePagination,
  DataTableRowKey,
  DataTableRowKeyGetter,
  DataTableRowSelection,
  DataTableScrollable,
} from './dataTable.types'

interface DataTableBaseProps<TData extends RowData, TValue = unknown> {
  columns: DataTableColumnDef<TData, TValue>[]
  data: TData[]

  selectedRowKeys?: DataTableRowKey[]

  loading?: boolean
  error?: string | null
  emptyText?: string
  maxBodyHeight?: number | string
  scrollable?: DataTableScrollable
  stickyHeader?: boolean
  showTotal?: boolean

  pagination?: DataTablePagination
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  globalFilter?: string
  columnVisibility?: VisibilityState
  columnOrder?: ColumnOrderState
  columnPinning?: ColumnPinningState
  expanded?: ExpandedState

  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean
}

export interface DataTablePropsWithRowKey<TData extends RowData, TValue = unknown> extends DataTableBaseProps<TData, TValue> {
  rowKey: DataTableRowKeyGetter<TData>
  rowSelection?: DataTableRowSelection<TData>
}

export interface DataTablePropsWithoutRowKey<
  TData extends RowData,
  TValue = unknown,
> extends DataTableBaseProps<TData, TValue> {
  rowKey?: undefined
  rowSelection?: Omit<DataTableRowSelection<TData>, 'preserveOnPageChange'> & {
    preserveOnPageChange?: false
  }
}

export type DataTableProps<TData extends RowData, TValue = unknown>
  = | DataTablePropsWithRowKey<TData, TValue>
    | DataTablePropsWithoutRowKey<TData, TValue>
