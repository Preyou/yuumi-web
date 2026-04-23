<script setup lang="ts">
import type { ValidationResult } from 'vee-validate'
import type * as z from 'zod'
import type {
  ParsedSchemaField,
  SchemaFieldFormControlledProps,
  SchemaFieldLabelPosition,
  SchemaFieldMatcher,
  SchemaFieldRenderable,
  SchemaFormInvalidSubmitPayload,
  SchemaFormSubmitPayload,
} from './schemaField.types'
import { useForm } from 'vee-validate'
import { computed, useAttrs, watch } from 'vue'
import { createSchemaField } from './createSchemaField'
import { parseSchemaField, readObjectShapeFromSchema } from './schemaField.parse'

defineOptions({ name: 'SchemaFormCore' })

type CoreFormValues = Record<string, unknown>
type CoreFormErrors = Record<string, string | undefined>
type CoreFieldBinding = SchemaFieldFormControlledProps & {
  name: string
  schema: z.ZodType
}
type CoreFormApi = {
  clear: () => void
  errors: CoreFormErrors
  isSubmitting: boolean
  isValidating: boolean
  reset: () => void
  submit: () => Promise<unknown>
  submitCount: number
  validate: () => Promise<unknown>
  validateField: (name: string) => Promise<ValidationResult>
  values: CoreFormValues
}

interface Props {
  bails?: boolean
  disabled?: boolean
  initialErrors?: CoreFormErrors
  initialTouched?: Record<string, boolean>
  initialValues?: CoreFormValues
  keepValuesOnUnmount?: boolean
  labelI18nPrefix?: string | null
  labelPosition?: SchemaFieldLabelPosition
  labelRender?: (
    context: {
      error?: string
      key: string
      name: string
      schema: z.ZodType
      value: unknown
      values: CoreFormValues
    },
    parsed: ParsedSchemaField,
  ) => SchemaFieldRenderable | null | undefined
  matchers?: readonly SchemaFieldMatcher[]
  name?: string
  readonly?: boolean
  schema: z.ZodObject
  validateOnBlur?: boolean
  validateOnChange?: boolean
  validateOnInput?: boolean
  validateOnMount?: boolean
}

const {
  bails = true,
  disabled = false,
  initialErrors,
  initialTouched,
  initialValues,
  keepValuesOnUnmount = false,
  labelI18nPrefix,
  labelPosition = 'top',
  labelRender,
  matchers = [],
  name,
  readonly = false,
  schema,
  validateOnBlur = true,
  validateOnChange = true,
  validateOnInput = false,
  validateOnMount = false,
} = defineProps<Props>()

const emit = defineEmits<{
  (event: 'clear'): void
  (event: 'invalidSubmit', payload: SchemaFormInvalidSubmitPayload<z.ZodObject>): void
  (event: 'reset'): void
  (event: 'submit', payload: SchemaFormSubmitPayload<z.ZodObject>): void
}>()

const attrs = useAttrs()
const SchemaField = createSchemaField(matchers, { mode: 'form-controlled' })
const form = useForm<CoreFormValues, CoreFormValues>({
  initialErrors,
  initialTouched,
  initialValues,
  keepValuesOnUnmount,
  name,
  validateOnMount,
  validationSchema: schema,
})

const objectShape = computed(() => readObjectShapeFromSchema(schema as unknown as z.ZodType))
const fieldNames = computed(() => objectShape.value ? Object.keys(objectShape.value) : [])
let hasWarnedInvalidSchema = false

watch(
  objectShape,
  (shape) => {
    if (shape || hasWarnedInvalidSchema) {
      return
    }
    hasWarnedInvalidSchema = true
    console.warn('[SchemaForm] schema is not a renderable zod.object, auto-rendering is disabled.')
  },
  { immediate: true },
)

const parsedByName = computed<Record<string, ParsedSchemaField>>(() => {
  if (!objectShape.value) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(objectShape.value).map(([fieldName, fieldSchema]) => [fieldName, parseSchemaField(fieldSchema)]),
  )
})

const items = computed<Record<string, CoreFieldBinding>>(() => {
  if (!objectShape.value) {
    return {}
  }
  return Object.fromEntries(
    fieldNames.value.flatMap((fieldName) => {
      const fieldSchema = objectShape.value?.[fieldName]
      const parsed = parsedByName.value[fieldName]
      if (!fieldSchema || !parsed) {
        return []
      }
      return [[
        fieldName,
        {
          bails,
          description: parsed.hints.description,
          disabled,
          label: undefined,
          labelI18nPrefix,
          labelPosition,
          labelRender: labelRender
            ? labelRender(
                {
                  error: form.errors.value[fieldName] as string | undefined,
                  key: fieldName,
                  name: fieldName,
                  schema: fieldSchema,
                  value: form.values[fieldName],
                  values: form.values as CoreFormValues,
                },
                parsed,
              )
            : undefined,
          name: fieldName,
          readonly,
          schema: fieldSchema,
          validateOnBlur,
          validateOnChange,
          validateOnInput,
          validateOnMount,
        } satisfies CoreFieldBinding,
      ]]
    }),
  )
})

const fieldEntries = computed(() => fieldNames.value.flatMap((fieldName) => {
  const field = items.value[fieldName]
  const parsed = parsedByName.value[fieldName]
  if (!field || !parsed) {
    return []
  }
  return [{
    field,
    name: fieldName,
    parsed,
  }]
}))

function reset(): void {
  form.resetForm()
  emit('reset')
}

function clear(): void {
  form.resetForm(
    {
      errors: {},
      submitCount: 0,
      touched: {},
      values: Object.fromEntries(fieldNames.value.map((fieldName) => [fieldName, undefined])) as CoreFormValues,
    },
    { force: true },
  )
  emit('clear')
}

const submitHandler = form.handleSubmit(
  (values) => {
    const payload: SchemaFormSubmitPayload<z.ZodObject> = {
      values: values as never,
    }
    emit('submit', payload)
    return payload
  },
  (context) => {
    const payload: SchemaFormInvalidSubmitPayload<z.ZodObject> = {
      errors: context.errors as CoreFormErrors,
      values: context.values as CoreFormValues,
    }
    emit('invalidSubmit', payload)
  },
)

async function submit(): Promise<unknown> {
  return submitHandler()
}

async function validateForm(): Promise<unknown> {
  return form.validate()
}

async function validateField(fieldName: string): Promise<ValidationResult> {
  return form.validateField(fieldName as never)
}

const formApi = computed<CoreFormApi>(() => ({
  clear,
  errors: form.errors.value as CoreFormErrors,
  isSubmitting: form.isSubmitting.value,
  isValidating: form.isValidating.value,
  reset,
  submit,
  submitCount: form.submitCount.value,
  validate: validateForm,
  validateField,
  values: form.values as CoreFormValues,
}))

const defaultSlotProps = computed(() => ({
  ...items.value,
  $form: formApi.value,
}))

const noValidate = computed(() => (attrs.novalidate as boolean | undefined) ?? true)

function onFormReset(event: Event): void {
  ;(attrs.onReset as ((evt: Event) => unknown) | undefined)?.(event)
  if (event.defaultPrevented) {
    return
  }
  event.preventDefault()
  reset()
}

function onFormSubmit(event: Event): void {
  ;(attrs.onSubmit as ((evt: Event) => unknown) | undefined)?.(event)
  if (event.defaultPrevented) {
    return
  }
  event.preventDefault()
  void submitHandler(event)
}

defineExpose({
  clear,
  get errors() {
    return form.errors.value as CoreFormErrors
  },
  get isSubmitting() {
    return form.isSubmitting.value
  },
  get isValidating() {
    return form.isValidating.value
  },
  reset,
  submit,
  get submitCount() {
    return form.submitCount.value
  },
  validate: validateForm,
  validateField,
  get values() {
    return form.values as CoreFormValues
  },
})
</script>

<template>
  <form
    v-bind="$attrs"
    :novalidate="noValidate"
    @reset="onFormReset"
    @submit="onFormSubmit"
  >
    <slot v-if="$slots.default" v-bind="defaultSlotProps" />

    <template v-else>
      <template v-for="entry in fieldEntries" :key="entry.name">
        <slot
          :name="entry.name"
          :field="entry.field"
          :form="formApi"
          :parsed="entry.parsed"
        >
          <SchemaField v-bind="entry.field" />
        </slot>
      </template>
      <slot name="actions" v-bind="formApi" />
    </template>
  </form>
</template>
