import type { ValidationResult } from 'vee-validate'
import type {
  Component,
  DefineComponent,
  RenderFunction,
  VNode,
} from 'vue'
import type * as z from 'zod'

export type SchemaFieldMode = 'standalone' | 'form-controlled'

export interface CreateSchemaFieldOptions {
  errorRender?: (context: SchemaFieldErrorSlotProps) => SchemaFieldRenderable | null | undefined
  labelRender?: (context: SchemaFieldLabelSlotProps) => SchemaFieldRenderable | null | undefined
  mode?: SchemaFieldMode
}

export interface ParsedSchemaFieldWrappers {
  optional: boolean
  nullable: boolean
  default: boolean
  prefault: boolean
  catch: boolean
  readonly: boolean
  nonoptional: boolean
  pipe: boolean
  transform: boolean
}

export interface ParsedSchemaFieldSemantics {
  acceptsNull: boolean
  acceptsUndefined: boolean
  required: boolean
}

export interface ParsedSchemaFieldConstraints {
  enumValues?: readonly unknown[]
  format?: string
  integer?: boolean
  length?: number
  literalValues?: readonly unknown[]
  max?: number
  maxLength?: number
  min?: number
  minLength?: number
  multipleOf?: number
  pattern?: RegExp
}

export interface ParsedSchemaFieldStructure {
  isArray: boolean
  isEnum: boolean
  isLiteral: boolean
  isObject: boolean
  isRecord: boolean
  isTuple: boolean
  isUnion: boolean
  shapeKeys: readonly string[]
}

export interface ParsedSchemaFieldFacts {
  constraints: ParsedSchemaFieldConstraints
  kind: string
  semantics: ParsedSchemaFieldSemantics
  structure: ParsedSchemaFieldStructure
  wrappers: ParsedSchemaFieldWrappers
}

export interface ParsedSchemaFieldHints {
  description?: string
  meta: unknown
}

export interface ParsedSchemaFieldDiagnostics {
  warnings: readonly string[]
  wrapperChain: readonly string[]
}

export interface ParsedSchemaField {
  baseSchema: z.ZodType
  diagnostics: ParsedSchemaFieldDiagnostics
  facts: ParsedSchemaFieldFacts
  hints: ParsedSchemaFieldHints
  rawSchema: z.ZodType
}

export interface SchemaFieldControlProps<TValue = unknown> {
  disabled?: boolean
  error?: string
  invalid?: boolean
  matchers?: readonly SchemaFieldMatcher[]
  modelValue?: TValue
  name?: string
  parsed: ParsedSchemaField
  placeholder?: string
  readonly?: boolean
  required?: boolean
  schema: z.ZodType
}

export type SchemaFieldControlComponent<TValue = unknown> = Component & {
  new(): {
    $props: SchemaFieldControlProps<TValue> & {
      'onUpdate:modelValue'?: (value: TValue) => unknown
      'onBlur'?: (event?: FocusEvent) => unknown
    }
  }
}

export type SchemaFieldMatcher = (
  schema: z.ZodType,
  parsed: ParsedSchemaField,
) => SchemaFieldControlComponent | null | undefined

export type SchemaFieldLabelPosition = 'top' | 'left' | 'right'

export type SchemaFieldRenderable
  = | Component
    | RenderFunction
    | VNode
    | string

export interface SchemaFieldCommonProps {
  bails?: boolean
  controlProps?: Record<string, unknown>
  defaultValue?: unknown
  description?: string
  disabled?: boolean
  label?: string
  labelI18nPrefix?: string | null
  labelPosition?: SchemaFieldLabelPosition
  labelRender?: SchemaFieldRenderable | null
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

export interface SchemaFieldStandaloneProps extends SchemaFieldCommonProps {
  modelValue?: unknown
}

export interface SchemaFieldFormControlledProps extends Omit<SchemaFieldCommonProps, 'name' | 'defaultValue'> {
  defaultValue?: never
  modelValue?: never
  name: string
}

export interface SchemaFieldValidatedPayload {
  error?: string
  errors: string[]
  valid: boolean
  value: unknown
}

export interface SchemaFieldControlSlotProps {
  bind: Record<string, unknown>
  component: SchemaFieldControlComponent
  error?: string
  invalid: boolean
  parsed: ParsedSchemaField
  value: unknown
}

export interface SchemaFieldLabelSlotProps {
  error?: string
  invalid: boolean
  label?: string
  parsed: ParsedSchemaField
  required: boolean
}

export interface SchemaFieldDescriptionSlotProps {
  description?: string
  parsed: ParsedSchemaField
}

export interface SchemaFieldErrorSlotProps {
  error?: string
  errors: string[]
  invalid: boolean
  parsed: ParsedSchemaField
}

export interface SchemaFieldDefaultSlotProps {
  clear: () => void
  control: SchemaFieldControlSlotProps
  description: SchemaFieldDescriptionSlotProps
  error: SchemaFieldErrorSlotProps
  label: SchemaFieldLabelSlotProps
  parsed: ParsedSchemaField
  reset: () => void
  validate: () => Promise<ValidationResult>
}

export interface SchemaFieldExpose {
  clear: () => void
  reset: () => void
  validate: () => Promise<ValidationResult>
}

export interface SchemaFieldSlots {
  control?: (slotProps: SchemaFieldControlSlotProps) => unknown
  default?: (slotProps: SchemaFieldDefaultSlotProps) => unknown
  description?: (slotProps: SchemaFieldDescriptionSlotProps) => unknown
  error?: (slotProps: SchemaFieldErrorSlotProps) => unknown
  label?: (slotProps: SchemaFieldLabelSlotProps) => unknown
}

export type SchemaFieldStandaloneComponent = DefineComponent<SchemaFieldStandaloneProps> & {
  new(): {
    $emit: {
      (event: 'blur', payload?: FocusEvent): void
      (event: 'update:modelValue', value: unknown): void
      (event: 'validated', payload: SchemaFieldValidatedPayload): void
    }
    $exposed: SchemaFieldExpose
    $props: SchemaFieldStandaloneProps
    $slots: SchemaFieldSlots
  }
}

export type SchemaFieldFormControlledComponent = DefineComponent<SchemaFieldFormControlledProps> & {
  new(): {
    $emit: {
      (event: 'blur', payload?: FocusEvent): void
      (event: 'validated', payload: SchemaFieldValidatedPayload): void
    }
    $exposed: SchemaFieldExpose
    $props: SchemaFieldFormControlledProps
    $slots: SchemaFieldSlots
  }
}

export type SchemaFieldComponentByMode<TMode extends SchemaFieldMode>
  = TMode extends 'form-controlled'
    ? SchemaFieldFormControlledComponent
    : SchemaFieldStandaloneComponent

export type SchemaFormSchema = z.ZodObject
export type SchemaFormInput<TSchema extends SchemaFormSchema> = z.input<TSchema>
export type SchemaFormOutput<TSchema extends SchemaFormSchema> = z.output<TSchema>
export type SchemaFormFieldName<TSchema extends SchemaFormSchema> = Extract<keyof SchemaFormInput<TSchema>, string>

export interface SchemaFormLabelRenderContext<
  TSchema extends SchemaFormSchema,
  TName extends SchemaFormFieldName<TSchema> = SchemaFormFieldName<TSchema>,
> {
  error?: string
  key: TName
  name: TName
  schema: z.ZodType
  value: SchemaFormInput<TSchema>[TName] | undefined
  values: SchemaFormInput<TSchema>
}

export interface SchemaFormFieldBinding<
  TSchema extends SchemaFormSchema,
  TName extends SchemaFormFieldName<TSchema> = SchemaFormFieldName<TSchema>,
> extends SchemaFieldFormControlledProps {
  name: TName
  schema: z.ZodType
}

export type SchemaFormItems<TSchema extends SchemaFormSchema> = {
  [K in SchemaFormFieldName<TSchema>]: SchemaFormFieldBinding<TSchema, K>
}

export interface SchemaFormSubmitPayload<TSchema extends SchemaFormSchema> {
  values: SchemaFormOutput<TSchema>
}

export interface SchemaFormInvalidSubmitPayload<TSchema extends SchemaFormSchema> {
  errors: Record<string, string | undefined>
  values: SchemaFormInput<TSchema>
}

export interface SchemaFormApi<TSchema extends SchemaFormSchema> {
  clear: () => void
  errors: Record<string, string | undefined>
  isSubmitting: boolean
  isValidating: boolean
  reset: () => void
  submit: () => Promise<unknown>
  submitCount: number
  validate: () => Promise<unknown>
  validateField: (name: SchemaFormFieldName<TSchema>) => Promise<ValidationResult>
  values: SchemaFormInput<TSchema>
}

export type SchemaFormDefaultSlotProps<TSchema extends SchemaFormSchema>
  = & SchemaFormItems<TSchema>
    & {
      $form: SchemaFormApi<TSchema>
    }

export interface SchemaFormFieldSlotProps<
  TSchema extends SchemaFormSchema,
  TName extends SchemaFormFieldName<TSchema> = SchemaFormFieldName<TSchema>,
> {
  field: SchemaFormFieldBinding<TSchema, TName>
  form: SchemaFormApi<TSchema>
  parsed: ParsedSchemaField
}

export type SchemaFormNamedFieldSlots<TSchema extends SchemaFormSchema> = {
  [K in SchemaFormFieldName<TSchema>]?: (slotProps: SchemaFormFieldSlotProps<TSchema, K>) => unknown
}

export type SchemaFormSlots<TSchema extends SchemaFormSchema>
  = & SchemaFormNamedFieldSlots<TSchema>
    & {
      actions?: (slotProps: SchemaFormApi<TSchema>) => unknown
      default?: (slotProps: SchemaFormDefaultSlotProps<TSchema>) => unknown
    }

export interface SchemaFormProps<TSchema extends SchemaFormSchema> {
  bails?: boolean
  disabled?: boolean
  initialErrors?: Partial<Record<SchemaFormFieldName<TSchema>, string | undefined>>
  initialTouched?: Partial<Record<SchemaFormFieldName<TSchema>, boolean>>
  initialValues?: Partial<SchemaFormInput<TSchema>>
  keepValuesOnUnmount?: boolean
  labelI18nPrefix?: string | null
  labelPosition?: SchemaFieldLabelPosition
  labelRender?: (
    context: SchemaFormLabelRenderContext<TSchema>,
    parsed: ParsedSchemaField,
  ) => SchemaFieldRenderable | null | undefined
  name?: string
  readonly?: boolean
  schema: TSchema
  validateOnBlur?: boolean
  validateOnChange?: boolean
  validateOnInput?: boolean
  validateOnMount?: boolean
}

export interface SchemaFormExpose<TSchema extends SchemaFormSchema> extends SchemaFormApi<TSchema> {}

export type SchemaFormComponent<TSchema extends SchemaFormSchema> = DefineComponent<SchemaFormProps<TSchema>> & {
  new(): {
    $emit: {
      (event: 'clear'): void
      (event: 'invalidSubmit', payload: SchemaFormInvalidSubmitPayload<TSchema>): void
      (event: 'reset'): void
      (event: 'submit', payload: SchemaFormSubmitPayload<TSchema>): void
    }
    $exposed: SchemaFormExpose<TSchema>
    $props: SchemaFormProps<TSchema>
    $slots: SchemaFormSlots<TSchema>
  }
}
