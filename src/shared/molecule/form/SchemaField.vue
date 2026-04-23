<script setup lang="ts">
import type { FormContext, ValidationResult } from 'vee-validate'
import type * as z from 'zod'
import type {
  ParsedSchemaField,
  SchemaFieldControlSlotProps,
  SchemaFieldDescriptionSlotProps,
  SchemaFieldErrorSlotProps,
  SchemaFieldLabelSlotProps,
  SchemaFieldLabelPosition,
  SchemaFieldMatcher,
  SchemaFieldMode,
  SchemaFieldRenderable,
  SchemaFieldSlots,
  SchemaFieldValidatedPayload,
} from './schemaField.types'
import { useField, useFormContext } from 'vee-validate'
import { computed, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AtomRender from '@/shared/atom/Render.vue'
import {
  schemaFieldBuiltInMatchers,
  schemaFieldDefaultErrorRender,
  schemaFieldDefaultLabelRender,
  schemaFieldHiddenControlFlag,
} from './schemaField.defaults'
import { parseSchemaField, resolveSchemaFieldControl } from './schemaField.parse'

defineOptions({ name: 'SchemaField' })

interface Props {
  bails?: boolean
  controlProps?: Record<string, unknown>
  defaultErrorRender?: (context: SchemaFieldErrorSlotProps) => SchemaFieldRenderable | null | undefined
  defaultLabelRender?: (context: SchemaFieldLabelSlotProps) => SchemaFieldRenderable | null | undefined
  defaultValue?: unknown
  description?: string
  disabled?: boolean
  label?: string
  labelI18nPrefix?: string | null
  labelPosition?: SchemaFieldLabelPosition
  labelRender?: SchemaFieldRenderable | null
  matchers?: readonly SchemaFieldMatcher[]
  mode?: SchemaFieldMode
  modelValue?: unknown
  name?: string
  placeholder?: string
  readonly?: boolean
  required?: boolean
  schema: z.ZodType
  validateOnBlur?: boolean
  validateOnChange?: boolean
  validateOnInput?: boolean
  validateOnMount?: boolean
}

const {
  bails = true,
  controlProps,
  defaultErrorRender = schemaFieldDefaultErrorRender,
  defaultLabelRender = schemaFieldDefaultLabelRender,
  defaultValue,
  description,
  disabled = false,
  label,
  labelI18nPrefix,
  labelPosition = 'top',
  labelRender,
  matchers = [],
  mode = 'standalone',
  modelValue,
  name,
  placeholder,
  readonly = false,
  required,
  schema,
  validateOnBlur = true,
  validateOnChange = true,
  validateOnInput = false,
  validateOnMount = false,
} = defineProps<Props>()

const emit = defineEmits<{
  (event: 'blur', payload?: FocusEvent): void
  (event: 'update:modelValue', value: unknown): void
  (event: 'validated', payload: SchemaFieldValidatedPayload): void
}>()

const slots = defineSlots<SchemaFieldSlots>()
const { t, te } = useI18n()
const parsed = computed<ParsedSchemaField>(() => parseSchemaField(schema))
const formContext = useFormContext<Record<string, unknown>>() as FormContext<Record<string, unknown>> | undefined
const hasName = Boolean(name && name.trim().length > 0)
const shouldUseFormContext = hasName && !!formContext
const fieldName = hasName
  ? name!.trim()
  : `__schema_field_${useId().replaceAll(':', '_')}`
const warnPrefix = hasName
  ? `[SchemaField:${mode}:${fieldName}]`
  : `[SchemaField:${mode}]`

if (mode === 'form-controlled' && !hasName) {
  console.warn(`${warnPrefix} mode=form-controlled but no name provided, fallback to standalone field.`)
}

if (hasName && !formContext) {
  console.warn(`${warnPrefix} name is provided but no form context found, fallback to standalone field.`)
}

if (shouldUseFormContext && (modelValue !== undefined || defaultValue !== undefined)) {
  console.warn(`${warnPrefix} form-controlled field ignores modelValue/defaultValue to avoid dual-state sources.`)
}

const resolvedLabel = computed(() => {
  if (label !== undefined || !hasName) {
    return label
  }
  const key = `${labelI18nPrefix === undefined ? 'form' : labelI18nPrefix || ''}${labelI18nPrefix === undefined || labelI18nPrefix ? '.' : ''}${fieldName}`
  return te(key)
    ? t(key)
    : (te(fieldName) ? t(fieldName) : fieldName)
})

const unwrapWarnings = new Set<string>()
watch(
  parsed,
  (nextParsed) => {
    for (const warning of nextParsed.diagnostics.warnings) {
      if (unwrapWarnings.has(warning)) {
        continue
      }
      unwrapWarnings.add(warning)
      console.warn(`${warnPrefix} ${warning}`)
    }
  },
  { immediate: true },
)

const validateOnValueUpdate = computed(() => validateOnChange || validateOnInput)
const {
  errorMessage,
  errors,
  handleBlur,
  resetField,
  setErrors,
  setTouched,
  setValue,
  validate,
  value,
} = useField(
  fieldName,
  schema as never,
  {
    bails,
    controlled: shouldUseFormContext,
    form: shouldUseFormContext ? formContext : undefined,
    initialValue: shouldUseFormContext ? undefined : (modelValue ?? defaultValue),
    label: resolvedLabel,
    validateOnMount,
    validateOnValueUpdate: validateOnValueUpdate.value,
  },
)

if (!shouldUseFormContext) {
  watch(
    () => modelValue,
    (nextValue) => {
      if (Object.is(nextValue, value.value)) {
        return
      }
      setValue(nextValue as never, false)
    },
  )

  watch(value, (nextValue) => {
    if (Object.is(nextValue, modelValue)) {
      return
    }
    emit('update:modelValue', nextValue)
  })
}

watch(
  [() => parsed.value.facts.kind, () => parsed.value.facts.constraints.literalValues, value],
  ([kind, literalValues, currentValue]) => {
    if (kind !== 'literal') {
      return
    }
    if (!Array.isArray(literalValues) || literalValues.length === 0) {
      return
    }

    const literalValue = literalValues[0]
    if (Object.is(currentValue, literalValue)) {
      return
    }
    setValue(literalValue as never, false)
  },
  { immediate: true },
)

const requiredValue = computed(() => {
  if (typeof required === 'boolean') {
    return required
  }
  return parsed.value.facts.semantics.required
})

const resolvedMatchers = computed<readonly SchemaFieldMatcher[]>(() => [
  ...matchers,
  ...schemaFieldBuiltInMatchers,
])

const matchedControl = computed(() => resolveSchemaFieldControl(
  resolvedMatchers.value,
  schema,
  parsed.value,
))
const isHiddenControl = computed(() => {
  if (!matchedControl.value) {
    return false
  }
  return (matchedControl.value as unknown as Record<PropertyKey, unknown>)[schemaFieldHiddenControlFlag] === true
})
let hasWarnedNoMatch = false

watch(
  matchedControl,
  (component) => {
    if (!component && parsed.value.facts.kind !== 'literal' && !hasWarnedNoMatch) {
      hasWarnedNoMatch = true
      console.warn(`${warnPrefix} no matcher hit schema type "${parsed.value.facts.kind}", field will be skipped.`)
    }
  },
  { immediate: true },
)

async function validateAndEmit(): Promise<ValidationResult> {
  const result = await validate()
  emit('validated', {
    error: errorMessage.value,
    errors: errors.value,
    valid: result.valid,
    value: value.value,
  })
  return result
}

function clear(): void {
  setValue(undefined as never, false)
  setTouched(false)
  setErrors([])
}

function reset(): void {
  resetField()
}

defineExpose({
  clear,
  reset,
  validate: validateAndEmit,
})

const invalid = computed(() => Boolean(errorMessage.value))
const descriptionValue = computed(() => description ?? parsed.value.hints.description)
const controlBind = computed(() => ({
  ...(controlProps ?? {}),
  disabled,
  error: errorMessage.value,
  invalid: invalid.value,
  modelValue: value.value,
  name: hasName ? name : undefined,
  onBlur: (event?: FocusEvent) => {
    handleBlur(event as Event, validateOnBlur)
    emit('blur', event)
    if (validateOnBlur) {
      void validateAndEmit()
    }
  },
  'onUpdate:modelValue': (nextValue: unknown) => {
    setValue(nextValue as never, validateOnValueUpdate.value)
  },
  matchers: resolvedMatchers.value,
  parsed: parsed.value,
  placeholder,
  readonly,
  required: requiredValue.value,
  schema,
}) satisfies Record<string, unknown>)

const controlSlotProps = computed<SchemaFieldControlSlotProps>(() => ({
  bind: controlBind.value,
  component: matchedControl.value as never,
  error: errorMessage.value,
  invalid: invalid.value,
  parsed: parsed.value,
  value: value.value,
}))

const labelSlotProps = computed<SchemaFieldLabelSlotProps>(() => ({
  error: errorMessage.value,
  invalid: invalid.value,
  label: resolvedLabel.value,
  parsed: parsed.value,
  required: requiredValue.value,
}))

const descriptionSlotProps = computed<SchemaFieldDescriptionSlotProps>(() => ({
  description: descriptionValue.value,
  parsed: parsed.value,
}))

const errorSlotProps = computed<SchemaFieldErrorSlotProps>(() => ({
  error: errorMessage.value,
  errors: errors.value,
  invalid: invalid.value,
  parsed: parsed.value,
}))

const resolvedLabelRender = computed(() => labelRender !== undefined
  ? labelRender
  : defaultLabelRender(labelSlotProps.value))

const resolvedErrorRender = computed(() => defaultErrorRender(errorSlotProps.value))
</script>

<template>
  <slot
    v-if="$slots.default"
    :clear="clear"
    :control="controlSlotProps"
    :description="descriptionSlotProps"
    :error="errorSlotProps"
    :label="labelSlotProps"
    :parsed="parsed"
    :reset="reset"
    :validate="validateAndEmit"
  />

  <div
    v-else-if="slots.control || (matchedControl && !isHiddenControl)"
    class="flex flex-col gap-1.5"
    :class="{ 'grid items-start gap-3': labelPosition !== 'top' }"
    :style="labelPosition === 'top'
      ? undefined
      : (labelPosition === 'left'
          ? { gridTemplateColumns: 'auto minmax(0, 1fr)' }
          : { gridTemplateColumns: 'minmax(0, 1fr) auto' })"
  >
    <template v-if="labelPosition !== 'right'">
      <slot name="label" v-bind="labelSlotProps">
        <AtomRender v-if="resolvedLabelRender != null" :render="resolvedLabelRender" />
      </slot>
    </template>

    <div v-if="labelPosition === 'top'" class="contents">
      <slot name="description" v-bind="descriptionSlotProps">
        <p v-if="descriptionValue" class="text-muted-foreground text-xs leading-5">
          {{ descriptionValue }}
        </p>
      </slot>

      <slot name="control" v-bind="controlSlotProps">
        <component :is="matchedControl" v-if="matchedControl" v-bind="controlBind" />
      </slot>

      <slot name="error" v-bind="errorSlotProps">
        <AtomRender v-if="resolvedErrorRender != null" :render="resolvedErrorRender" />
      </slot>
    </div>

    <div v-else class="flex min-w-0 flex-col gap-1.5">
      <slot name="description" v-bind="descriptionSlotProps">
        <p v-if="descriptionValue" class="text-muted-foreground text-xs leading-5">
          {{ descriptionValue }}
        </p>
      </slot>

      <slot name="control" v-bind="controlSlotProps">
        <component :is="matchedControl" v-if="matchedControl" v-bind="controlBind" />
      </slot>

      <slot name="error" v-bind="errorSlotProps">
        <AtomRender v-if="resolvedErrorRender != null" :render="resolvedErrorRender" />
      </slot>
    </div>

    <template v-if="labelPosition === 'right'">
      <slot name="label" v-bind="labelSlotProps">
        <AtomRender v-if="resolvedLabelRender != null" :render="resolvedLabelRender" />
      </slot>
    </template>
  </div>
</template>
