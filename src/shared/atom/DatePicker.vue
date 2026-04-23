<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import type { ButtonVariants } from '@/shared/ui/button'
import type { LayoutTypes } from '@/shared/ui/calendar'
import type { Matcher, WeekDayFormat, WeekStartsOn } from 'reka-ui/date'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import AtomButton from '@/shared/atom/Button.vue'
import { Calendar } from '@/shared/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'

type TriggerVariant = Exclude<NonNullable<ButtonVariants['variant']>, 'destructive'>
type TriggerSize = ButtonVariants['size']

interface Props {
  align?: 'center' | 'end' | 'start'
  calendarClass?: string
  closeOnSelect?: boolean
  contentClass?: string
  disabled?: boolean
  disableDaysOutsideCurrentView?: boolean
  emptyText?: string
  fixedWeeks?: boolean
  format?: (value: DateValue, locale: string) => string
  id?: string
  initialFocus?: boolean
  isDateDisabled?: Matcher
  isDateUnavailable?: Matcher
  layout?: LayoutTypes
  locale?: string
  maxValue?: DateValue
  minValue?: DateValue
  modelValue?: DateValue
  name?: string
  numberOfMonths?: number
  open?: boolean
  pagedNavigation?: boolean
  placeholder?: DateValue
  preventDeselect?: boolean
  readonly?: boolean
  required?: boolean
  side?: 'bottom' | 'left' | 'right' | 'top'
  sideOffset?: number
  triggerClass?: string
  triggerSize?: TriggerSize
  triggerVariant?: TriggerVariant
  weekdayFormat?: WeekDayFormat
  weekStartsOn?: WeekStartsOn
  yearRange?: DateValue[]
}

const {
  align = 'start',
  closeOnSelect = true,
  emptyText = 'Pick a date',
  initialFocus = true,
  layout = 'month-and-year',
  locale,
  open,
  placeholder,
  triggerVariant = 'outline',
} = defineProps<Props>()

const emit = defineEmits<{
  (event: 'blur', value: FocusEvent): void
  (event: 'clear'): void
  (event: 'focus', value: FocusEvent): void
  (event: 'openChange', value: boolean): void
  (event: 'select', value: DateValue): void
  (event: 'update:open', value: boolean): void
  (event: 'update:placeholder', value: DateValue): void
  (event: 'update:modelValue', value: DateValue | undefined): void
}>()

const { locale: i18nLocale } = useI18n()

const resolvedLocale = computed(() => locale ?? String(i18nLocale.value))
const formatter = computed(() => new DateFormatter(resolvedLocale.value, {
  dateStyle: 'long',
}))
const uncontrolledOpen = ref(false)
const uncontrolledPlaceholder = ref<DateValue | undefined>()
const resolvedOpen = computed(() => open === undefined ? uncontrolledOpen.value : open)
const resolvedPlaceholder = computed(() => placeholder ?? uncontrolledPlaceholder.value)

watch(
  () => open,
  (nextOpen) => {
    if (nextOpen === undefined) {
      return
    }
    uncontrolledOpen.value = nextOpen
  },
  { immediate: true },
)

watch(
  () => placeholder,
  (nextPlaceholder) => {
    if (nextPlaceholder === undefined) {
      return
    }
    uncontrolledPlaceholder.value = nextPlaceholder
  },
  { immediate: true },
)
</script>

<template>
  <Popover
    v-slot="{ close }"
    :open="resolvedOpen"
    @update:open="(value) => {
      if (open === undefined) {
        uncontrolledOpen = value
      }
      emit('update:open', value)
      emit('openChange', value)
    }"
  >
    <PopoverTrigger as-child>
      <AtomButton
        :id="id"
        :name="name"
        :variant="triggerVariant"
        :size="triggerSize"
        :disabled="disabled"
        :aria-required="required || undefined"
        :class="$cn(
          'w-full justify-start text-left font-normal',
          !modelValue && 'text-muted-foreground',
          triggerClass,
        )"
        @focus="(event: FocusEvent) => emit('focus', event)"
        @blur="(event: FocusEvent) => emit('blur', event)"
      >
        <CalendarIcon class="mr-2 size-4" />
        {{ modelValue ? (format ? format(modelValue, resolvedLocale) : formatter.format(modelValue.toDate(getLocalTimeZone()))) : emptyText }}
      </AtomButton>
    </PopoverTrigger>

    <PopoverContent
      :align="align"
      :side="side"
      :side-offset="sideOffset"
      :class="$cn('w-auto p-0', contentClass)"
    >
      <Calendar
        :model-value="modelValue"
        :placeholder="resolvedPlaceholder"
        :disabled="disabled"
        :readonly="readonly"
        :initial-focus="initialFocus"
        :layout="layout"
        :locale="resolvedLocale"
        :week-starts-on="weekStartsOn"
        :weekday-format="weekdayFormat"
        :fixed-weeks="fixedWeeks"
        :number-of-months="numberOfMonths"
        :min-value="minValue"
        :max-value="maxValue"
        :paged-navigation="pagedNavigation"
        :prevent-deselect="preventDeselect"
        :disable-days-outside-current-view="disableDaysOutsideCurrentView"
        :is-date-disabled="isDateDisabled"
        :is-date-unavailable="isDateUnavailable"
        :year-range="yearRange"
        :class="calendarClass"
        @update:placeholder="(value) => {
          if (placeholder === undefined) {
            uncontrolledPlaceholder = value
          }
          emit('update:placeholder', value)
        }"
        @update:model-value="(value) => {
          emit('update:modelValue', value)
          if (value === undefined) {
            emit('clear')
            return
          }
          emit('select', value)
          if (closeOnSelect) {
            close()
          }
        }"
      />
    </PopoverContent>
  </Popover>
</template>
