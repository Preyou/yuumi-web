import type { ColumnDef, RowData } from '@tanstack/vue-table'

export interface DataTableColumnMeta {
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean
  nowrap?: boolean
  skeletonClassName?: string
}

export type DataTableColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<TData, TValue> & {
  fixed?: 'left' | 'right' | false
  className?: string
  headerClassName?: string
  cellClassName?: string
  meta?: DataTableColumnMeta
}

export type DataTableScrollable = 'horizontal' | 'vertical' | 'both' | false

export type DataTableRowKey = string | number

export type DataTableRowKeyGetter<TData extends RowData> = Extract<keyof TData, string> | ((row: TData, index: number) => DataTableRowKey)

export type DataTableRowSelectionMode = 'single' | 'multiple'

export type DataTableRowSelectionTrigger = 'checkbox' | 'row' | 'both'

export interface DataTableRowSelectionColumn {
  fixed?: 'left' | 'right'
  width?: number
}

export interface DataTableRowSelection<TData extends RowData> {
  mode: DataTableRowSelectionMode
  trigger?: DataTableRowSelectionTrigger
  preserveOnPageChange?: boolean
  canSelect?: (row: TData, index: number) => boolean
  column?: DataTableRowSelectionColumn
}

export interface DataTablePagination {
  page: number
  pageSize: number
  total: number
  siblingCount?: number
  pageSizeOptions?: number[]
}

export function defineDataTableColumns<
  TData extends RowData,
  TColumns extends readonly DataTableColumnDef<TData, unknown>[],
>(columns: TColumns): TColumns {
  return columns
}

export function createDataTableColumns<TData extends RowData>() {
  return <TColumns extends readonly DataTableColumnDef<TData, unknown>[]>(
    columns: TColumns,
  ): TColumns => columns
}
