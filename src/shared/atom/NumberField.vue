<script setup lang="ts">
import type { NumberFieldRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import {
  NumberField as UiNumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/shared/ui/number-field'

interface Props extends Omit<NumberFieldRootProps, 'as' | 'asChild'> {
  contentClass?: HTMLAttributes['class']
  decrementClass?: HTMLAttributes['class']
  incrementClass?: HTMLAttributes['class']
  placeholder?: string
  inputClass?: HTMLAttributes['class']
  rootClass?: HTMLAttributes['class']
  showControls?: boolean
}

const {
  showControls = true,
} = defineProps<Props>()

const emit = defineEmits<{
  (event: 'blur', value: FocusEvent): void
  (event: 'focus', value: FocusEvent): void
  (event: 'update:modelValue', value: number): void
}>()
</script>

<template>
  <UiNumberField
    :id="id"
    :name="name"
    :required="required"
    :default-value="defaultValue"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :step-snapping="stepSnapping"
    :focus-on-change="focusOnChange"
    :format-options="formatOptions"
    :locale="locale"
    :disabled="disabled"
    :readonly="readonly"
    :disable-wheel-change="disableWheelChange"
    :invert-wheel-change="invertWheelChange"
    :class="rootClass"
    @update:model-value="(value: number) => emit('update:modelValue', value)"
  >
    <NumberFieldContent :class="contentClass">
      <NumberFieldDecrement v-if="showControls && $slots.decrement" :class="decrementClass">
        <slot name="decrement" />
      </NumberFieldDecrement>
      <NumberFieldDecrement v-else-if="showControls" :class="decrementClass" />

      <NumberFieldInput
        :class="inputClass"
        :placeholder="placeholder"
        @focus="(event: FocusEvent) => emit('focus', event)"
        @blur="(event: FocusEvent) => emit('blur', event)"
      />

      <NumberFieldIncrement v-if="showControls && $slots.increment" :class="incrementClass">
        <slot name="increment" />
      </NumberFieldIncrement>
      <NumberFieldIncrement v-else-if="showControls" :class="incrementClass" />
    </NumberFieldContent>
  </UiNumberField>
</template>
