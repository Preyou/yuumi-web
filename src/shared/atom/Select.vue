<script setup lang="ts">
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

export interface SelectOption {
  disabled?: boolean
  label: string
  value: string
}

type SelectOptionLike = string | SelectOption

interface SelectProps {
  disabled?: boolean
  emptyLabel?: string
  modelValue?: string
  options?: readonly SelectOptionLike[]
  placeholder?: string
  required?: boolean
}

const {
  disabled = false,
  emptyLabel = 'Not set',
  modelValue = undefined,
  options = [],
  placeholder = undefined,
  required = true,
} = defineProps<SelectProps>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | undefined): void
}>()

const EMPTY_VALUE = '__atom_select_empty__'

const normalizedOptions = computed<SelectOption[]>(() => {
  return options.map((option) => {
    if (typeof option === 'string') {
      return {
        label: option,
        value: option,
      }
    }

    return option
  })
})

const currentValue = computed(() => {
  if (modelValue != null) {
    return modelValue
  }

  if (!required) {
    return EMPTY_VALUE
  }

  return undefined
})

function handleUpdate(nextValue: unknown): void {
  if (!required && nextValue === EMPTY_VALUE) {
    emit('update:modelValue', undefined)
    return
  }

  emit('update:modelValue', nextValue == null ? undefined : String(nextValue))
}
</script>

<template>
  <UiSelect
    :disabled="disabled"
    :model-value="currentValue"
    @update:model-value="handleUpdate"
  >
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem v-if="!required" :value="EMPTY_VALUE">
        {{ emptyLabel }}
      </SelectItem>

      <SelectItem
        v-for="option in normalizedOptions"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </SelectItem>
    </SelectContent>
  </UiSelect>
</template>
