<script setup lang="tsx" generic="TData extends RowData">
import type {
  Cell,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ExpandedState,
  Header,
  PaginationState,
  Row,
  RowData,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import type { CSSProperties } from 'vue'
import type {
  DataTableEmits,
  DataTableQueryChangePayload,
} from './dataTable.emits'
import type { DataTableProps } from './dataTable.props'
import type {
  DataTableCellSlotProps,
  DataTableHeaderSlotProps,
  DataTableSlots,
  DataTableToolbarSlotProps,
} from './dataTable.slots'
import type {
  DataTableColumnDef,
  DataTablePagination,
  DataTableRowKey,
  DataTableRowSelectionTrigger,
} from './dataTable.types'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/shared/ui/number-field'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

const props = withDefaults(defineProps<DataTableProps<TData>>(), {
  emptyText: 'No results.',
  error: null,
  loading: false,
  scrollable: 'both',
  showTotal: true,
  stickyHeader: true,
})

const emit = defineEmits<DataTableEmits<TData>>()
defineSlots<DataTableSlots<TData>>()

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const
const DEFAULT_PAGINATION: DataTablePagination = {
  page: 1,
  pageSize: 10,
  siblingCount: 2,
  total: 0,
}

const id = useId()

const warnedInvalidRowKey = ref(false)

const selectedRowKeysState = ref<DataTableRowKey[]>([])
const paginationState = ref<DataTablePagination>()
const sortingState = ref<SortingState>([])
const columnFiltersState = ref<ColumnFiltersState>([])
const globalFilterState = ref('')
const columnVisibilityState = ref<VisibilityState>({})
const columnOrderState = ref<ColumnOrderState>([])
const columnPinningState = ref<ColumnPinningState>({})
const expandedState = ref<ExpandedState>({})

function resolveUpdater<TValue>(
  updater: Updater<TValue>,
  currentValue: TValue,
): TValue {
  if (typeof updater === 'function') {
    return (updater as (value: TValue) => TValue)(currentValue)
  }
  return updater
}

function toSelectionId(rowKey: DataTableRowKey): string {
  if (typeof rowKey === 'number') {
    return `n:${rowKey}`
  }
  return `s:${rowKey}`
}

function isRowKeyValue(rowKey: unknown): rowKey is DataTableRowKey {
  return typeof rowKey === 'string' || typeof rowKey === 'number'
}

function normalizeSorting(value?: SortingState): SortingState {
  return value ? [...value] : []
}

function normalizeColumnFilters(value?: ColumnFiltersState): ColumnFiltersState {
  return value ? [...value] : []
}

function normalizeColumnVisibility(value?: VisibilityState): VisibilityState {
  return value ? { ...value } : {}
}

function normalizeColumnOrder(value?: ColumnOrderState): ColumnOrderState {
  return value ? [...value] : []
}

function normalizeColumnPinning(value?: ColumnPinningState): ColumnPinningState {
  return {
    left: [...(value?.left ?? [])],
    right: [...(value?.right ?? [])],
  }
}

function normalizeExpanded(value?: ExpandedState): ExpandedState {
  if (value === true) {
    return true
  }
  return { ...(value ?? {}) }
}

function normalizePageSizeOptions(
  value?: number[],
): number[] | undefined {
  if (!value?.length) {
    return undefined
  }
  const options = [...new Set(value.map(size => Math.floor(size)).filter(size => Number.isFinite(size) && size > 0))]
  return options.length ? options : undefined
}

function normalizePagination(
  value?: DataTablePagination,
): DataTablePagination | undefined {
  if (!value) {
    return undefined
  }

  const pageSize = Math.max(1, Math.floor(value.pageSize || DEFAULT_PAGINATION.pageSize))
  const total = Math.max(0, Math.floor(value.total || 0))
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Math.floor(value.page || 1)), pageCount)
  const siblingCount = Math.max(1, Math.floor(value.siblingCount || DEFAULT_PAGINATION.siblingCount || 2))

  return {
    ...value,
    page,
    pageSize,
    pageSizeOptions: normalizePageSizeOptions(value.pageSizeOptions),
    siblingCount,
    total,
  }
}

function isSameRowKeyList(
  current: DataTableRowKey[],
  next: DataTableRowKey[],
): boolean {
  if (current.length !== next.length) {
    return false
  }
  return current.every((rowKey, index) => toSelectionId(rowKey) === toSelectionId(next[index]!))
}

function isSamePagination(
  current?: DataTablePagination,
  next?: DataTablePagination,
): boolean {
  if (!current || !next) {
    return current == null && next == null
  }

  const currentOptions = current.pageSizeOptions ?? []
  const nextOptions = next.pageSizeOptions ?? []

  return current.page === next.page
    && current.pageSize === next.pageSize
    && current.total === next.total
    && (current.siblingCount ?? 2) === (next.siblingCount ?? 2)
    && currentOptions.length === nextOptions.length
    && currentOptions.every((option, index) => option === nextOptions[index])
}

function resolveRowKey(row: TData, index: number): DataTableRowKey {
  if (!props.rowKey) {
    return index
  }

  const rowKey = typeof props.rowKey === 'function'
    ? props.rowKey(row, index)
    : row[props.rowKey]

  if (isRowKeyValue(rowKey)) {
    return rowKey
  }

  if (!warnedInvalidRowKey.value) {
    console.warn('[DataTable] `rowKey` must resolve to `string | number`; fallback to row index.')
    warnedInvalidRowKey.value = true
  }

  return index
}

const isRowSelectionEnabled = computed(() => !!props.rowSelection)

const rowSelectionMode = computed(() => props.rowSelection?.mode)

const rowSelectionTrigger = computed<DataTableRowSelectionTrigger>(() => {
  return props.rowSelection?.trigger ?? 'checkbox'
})

const isCheckboxSelectionEnabled = computed(() => {
  if (!isRowSelectionEnabled.value) {
    return false
  }
  return rowSelectionTrigger.value === 'checkbox' || rowSelectionTrigger.value === 'both'
})

const isRowClickSelectionEnabled = computed(() => {
  if (!isRowSelectionEnabled.value) {
    return false
  }
  return rowSelectionTrigger.value === 'row' || rowSelectionTrigger.value === 'both'
})

const preserveOnPageChange = computed(() => {
  if (!isRowSelectionEnabled.value || !props.rowKey) {
    return false
  }
  return props.rowSelection?.preserveOnPageChange ?? true
})

const selectedRowKeyIdSet = computed(() => {
  return new Set(selectedRowKeysState.value.map(toSelectionId))
})

function normalizeSelectedRowKeys(rowKeys: DataTableRowKey[]): DataTableRowKey[] {
  if (!isRowSelectionEnabled.value) {
    return []
  }

  const uniqueIds = new Set<string>()
  const uniqueRowKeys: DataTableRowKey[] = []

  for (const rowKey of rowKeys) {
    const rowKeyId = toSelectionId(rowKey)
    if (uniqueIds.has(rowKeyId)) {
      continue
    }
    uniqueIds.add(rowKeyId)
    uniqueRowKeys.push(rowKey)
  }

  if (rowSelectionMode.value === 'single') {
    return uniqueRowKeys.slice(0, 1)
  }

  return uniqueRowKeys
}

function resolveSelectedRowsFromRowKeys(rowKeys: DataTableRowKey[]): TData[] {
  if (!rowKeys.length) {
    return []
  }
  const selectedIds = new Set(rowKeys.map(toSelectionId))
  return props.data.filter((row, index) => selectedIds.has(toSelectionId(resolveRowKey(row, index))))
}

function updateSelectedRowKeys(rowKeys: DataTableRowKey[]): void {
  const normalizedRowKeys = normalizeSelectedRowKeys(rowKeys)

  if (isSameRowKeyList(selectedRowKeysState.value, normalizedRowKeys)) {
    return
  }

  selectedRowKeysState.value = normalizedRowKeys
  emit('update:selectedRowKeys', normalizedRowKeys)
  emit('selectionChange', {
    keys: normalizedRowKeys,
    rows: resolveSelectedRowsFromRowKeys(normalizedRowKeys),
  })
}

function updatePagination(
  nextPagination: DataTablePagination,
  options?: { emitGo?: boolean },
): void {
  const normalizedPagination = normalizePagination(nextPagination)
  if (!normalizedPagination) {
    return
  }

  if (isSamePagination(paginationState.value, normalizedPagination)) {
    return
  }

  paginationState.value = normalizedPagination
  emit('update:pagination', normalizedPagination)

  if (options?.emitGo) {
    emit('go', normalizedPagination.page, normalizedPagination.pageSize)
  }
}

function updateSorting(nextSorting: SortingState): void {
  sortingState.value = normalizeSorting(nextSorting)
  emit('update:sorting', sortingState.value)
}

function updateColumnFilters(nextFilters: ColumnFiltersState): void {
  columnFiltersState.value = normalizeColumnFilters(nextFilters)
  emit('update:columnFilters', columnFiltersState.value)
}

function updateGlobalFilter(nextValue: string): void {
  globalFilterState.value = nextValue
  emit('update:globalFilter', nextValue)
}

function updateColumnVisibility(nextVisibility: VisibilityState): void {
  columnVisibilityState.value = normalizeColumnVisibility(nextVisibility)
  emit('update:columnVisibility', columnVisibilityState.value)
}

function updateColumnOrder(nextOrder: ColumnOrderState): void {
  columnOrderState.value = normalizeColumnOrder(nextOrder)
  emit('update:columnOrder', columnOrderState.value)
}

function updateColumnPinning(nextPinning: ColumnPinningState): void {
  columnPinningState.value = normalizeColumnPinning(nextPinning)
  emit('update:columnPinning', columnPinningState.value)
}

function updateExpanded(nextExpanded: ExpandedState): void {
  expandedState.value = normalizeExpanded(nextExpanded)
  emit('update:expanded', expandedState.value)
}

function canSelectRow(row: TData, index: number): boolean {
  if (!isRowSelectionEnabled.value) {
    return false
  }
  return props.rowSelection?.canSelect?.(row, index) ?? true
}

function isRowSelected(row: TData, index: number): boolean {
  const rowKey = resolveRowKey(row, index)
  return selectedRowKeyIdSet.value.has(toSelectionId(rowKey))
}

function setRowChecked(row: TData, index: number, checked: boolean): void {
  if (!canSelectRow(row, index)) {
    return
  }

  const rowKey = resolveRowKey(row, index)
  if (rowSelectionMode.value === 'single') {
    updateSelectedRowKeys(checked ? [rowKey] : [])
    return
  }

  const rowKeyId = toSelectionId(rowKey)
  const nextRowKeys = selectedRowKeysState.value.filter(
    key => toSelectionId(key) !== rowKeyId,
  )
  if (checked) {
    nextRowKeys.push(rowKey)
  }
  updateSelectedRowKeys(nextRowKeys)
}

function getSelectableRowKeys(rows: Row<TData>[]): DataTableRowKey[] {
  return rows
    .filter(row => canSelectRow(row.original, row.index))
    .map(row => resolveRowKey(row.original, row.index))
}

function isAllRowsSelected(rows: Row<TData>[]): boolean {
  const rowKeys = getSelectableRowKeys(rows)
  return rowKeys.length > 0
    && rowKeys.every(rowKey => selectedRowKeyIdSet.value.has(toSelectionId(rowKey)))
}

function isSomeRowsSelected(rows: Row<TData>[]): boolean {
  const rowKeys = getSelectableRowKeys(rows)
  if (!rowKeys.length || isAllRowsSelected(rows)) {
    return false
  }
  return rowKeys.some(rowKey => selectedRowKeyIdSet.value.has(toSelectionId(rowKey)))
}

function setRowsChecked(rows: Row<TData>[], checked: boolean): void {
  if (rowSelectionMode.value !== 'multiple') {
    return
  }

  const rowKeys = getSelectableRowKeys(rows)
  const rowKeyIdSet = new Set(rowKeys.map(toSelectionId))

  if (!checked) {
    updateSelectedRowKeys(
      selectedRowKeysState.value.filter(rowKey => !rowKeyIdSet.has(toSelectionId(rowKey))),
    )
    return
  }

  updateSelectedRowKeys([...selectedRowKeysState.value, ...rowKeys])
}

function shouldIgnoreRowClickSelection(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return !!target.closest('a,button,input,select,textarea,label,[role="button"],[role="checkbox"],[data-row-selection-ignore]')
}

function clearSelection(): void {
  updateSelectedRowKeys([])
}

watch(
  () => props.selectedRowKeys,
  (nextRowKeys) => {
    const normalizedRowKeys = normalizeSelectedRowKeys(nextRowKeys ?? [])
    if (isSameRowKeyList(selectedRowKeysState.value, normalizedRowKeys)) {
      return
    }
    selectedRowKeysState.value = normalizedRowKeys
  },
  { deep: true, immediate: true },
)

watch(
  () => props.pagination,
  (nextPagination) => {
    const normalizedPagination = normalizePagination(nextPagination)
    if (isSamePagination(paginationState.value, normalizedPagination)) {
      return
    }
    paginationState.value = normalizedPagination
  },
  { deep: true, immediate: true },
)

watch(
  () => props.sorting,
  value => sortingState.value = normalizeSorting(value),
  { deep: true, immediate: true },
)

watch(
  () => props.columnFilters,
  value => columnFiltersState.value = normalizeColumnFilters(value),
  { deep: true, immediate: true },
)

watch(
  () => props.globalFilter,
  value => globalFilterState.value = value ?? '',
  { immediate: true },
)

watch(
  () => props.columnVisibility,
  value => columnVisibilityState.value = normalizeColumnVisibility(value),
  { deep: true, immediate: true },
)

watch(
  () => props.columnOrder,
  value => columnOrderState.value = normalizeColumnOrder(value),
  { deep: true, immediate: true },
)

watch(
  () => props.columnPinning,
  value => columnPinningState.value = normalizeColumnPinning(value),
  { deep: true, immediate: true },
)

watch(
  () => props.expanded,
  value => expandedState.value = normalizeExpanded(value),
  { deep: true, immediate: true },
)

watch(
  () => [paginationState.value?.page, paginationState.value?.pageSize] as const,
  () => {
    if (!isRowSelectionEnabled.value || preserveOnPageChange.value) {
      return
    }
    updateSelectedRowKeys([])
  },
)

watch(
  () => props.data,
  () => {
    if (!isRowSelectionEnabled.value || props.rowKey) {
      return
    }
    updateSelectedRowKeys([])
  },
)

watch(
  () => rowSelectionMode.value,
  () => {
    updateSelectedRowKeys(selectedRowKeysState.value)
  },
)

watch(
  () => props.rowSelection,
  (rowSelection) => {
    if (!rowSelection) {
      updateSelectedRowKeys([])
    }
  },
)

const queryPayload = computed<DataTableQueryChangePayload>(() => ({
  columnFilters: [...columnFiltersState.value],
  globalFilter: globalFilterState.value,
  pagination: paginationState.value
    ? {
        ...paginationState.value,
        pageSizeOptions: paginationState.value.pageSizeOptions
          ? [...paginationState.value.pageSizeOptions]
          : undefined,
      }
    : undefined,
  sorting: [...sortingState.value],
}))

watch(
  queryPayload,
  payload => emit('queryChange', payload),
  { deep: true },
)

const tableColumns = computed(() => {
  if (!isCheckboxSelectionEnabled.value) {
    return props.columns
  }

  const width = props.rowSelection?.column?.width ?? 44

  const selectionColumn: DataTableColumnDef<TData, unknown> = {
    cell: ({ row }) => (
      <div
        class="inline-flex"
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          setRowChecked(row.original, row.index, !isRowSelected(row.original, row.index))
        }}
      >
        <Checkbox
          aria-label="Select row"
          modelValue={isRowSelected(row.original, row.index)}
          disabled={!canSelectRow(row.original, row.index)}
        />
      </div>
    ),
    cellClassName: 'text-center',
    className: 'w-11',
    enableHiding: false,
    enableSorting: false,
    fixed: props.rowSelection?.column?.fixed ?? 'left',
    header: ({ table }) => {
      if (rowSelectionMode.value !== 'multiple') {
        return null
      }

      const currentRows = (
        paginationState.value
          ? table.getRowModel().rows
          : table.getPrePaginationRowModel().rows
      ) as Row<TData>[]
      return (
        <div
          class="inline-flex"
          onClick={(event: MouseEvent) => {
            event.stopPropagation()
            setRowsChecked(currentRows, !isAllRowsSelected(currentRows))
          }}
        >
          <Checkbox
            aria-label="Select all rows in current page"
            modelValue={isAllRowsSelected(currentRows)
              ? true
              : isSomeRowsSelected(currentRows)
                ? 'indeterminate'
                : false}
          />
        </div>
      )
    },
    headerClassName: 'text-center',
    id: '__rowSelection',
    maxSize: width,
    minSize: width,
    size: width,
  }

  return [selectionColumn, ...props.columns]
})

const isPaginationEnabled = computed(() => !!paginationState.value)

const tanstackPaginationState = computed<PaginationState>(() => {
  if (!paginationState.value) {
    return {
      pageIndex: 0,
      pageSize: Math.max(1, props.data.length || DEFAULT_PAGINATION.pageSize),
    }
  }
  return {
    pageIndex: Math.max(0, paginationState.value.page - 1),
    pageSize: paginationState.value.pageSize,
  }
})

const table = useVueTable({
  get columns() {
    return tableColumns.value as DataTableColumnDef<TData, unknown>[]
  },
  get data() {
    return props.data
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getRowId: (originalRow, index) => toSelectionId(resolveRowKey(originalRow, index)),
  getSortedRowModel: getSortedRowModel(),
  get manualFiltering() {
    return props.manualFiltering ?? false
  },
  get manualPagination() {
    return props.manualPagination ?? !!paginationState.value
  },
  get manualSorting() {
    return props.manualSorting ?? false
  },
  onColumnFiltersChange: (updater) => {
    const nextFilters = resolveUpdater(updater, columnFiltersState.value)
    updateColumnFilters(nextFilters)
  },
  onColumnOrderChange: (updater) => {
    const nextOrder = resolveUpdater(updater, columnOrderState.value)
    updateColumnOrder(nextOrder)
  },
  onColumnPinningChange: (updater) => {
    const nextPinning = resolveUpdater(updater, columnPinningState.value)
    updateColumnPinning(nextPinning)
  },
  onColumnVisibilityChange: (updater) => {
    const nextVisibility = resolveUpdater(updater, columnVisibilityState.value)
    updateColumnVisibility(nextVisibility)
  },
  onExpandedChange: (updater) => {
    const nextExpanded = resolveUpdater(updater, expandedState.value)
    updateExpanded(nextExpanded)
  },
  onGlobalFilterChange: (updater) => {
    const nextGlobalFilter = resolveUpdater(updater as Updater<unknown>, globalFilterState.value)
    updateGlobalFilter(nextGlobalFilter == null ? '' : String(nextGlobalFilter))
  },
  onPaginationChange: (updater) => {
    if (!paginationState.value) {
      return
    }
    const nextState = resolveUpdater(updater, tanstackPaginationState.value)
    updatePagination(
      {
        ...paginationState.value,
        page: nextState.pageIndex + 1,
        pageSize: nextState.pageSize,
      },
      { emitGo: true },
    )
  },
  onSortingChange: (updater) => {
    const nextSorting = resolveUpdater(updater, sortingState.value)
    updateSorting(nextSorting)
  },
  get state() {
    return {
      columnFilters: columnFiltersState.value,
      columnOrder: columnOrderState.value,
      columnPinning: columnPinningState.value,
      columnVisibility: columnVisibilityState.value,
      expanded: expandedState.value,
      globalFilter: globalFilterState.value,
      pagination: tanstackPaginationState.value,
      sorting: sortingState.value,
    }
  },
})

const tableRows = computed<Row<TData>[]>(() => {
  if (isPaginationEnabled.value) {
    return table.getRowModel().rows as Row<TData>[]
  }
  return table.getPrePaginationRowModel().rows as Row<TData>[]
})

const totalCountFormatter = new Intl.NumberFormat('en-US')

const pageCount = computed(() => {
  if (!paginationState.value) {
    return 1
  }
  return Math.max(1, Math.ceil(paginationState.value.total / paginationState.value.pageSize))
})

const showPaginationEllipsis = computed(() => {
  const siblingCount = paginationState.value?.siblingCount ?? DEFAULT_PAGINATION.siblingCount ?? 2
  return pageCount.value > siblingCount * 2 + 1
})

const currentPagination = computed<DataTablePagination>(() => {
  return paginationState.value ?? DEFAULT_PAGINATION
})

const pageModel = computed({
  get() {
    return currentPagination.value.page
  },
  set(nextPage: number) {
    if (!paginationState.value) {
      return
    }
    const page = Math.min(Math.max(1, Math.floor(nextPage || 1)), pageCount.value)
    updatePagination(
      {
        ...paginationState.value,
        page,
      },
      { emitGo: true },
    )
  },
})

const pageGo = ref(1)

watch(
  pageModel,
  (nextPage) => {
    pageGo.value = nextPage
  },
  { immediate: true },
)

const pageSizeOptions = computed(() => {
  return currentPagination.value.pageSizeOptions?.length
    ? currentPagination.value.pageSizeOptions
    : [...DEFAULT_PAGE_SIZE_OPTIONS]
})

const pageSizeModel = computed({
  get() {
    return String(currentPagination.value.pageSize)
  },
  set(nextValue: string) {
    if (!paginationState.value) {
      return
    }
    const pageSize = Math.max(1, Math.floor(Number(nextValue)))
    updatePagination(
      {
        ...paginationState.value,
        page: 1,
        pageSize,
      },
      { emitGo: true },
    )
  },
})

function submitPageGo(): void {
  pageModel.value = pageGo.value
}

const showTotalCount = computed(() => props.showTotal)

const showPagination = computed(() => {
  return !!paginationState.value && paginationState.value.total > 0
})

const showFooter = computed(() => {
  return showTotalCount.value || showPagination.value
})

const displayTotalCount = computed(() => {
  const total = paginationState.value?.total ?? props.data.length
  return totalCountFormatter.format(total)
})

const emptyCellColspan = computed(() => {
  return table.getVisibleLeafColumns().length || tableColumns.value.length
})

const skeletonRowCount = computed(() => {
  const pageSize = Math.floor(currentPagination.value.pageSize)
  if (Number.isFinite(pageSize) && pageSize > 0) {
    return pageSize
  }
  if (props.data.length > 0) {
    return props.data.length
  }
  return 5
})

const skeletonColumns = computed(() => {
  const visibleColumns = table.getVisibleLeafColumns()
  if (visibleColumns.length > 0) {
    return visibleColumns
  }
  return table.getAllLeafColumns()
})

function getSkeletonClass(columnId: string): string {
  if (columnId === '__rowSelection') {
    return 'mx-auto h-4 w-4'
  }
  const column = table.getColumn(columnId)
  const columnDef = column?.columnDef as DataTableColumnDef<TData, unknown> | undefined
  return columnDef?.meta?.skeletonClassName || 'h-4 w-full'
}

const fixedOffsets = computed(() => {
  const visibleColumns = table.getVisibleLeafColumns()
  const columnOffsets = new Map<string, { side: 'left' | 'right', offset: number }>()

  let leftOffset = 0
  for (const column of visibleColumns) {
    const fixed = (column.columnDef as DataTableColumnDef<TData, unknown>).fixed
    if (fixed !== 'left') {
      continue
    }
    columnOffsets.set(column.id, { offset: leftOffset, side: 'left' })
    leftOffset += column.getSize()
  }

  let rightOffset = 0
  for (const column of [...visibleColumns].reverse()) {
    const fixed = (column.columnDef as DataTableColumnDef<TData, unknown>).fixed
    if (fixed !== 'right') {
      continue
    }
    columnOffsets.set(column.id, { offset: rightOffset, side: 'right' })
    rightOffset += column.getSize()
  }

  return columnOffsets
})

function getFixedColumnStyle(columnId: string): CSSProperties | undefined {
  const fixed = fixedOffsets.value.get(columnId)
  if (!fixed) {
    return undefined
  }

  if (fixed.side === 'left') {
    return {
      left: `${fixed.offset}px`,
      position: 'sticky',
      zIndex: 15,
    }
  }

  return {
    position: 'sticky',
    right: `${fixed.offset}px`,
    zIndex: 15,
  }
}

function getAlignClass(align: 'left' | 'center' | 'right' | undefined): string {
  if (align === 'center') {
    return 'text-center'
  }
  if (align === 'right') {
    return 'text-right'
  }
  return 'text-left'
}

function getColumnClass(
  columnId: string,
  columnDef: DataTableColumnDef<TData, unknown>,
  kind: 'header' | 'cell',
): Array<string | undefined> {
  const meta = columnDef.meta as DataTableColumnDef<TData, unknown>['meta'] | undefined

  return [
    fixedOffsets.value.get(columnId) ? 'bg-background' : undefined,
    columnDef.className,
    kind === 'header' ? columnDef.headerClassName : columnDef.cellClassName,
    getAlignClass(meta?.align),
    meta?.nowrap === false ? 'whitespace-normal' : undefined,
    kind === 'cell' && meta?.ellipsis ? 'max-w-0 truncate' : undefined,
  ]
}

const scrollableClass = computed(() => {
  if (props.scrollable === 'horizontal') {
    return 'overflow-x-auto overflow-y-hidden'
  }
  if (props.scrollable === 'vertical') {
    return 'overflow-x-hidden overflow-y-auto'
  }
  if (props.scrollable === false) {
    return 'overflow-hidden'
  }
  return 'overflow-auto'
})

function toCssSize(value: number | string): string {
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}

const bodyStyle = computed<CSSProperties | undefined>(() => {
  if (props.maxBodyHeight == null) {
    return undefined
  }
  return {
    maxHeight: toCssSize(props.maxBodyHeight),
  }
})

const headerClass = computed(() => {
  if (!props.stickyHeader) {
    return '**:text-muted-foreground/80'
  }
  return '**:text-muted-foreground/80 [&_th]:bg-background [&_th]:sticky [&_th]:top-0 [&_th]:z-20'
})

function getHeaderSlotName(columnId: string): `header-${string}` {
  return `header-${columnId}`
}

function getCellSlotName(columnId: string): `cell-${string}` {
  return `cell-${columnId}`
}

function getHeaderSlotProps(
  header: Header<TData, unknown>,
): DataTableHeaderSlotProps<TData, unknown> {
  return {
    column: header.column,
    header,
    table,
  }
}

function getCellSlotProps(
  cell: Cell<TData, unknown>,
): DataTableCellSlotProps<TData, unknown> {
  return {
    cell,
    column: cell.column,
    row: cell.row.original,
    rowIndex: cell.row.index,
    table,
    value: cell.getValue() as unknown,
  }
}

function formatCellValue(value: unknown): string {
  if (value == null) {
    return ''
  }
  return typeof value === 'string' ? value : String(value)
}

function getSortIndicator(header: Header<TData, unknown>): string {
  const sorted = header.column.getIsSorted()
  if (sorted === 'asc') {
    return '▲'
  }
  if (sorted === 'desc') {
    return '▼'
  }
  return ''
}

function onHeaderClick(header: Header<TData, unknown>): void {
  if (!header.column.getCanSort()) {
    return
  }
  header.column.toggleSorting()
}

function getHeaderInnerClass(header: Header<TData, unknown>): string | undefined {
  if (!header.column.getCanSort()) {
    return undefined
  }
  return 'inline-flex cursor-pointer select-none items-center gap-1'
}

function onRowClick(row: Row<TData>, event: MouseEvent): void {
  emit('rowClick', {
    index: row.index,
    row: row.original,
  })

  if (!isRowClickSelectionEnabled.value) {
    return
  }
  if (!canSelectRow(row.original, row.index)) {
    return
  }
  if (shouldIgnoreRowClickSelection(event.target)) {
    return
  }

  setRowChecked(row.original, row.index, !isRowSelected(row.original, row.index))
}

function onRowDblClick(row: Row<TData>): void {
  emit('rowDblClick', {
    index: row.index,
    row: row.original,
  })
}

function getRowClass(row: Row<TData>): string | undefined {
  if (isRowClickSelectionEnabled.value && canSelectRow(row.original, row.index)) {
    return 'cursor-pointer'
  }
  return undefined
}

const selectedRows = computed(() => {
  return resolveSelectedRowsFromRowKeys(selectedRowKeysState.value)
})

const toolbarSlotProps = computed<DataTableToolbarSlotProps<TData>>(() => ({
  query: queryPayload.value,
  selectedRowKeys: [...selectedRowKeysState.value],
  selectedRows: selectedRows.value,
  table,
}))
</script>

<template>
  <Atom base-class="flex flex-col overflow-hidden">
    <div
      v-if="$slots.toolbar || $slots['toolbar-left'] || $slots['toolbar-right']"
      class="flex flex-none flex-col gap-2 pb-3"
    >
      <slot name="toolbar" v-bind="toolbarSlotProps">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <slot name="toolbar-left" v-bind="toolbarSlotProps" />
          <slot name="toolbar-right" v-bind="toolbarSlotProps" />
        </div>
      </slot>
    </div>

    <div class="min-h-0" :class="scrollableClass" :style="bodyStyle">
      <Table>
        <TableHeader :class="headerClass">
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="getColumnClass(header.column.id, header.column.columnDef as DataTableColumnDef<TData, unknown>, 'header')"
              :style="getFixedColumnStyle(header.column.id)"
            >
              <template v-if="!header.isPlaceholder">
                <slot
                  v-if="$slots[getHeaderSlotName(header.column.id)]"
                  :name="getHeaderSlotName(header.column.id)"
                  v-bind="getHeaderSlotProps(header as Header<TData, unknown>)"
                />
                <div
                  v-else-if="header.column.columnDef.header"
                  :class="getHeaderInnerClass(header as Header<TData, unknown>)"
                  @click="onHeaderClick(header as Header<TData, unknown>)"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <span
                    v-if="getSortIndicator(header as Header<TData, unknown>)"
                    class="text-xs text-muted-foreground"
                  >
                    {{ getSortIndicator(header as Header<TData, unknown>) }}
                  </span>
                </div>
                <slot
                  v-else
                  name="header"
                  v-bind="getHeaderSlotProps(header as Header<TData, unknown>)"
                >
                  {{ header.column.id }}
                </slot>
              </template>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="props.loading">
            <slot name="loading">
              <TableRow v-for="index in skeletonRowCount" :key="`skeleton-row-${index}`">
                <TableCell
                  v-for="column in skeletonColumns"
                  :key="`skeleton-cell-${index}-${column.id}`"
                  :class="getColumnClass(column.id, column.columnDef as DataTableColumnDef<TData, unknown>, 'cell')"
                  :style="getFixedColumnStyle(column.id)"
                >
                  <Skeleton :class="getSkeletonClass(column.id)" />
                </TableCell>
              </TableRow>
            </slot>
          </template>

          <template v-else-if="props.error">
            <slot name="error" :error="props.error">
              <TableRow>
                <TableCell :colspan="emptyCellColspan" class="h-24 text-center text-destructive">
                  {{ props.error }}
                </TableCell>
              </TableRow>
            </slot>
          </template>

          <template v-else-if="tableRows.length">
            <template v-for="row in tableRows" :key="row.id">
              <TableRow
                :class="getRowClass(row)"
                :data-state="isRowSelected(row.original, row.index) ? 'selected' : undefined"
                @click="onRowClick(row, $event)"
                @dblclick="onRowDblClick(row)"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="getColumnClass(cell.column.id, cell.column.columnDef as DataTableColumnDef<TData, unknown>, 'cell')"
                  :style="getFixedColumnStyle(cell.column.id)"
                >
                  <slot
                    v-if="$slots[getCellSlotName(cell.column.id)]"
                    :name="getCellSlotName(cell.column.id)"
                    v-bind="getCellSlotProps(cell as Cell<TData, unknown>)"
                  />
                  <FlexRender
                    v-else-if="cell.column.columnDef.cell"
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                  <slot
                    v-else
                    name="cell"
                    v-bind="getCellSlotProps(cell as Cell<TData, unknown>)"
                  >
                    {{ formatCellValue(cell.getValue()) }}
                  </slot>
                </TableCell>
              </TableRow>

              <TableRow v-if="$slots.expanded && row.getIsExpanded()">
                <TableCell :colspan="emptyCellColspan">
                  <slot
                    name="expanded"
                    :table="table"
                    :row="row.original"
                    :row-index="row.index"
                  />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <template v-else>
            <slot name="empty">
              <TableRow>
                <TableCell :colspan="emptyCellColspan" class="h-24 text-center">
                  {{ props.emptyText }}
                </TableCell>
              </TableRow>
            </slot>
          </template>
        </TableBody>
      </Table>
    </div>

    <div
      v-if="$slots['selection-bar'] && selectedRowKeysState.length"
      class="border-t px-4 py-2"
    >
      <slot
        name="selection-bar"
        :selected-keys="selectedRowKeysState"
        :selected-rows="selectedRows"
        :clear-selection="clearSelection"
      />
    </div>

    <div
      v-if="showFooter"
      class="flex flex-none flex-wrap items-center justify-between gap-2 px-4 py-2"
    >
      <div v-if="showTotalCount" class="text-sm text-muted-foreground">
        Total: {{ displayTotalCount }}
      </div>

      <template v-if="showPagination">
        <slot
          v-if="$slots.pagination"
          name="pagination"
          :table="table"
          :pagination="currentPagination"
        />
        <div v-else class="ml-auto flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows</span>
            <Select v-model="pageSizeModel">
              <SelectTrigger class="h-8 min-w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in pageSizeOptions"
                  :key="option"
                  :value="String(option)"
                >
                  {{ option }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination
            v-slot="{ page }"
            v-model:page="pageModel"
            :items-per-page="currentPagination.pageSize"
            :sibling-count="currentPagination.siblingCount ?? 2"
            :total="currentPagination.total"
            class="ml-auto w-auto"
          >
            <PaginationContent v-slot="{ items }">
              <PaginationFirst v-if="showPaginationEllipsis" />
              <PaginationPrevious />
              <template v-for="(item, index) in items" :key="index">
                <PaginationItem
                  v-if="item.type === 'page'"
                  :value="item.value"
                  :is-active="item.value === page"
                >
                  {{ item.value }}
                </PaginationItem>
              </template>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <PaginationEllipsis v-if="showPaginationEllipsis" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-60">
                  <div class="flex items-center gap-4">
                    <Label :for="`${id}-page`">Page</Label>
                    <NumberField
                      :id="`${id}-page`"
                      v-model="pageGo"
                      :default-value="1"
                      :min="1"
                      :max="pageCount"
                      :step="1"
                    >
                      <NumberFieldContent>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                      </NumberFieldContent>
                    </NumberField>
                    <Button @click="submitPageGo">
                      Go
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <PaginationNext />
              <PaginationLast v-if="showPaginationEllipsis" />
            </PaginationContent>
          </Pagination>
        </div>
      </template>
    </div>
  </Atom>
</template>
