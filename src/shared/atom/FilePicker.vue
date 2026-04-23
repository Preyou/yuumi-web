<script setup lang="ts">
import type { Ref } from 'vue'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shared/ui/input-group'

interface FilePickerDisplayContext {
  file?: File
  fileName?: string
  placeholder: string
}

interface FilePickerProps {
  modelValue?: File

  id?: string
  name?: string
  placeholder?: string

  accept?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean

  openOnFocus?: boolean
  clearable?: boolean

  chooseText?: string
  clearText?: string

  display?: (context: FilePickerDisplayContext) => string
}

const {
  accept = undefined,
  chooseText = '选择文件',
  clearable = true,
  clearText = '清除',
  disabled = false,
  display = undefined,
  id = undefined,
  modelValue = undefined,
  name = undefined,
  openOnFocus = true,
  placeholder = '请选择文件',
  readonly = false,
  required = false,
} = defineProps<FilePickerProps>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: File | undefined): void
  (event: 'select', value: File): void
  (event: 'clear'): void
  (event: 'focus', eventValue: FocusEvent): void
  (event: 'blur', eventValue: FocusEvent): void
}>()

defineSlots<{
  choose?: (props: {
    open: () => void
    disabled: boolean
    readonly: boolean
    text: string
  }) => unknown
  clear?: (props: {
    clear: () => void
    hasValue: boolean
    disabled: boolean
    readonly: boolean
    text: string
  }) => unknown
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const {
  onChange,
  open: openFileDialog,
  reset: resetFileDialog,
} = useFileDialog({
  accept,
  input: fileInputRef as unknown as Ref<HTMLInputElement>,
  multiple: false,
  reset: true,
})

const hasValue = computed(() => modelValue instanceof File)

const displayValue = computed(() => {
  const fileName = modelValue?.name
  if (display) {
    return display({
      file: modelValue,
      fileName,
      placeholder,
    })
  }
  return fileName ?? ''
})

function open(): void {
  if (disabled || readonly) {
    return
  }
  openFileDialog()
}

function clear(): void {
  if (disabled || readonly || !hasValue.value) {
    return
  }

  emit('update:modelValue', undefined)
  emit('clear')
  resetFileDialog()
}

function handleFocus(event: FocusEvent): void {
  emit('focus', event)

  if (!openOnFocus) {
    return
  }
  open()
}

function handleBlur(event: FocusEvent): void {
  emit('blur', event)
}

onChange((files) => {
  const nextFile = files?.[0]
  if (!(nextFile instanceof File)) {
    return
  }

  emit('update:modelValue', nextFile)
  emit('select', nextFile)
})
</script>

<template>
  <InputGroup
    :data-disabled="disabled || undefined"
    :class="readonly ? 'bg-muted/30' : undefined"
  >
    <InputGroupInput
      :id="id"
      readonly
      :model-value="displayValue"
      :placeholder="placeholder"
      :disabled="disabled"
      type="text"
      class="px-3"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <InputGroupAddon align="inline-end" class="gap-1">
      <slot
        name="choose"
        :open="open"
        :disabled="disabled"
        :readonly="readonly"
        :text="chooseText"
      >
        <InputGroupButton
          type="button"
          :disabled="disabled || readonly"
          @click="open"
        >
          {{ chooseText }}
        </InputGroupButton>
      </slot>

      <slot
        v-if="clearable"
        name="clear"
        :clear="clear"
        :has-value="hasValue"
        :disabled="disabled"
        :readonly="readonly"
        :text="clearText"
      >
        <InputGroupButton
          type="button"
          :disabled="disabled || readonly || !hasValue"
          @click="clear"
        >
          {{ clearText }}
        </InputGroupButton>
      </slot>
    </InputGroupAddon>

    <input
      ref="fileInputRef"
      class="sr-only"
      type="file"
      tabindex="-1"
      :name="name"
      :accept="accept"
      :required="required"
      :disabled="disabled || readonly"
    >
  </InputGroup>
</template>
