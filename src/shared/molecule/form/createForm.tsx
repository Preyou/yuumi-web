import type {
  FieldSlotProps,
  InvalidSubmissionContext,
  SubmissionContext,
} from 'vee-validate'
import type {
  Component,
  DefineComponent,
  PropType,
} from 'vue'
import type {
  input as ZodInput,
  output as ZodOutput,
  ZodObject,
  ZodRawShape,
  ZodType,
} from 'zod'
import { Field, useForm } from 'vee-validate'
import * as z from 'zod'
import AtomButton from '@/shared/atom/Button.vue'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'

type FormValues = Record<string, unknown>
type ZodObjectSchema = ZodObject<ZodRawShape>
type FormInput<TSchema extends ZodObjectSchema> = ZodInput<TSchema>
type FormOutput<TSchema extends ZodObjectSchema> = ZodOutput<TSchema>
type FormFieldName<TSchema extends ZodObjectSchema> = Extract<keyof FormInput<TSchema>, string>
type FormFieldNames<TValues extends FormValues> = Extract<keyof TValues, string>

type FieldInputType = 'email' | 'number' | 'password' | 'text'

interface ZodDefinitionReader {
  _zod?: {
    def?: {
      in?: ZodType<unknown>
      type?: string
    }
  }
}

interface AutoSelectWidgetProps {
  disabled?: boolean
  emptyLabel?: string
  modelValue?: string
  options?: readonly string[]
  placeholder?: string
  required?: boolean
}

const EMPTY_SELECT_VALUE = '__auto_form_empty__'

const AutoSelectWidget = defineComponent({
  emits: {
    'update:modelValue': (_value: string | undefined) => true,
  },
  name: 'AutoSelectWidget',
  props: {
    disabled: {
      default: false,
      type: Boolean,
    },
    emptyLabel: {
      default: 'Not set',
      type: String,
    },
    modelValue: {
      default: undefined,
      type: String,
    },
    options: {
      default: () => [],
      type: Array as PropType<readonly string[]>,
    },
    placeholder: {
      default: undefined,
      type: String,
    },
    required: {
      default: true,
      type: Boolean,
    },
  },
  setup(props, { emit }) {
    return () => {
      const currentValue = props.modelValue ?? (!props.required ? EMPTY_SELECT_VALUE : undefined)

      return (
        <Select
          disabled={props.disabled}
          modelValue={currentValue}
          {...{
            'onUpdate:modelValue': (nextValue: unknown) => {
              if (!props.required && nextValue === EMPTY_SELECT_VALUE) {
                emit('update:modelValue', undefined)
                return
              }
              emit('update:modelValue', nextValue == null ? undefined : String(nextValue))
            },
          }}
        >
          <SelectTrigger class="w-full">
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {!props.required
              ? (
                  <SelectItem value={EMPTY_SELECT_VALUE}>{props.emptyLabel}</SelectItem>
                )
              : null}
            {props.options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
  },
})

const builtinWidgets = {
  input: Input,
  select: AutoSelectWidget,
  switch: Switch,
  textarea: Textarea,
} as const

type BuiltinWidgetKey = keyof typeof builtinWidgets
type WidgetValue = BuiltinWidgetKey | Component

type ComponentProps<TComponent> =
  TComponent extends new (...args: any[]) => { $props: infer TProps }
    ? TProps
    : TComponent extends (props: infer TProps, ...args: any[]) => any
      ? TProps
      : Record<string, unknown>

type WidgetPropsByBuiltin = {
  [K in BuiltinWidgetKey]: ComponentProps<(typeof builtinWidgets)[K]>
}

type InferWidgetProps<TWidget extends WidgetValue> =
  TWidget extends BuiltinWidgetKey
    ? WidgetPropsByBuiltin[TWidget]
    : ComponentProps<TWidget>

export interface ResolvedFieldState<TName extends string = string, TWidget extends WidgetValue = WidgetValue> {
  disabled: boolean
  hidden: boolean
  label: string
  name: TName
  required: boolean
  widget: TWidget
}

export interface FieldBehaviorContext<
  TValues extends FormValues,
  TName extends FormFieldNames<TValues>,
> {
  fields: Readonly<Record<FormFieldNames<TValues>, ResolvedFieldState<FormFieldNames<TValues>>>>
  name: TName
  values: Readonly<TValues>
}

export interface WidgetModelConfig<TValue = unknown> {
  event?: string
  fromWidget?: (widgetValue: unknown) => TValue
  prop?: string
  toWidget?: (formValue: TValue) => unknown
}

export interface WidgetPropsContext<
  TValues extends FormValues,
  TName extends FormFieldNames<TValues>,
> extends FieldBehaviorContext<TValues, TName> {
  bind: Record<string, unknown>
  disabled: boolean
  error: string | undefined
  hidden: boolean
  isSubmitting: boolean
  label: string
  required: boolean
  setTouched: (isTouched?: boolean) => void
  setValue: (value: TValues[TName]) => void
  submitCount: number
  validate: () => Promise<unknown>
  value: TValues[TName]
}

export type WidgetPropsSource<
  TValues extends FormValues,
  TName extends FormFieldNames<TValues>,
  TWidget extends WidgetValue,
> =
  | InferWidgetProps<TWidget>
  | ((context: WidgetPropsContext<TValues, TName>) => InferWidgetProps<TWidget>)

export interface FormFieldConfig<
  TValues extends FormValues,
  TName extends FormFieldNames<TValues>,
  TWidget extends WidgetValue = BuiltinWidgetKey,
> {
  disabled?: boolean
  hidden?: boolean
  label?: string
  model?: WidgetModelConfig<TValues[TName]>
  widget?: TWidget
  widgetProps?: WidgetPropsSource<TValues, TName, TWidget>
}

export type FormFieldRule<
  TValues extends FormValues,
  TName extends FormFieldNames<TValues>,
  TWidget extends WidgetValue = BuiltinWidgetKey,
> =
  | FormFieldConfig<TValues, TName, TWidget>
  | ((context: FieldBehaviorContext<TValues, TName>) => FormFieldConfig<TValues, TName, TWidget>)

export type CreateFormFields<TValues extends FormValues> = Partial<{
  [K in FormFieldNames<TValues>]: FormFieldRule<TValues, K, WidgetValue>
}>

export interface CreateFormOptions<TSchema extends ZodObjectSchema> {
  fields?: CreateFormFields<FormInput<TSchema>>
  submitText?: string
}

export interface CreateFormDefaultSlotProps<TSchema extends ZodObjectSchema> {
  errors: Partial<Record<FormFieldName<TSchema>, string | undefined>>
  fields: readonly ResolvedFieldState<FormFieldName<TSchema>>[]
  isSubmitting: boolean
  renderField: (name: FormFieldName<TSchema>) => unknown
  values: FormInput<TSchema>
}

export interface CreateFormFieldSlotProps<TSchema extends ZodObjectSchema> {
  field: ResolvedFieldState<FormFieldName<TSchema>>
  slotProps: FieldSlotProps<unknown>
}

export interface CreateFormActionsSlotProps {
  isSubmitting: boolean
}

export interface VeeFormProps<TSchema extends ZodObjectSchema> {
  class?: string
  initialValues?: Partial<FormInput<TSchema>>
  submitDisabled?: boolean
  submitText?: string
}

export type VeeFormComponent<TSchema extends ZodObjectSchema> = DefineComponent<VeeFormProps<TSchema>> & {
  new(): {
    $emit: {
      (event: 'invalidSubmit', context: InvalidSubmissionContext<FormInput<TSchema>, FormOutput<TSchema>>): void
      (event: 'submit', values: FormOutput<TSchema>, context: SubmissionContext<FormInput<TSchema>>): void
    }
    $props: VeeFormProps<TSchema>
    $slots: {
      actions?: (slotProps: CreateFormActionsSlotProps) => unknown
      default?: (slotProps: CreateFormDefaultSlotProps<TSchema>) => unknown
      field?: (slotProps: CreateFormFieldSlotProps<TSchema>) => unknown
    }
  }
}

interface SchemaFieldMeta<TName extends string = string> {
  defaultWidget: BuiltinWidgetKey
  enumOptions: readonly string[]
  name: TName
  required: boolean
  zodType: string
}

interface InternalFieldState<TValues extends FormValues, TName extends FormFieldNames<TValues> = FormFieldNames<TValues>>
  extends ResolvedFieldState<TName> {
  enumOptions: readonly string[]
  model?: WidgetModelConfig<TValues[TName]>
  widgetProps?: WidgetPropsSource<TValues, TName, WidgetValue>
  zodType: string
}

function inferInputType(name: string, zodType: string): FieldInputType {
  if (zodType === 'number') {
    return 'number'
  }

  const normalizedName = name.toLowerCase()
  if (normalizedName.includes('password')) {
    return 'password'
  }
  if (normalizedName.includes('email')) {
    return 'email'
  }
  return 'text'
}

function inferWidget(zodType: string, enumOptions: readonly string[]): BuiltinWidgetKey {
  if (enumOptions.length > 0 || zodType === 'enum') {
    return 'select'
  }
  if (zodType === 'boolean') {
    return 'switch'
  }
  if (zodType === 'number' || zodType === 'bigint' || zodType === 'string') {
    return 'input'
  }
  return 'textarea'
}

function toLabel(fieldName: string): string {
  const spaced = fieldName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!spaced) {
    return fieldName
  }

  return `${spaced.slice(0, 1).toUpperCase()}${spaced.slice(1)}`
}

function readZodType(schema: ZodType<unknown>): string {
  const type = (schema as ZodDefinitionReader)._zod?.def?.type
  return typeof type === 'string' ? type : 'unknown'
}

function readEnumOptions(schema: ZodType<unknown>): readonly string[] {
  const options = (schema as unknown as { options?: readonly unknown[] }).options
  if (!Array.isArray(options)) {
    return []
  }
  return options.map(option => String(option))
}

function unwrapSchema(schema: ZodType<unknown>): {
  required: boolean
  schema: ZodType<unknown>
} {
  let required = true
  let current: ZodType<unknown> = schema

  while (true) {
    if (current instanceof z.ZodOptional) {
      required = false
      current = current.unwrap() as unknown as ZodType<unknown>
      continue
    }
    if (current instanceof z.ZodDefault) {
      required = false
      current = current.removeDefault() as unknown as ZodType<unknown>
      continue
    }
    if (current instanceof z.ZodCatch) {
      required = false
      current = current.removeCatch() as unknown as ZodType<unknown>
      continue
    }
    if (current instanceof z.ZodNullable || current instanceof z.ZodReadonly) {
      current = current.unwrap() as unknown as ZodType<unknown>
      continue
    }
    if (current instanceof z.ZodPipe) {
      const inputSchema = (current as unknown as ZodDefinitionReader)._zod?.def?.in
      if (inputSchema) {
        current = inputSchema
        continue
      }
    }
    break
  }

  return {
    required,
    schema: current,
  }
}

function resolveSchemaFields<TSchema extends ZodObjectSchema>(schema: TSchema): readonly SchemaFieldMeta<FormFieldName<TSchema>>[] {
  const shape = schema.shape as ZodRawShape

  return Object.entries(shape).map(([fieldName, fieldSchema]) => {
    const typedFieldName = fieldName as FormFieldName<TSchema>
    const { required, schema: baseSchema } = unwrapSchema(fieldSchema as ZodType<unknown>)
    const zodType = readZodType(baseSchema)
    const enumOptions = readEnumOptions(baseSchema)

    return {
      defaultWidget: inferWidget(zodType, enumOptions),
      enumOptions,
      name: typedFieldName,
      required,
      zodType,
    }
  })
}

function toPublicFieldMap<TValues extends FormValues>(
  fieldStateMap: Record<FormFieldNames<TValues>, InternalFieldState<TValues>>,
): Record<FormFieldNames<TValues>, ResolvedFieldState<FormFieldNames<TValues>>> {
  const entries = Object.entries(fieldStateMap).map(([fieldName, fieldState]) => {
    return [
      fieldName,
      {
        disabled: fieldState.disabled,
        hidden: fieldState.hidden,
        label: fieldState.label,
        name: fieldState.name,
        required: fieldState.required,
        widget: fieldState.widget,
      },
    ]
  })

  return Object.fromEntries(entries) as Record<FormFieldNames<TValues>, ResolvedFieldState<FormFieldNames<TValues>>>
}

function serializeJsonValue(value: unknown): string {
  if (value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

function isBuiltinWidgetKey(widget: WidgetValue): widget is BuiltinWidgetKey {
  return typeof widget === 'string' && widget in builtinWidgets
}

export function createForm<TSchema extends ZodObjectSchema>(
  schema: TSchema,
  options: CreateFormOptions<TSchema> = {},
): VeeFormComponent<TSchema> {
  type TValues = FormInput<TSchema>
  type TFieldName = FormFieldName<TSchema>

  const schemaFields = resolveSchemaFields(schema)
  const schemaFieldMap = new Map(schemaFields.map(field => [field.name, field]))

  const component = defineComponent({
    emits: ['invalidSubmit', 'submit'],
    inheritAttrs: false,
    name: 'AutoGeneratedForm',
    props: {
      class: {
        default: '',
        type: String,
      },
      initialValues: {
        default: undefined,
        type: Object as PropType<Partial<TValues>>,
      },
      submitDisabled: {
        default: false,
        type: Boolean,
      },
      submitText: {
        default: undefined,
        type: String,
      },
    },
    setup(props, { attrs, emit, slots }) {
      type UseFormOptions = NonNullable<Parameters<typeof useForm<TValues, FormOutput<TSchema>>>[0]>
      const jsonDrafts = reactive<Record<string, string>>({})
      const jsonErrors = reactive<Record<string, string | undefined>>({})

      const {
        errors,
        handleSubmit,
        isSubmitting,
        submitCount,
        values,
      } = useForm<TValues, FormOutput<TSchema>>({
        initialValues: props.initialValues as UseFormOptions['initialValues'],
        validationSchema: schema,
      })

      const resolveFieldStateMap = (): Record<TFieldName, InternalFieldState<TValues>> => {
        const baseMap = Object.fromEntries(
          schemaFields.map((field) => {
            return [
              field.name,
              {
                disabled: false,
                enumOptions: field.enumOptions,
                hidden: false,
                label: toLabel(field.name),
                name: field.name,
                required: field.required,
                widget: field.defaultWidget,
                zodType: field.zodType,
              },
            ]
          }),
        ) as Record<TFieldName, InternalFieldState<TValues>>

        const applyRules = (
          current: Record<TFieldName, InternalFieldState<TValues>>,
        ): Record<TFieldName, InternalFieldState<TValues>> => {
          const publicFields = toPublicFieldMap(current)
          const resolveRule = (
            rule: FormFieldRule<TValues, TFieldName, WidgetValue> | undefined,
            context: FieldBehaviorContext<TValues, TFieldName>,
          ): FormFieldConfig<TValues, TFieldName, WidgetValue> | undefined => {
            if (typeof rule === 'function') {
              return rule(context)
            }
            return rule
          }

          return Object.fromEntries(
            schemaFields.map((field) => {
              const rule = options.fields?.[field.name as keyof NonNullable<typeof options.fields>]
              const context: FieldBehaviorContext<TValues, TFieldName> = {
                fields: publicFields,
                name: field.name,
                values,
              }

              const resolvedRule = resolveRule(
                rule as FormFieldRule<TValues, TFieldName, WidgetValue> | undefined,
                context,
              )

              const currentState = current[field.name]

              return [
                field.name,
                {
                  ...currentState,
                  disabled: resolvedRule?.disabled ?? currentState.disabled,
                  hidden: resolvedRule?.hidden ?? currentState.hidden,
                  label: resolvedRule?.label ?? currentState.label,
                  model: resolvedRule?.model,
                  widget: resolvedRule?.widget ?? currentState.widget,
                  widgetProps: resolvedRule?.widgetProps,
                },
              ]
            }),
          ) as Record<TFieldName, InternalFieldState<TValues>>
        }

        return applyRules(applyRules(baseMap))
      }

      const onSubmit = handleSubmit(
        (submitValues, submitContext) => {
          emit('submit', submitValues, submitContext)
        },
        (invalidContext) => {
          emit('invalidSubmit', invalidContext)
        },
      )

      return () => {
        const fieldStateMap = resolveFieldStateMap()
        const visibleFields = schemaFields
          .map(field => fieldStateMap[field.name])
          .filter(field => !field.hidden)
        const publicFieldMap = toPublicFieldMap(fieldStateMap)

        const renderField = (name: TFieldName) => {
          const fieldState = fieldStateMap[name]
          if (!fieldState || fieldState.hidden) {
            return null
          }

          const schemaField = schemaFieldMap.get(name)
          if (!schemaField) {
            return null
          }

          return (
            <Field
              key={name}
              name={name}
              label={fieldState.label}
              v-slots={{
                default: (fieldSlotProps: FieldSlotProps<unknown>) => {
                  const combinedError = jsonErrors[name] ?? fieldSlotProps.errorMessage
                  const widget = fieldState.widget
                  const widgetComponent = isBuiltinWidgetKey(widget)
                    ? builtinWidgets[widget]
                    : widget

                  const modelProp = fieldState.model?.prop ?? 'modelValue'
                  const modelEvent = fieldState.model?.event ?? 'onUpdate:modelValue'

                  const defaultToWidget = (formValue: unknown): unknown => {
                    if (isBuiltinWidgetKey(widget) && widget === 'switch') {
                      return formValue === true
                    }

                    if (isBuiltinWidgetKey(widget) && widget === 'select') {
                      if (formValue == null) {
                        return schemaField.required ? undefined : EMPTY_SELECT_VALUE
                      }
                      return String(formValue)
                    }

                    if (isBuiltinWidgetKey(widget) && widget === 'textarea' && schemaField.zodType !== 'string') {
                      if (Object.prototype.hasOwnProperty.call(jsonDrafts, name)) {
                        return jsonDrafts[name]
                      }
                      return serializeJsonValue(formValue)
                    }

                    if (typeof formValue === 'bigint') {
                      return formValue.toString()
                    }

                    if (formValue == null) {
                      return ''
                    }

                    return formValue
                  }

                  const defaultFromWidget = (widgetValue: unknown): unknown => {
                    if (isBuiltinWidgetKey(widget) && widget === 'switch') {
                      return Boolean(widgetValue)
                    }

                    if (isBuiltinWidgetKey(widget) && widget === 'select') {
                      if (!schemaField.required && widgetValue === EMPTY_SELECT_VALUE) {
                        return undefined
                      }
                      return widgetValue == null ? undefined : String(widgetValue)
                    }

                    if (isBuiltinWidgetKey(widget) && widget === 'textarea' && schemaField.zodType !== 'string') {
                      const normalized = String(widgetValue ?? '')
                      jsonDrafts[name] = normalized

                      if (!normalized.trim()) {
                        jsonErrors[name] = undefined
                        return undefined
                      }

                      try {
                        const parsed = JSON.parse(normalized)
                        jsonErrors[name] = undefined
                        return parsed
                      }
                      catch {
                        jsonErrors[name] = 'JSON is invalid'
                        return normalized
                      }
                    }

                    const normalized = typeof widgetValue === 'string' || typeof widgetValue === 'number'
                      ? String(widgetValue)
                      : widgetValue

                    if (isBuiltinWidgetKey(widget) && widget === 'input' && schemaField.zodType === 'number') {
                      const text = String(normalized ?? '')
                      if (!text.trim()) {
                        return undefined
                      }
                      const asNumber = Number(text)
                      return Number.isNaN(asNumber) ? text : asNumber
                    }

                    if (typeof normalized === 'string' && !schemaField.required && !normalized.trim()) {
                      return undefined
                    }

                    return normalized
                  }

                  const toWidget = fieldState.model?.toWidget ?? defaultToWidget
                  const fromWidget = fieldState.model?.fromWidget ?? defaultFromWidget

                  const currentValue = fieldSlotProps.value as TValues[TFieldName]
                  const boundValue = toWidget(currentValue)

                  const bind: Record<string, unknown> = {
                    [modelEvent]: (nextValue: unknown) => {
                      const nextFormValue = fromWidget(nextValue) as TValues[TFieldName]
                      fieldSlotProps.setValue(nextFormValue)
                    },
                    [modelProp]: boundValue,
                    disabled: fieldState.disabled,
                    name,
                    onBlur: fieldSlotProps.handleBlur,
                  }

                  const widgetContext: WidgetPropsContext<TValues, TFieldName> = {
                    bind,
                    disabled: fieldState.disabled,
                    error: combinedError,
                    fields: publicFieldMap,
                    hidden: fieldState.hidden,
                    isSubmitting: isSubmitting.value,
                    label: fieldState.label,
                    name,
                    required: fieldState.required,
                    setTouched: (isTouched = true) => fieldSlotProps.setTouched(isTouched),
                    setValue: value => fieldSlotProps.setValue(value),
                    submitCount: submitCount.value,
                    validate: fieldSlotProps.validate,
                    value: currentValue,
                    values,
                  }

                  const resolvedWidgetProps = typeof fieldState.widgetProps === 'function'
                    ? fieldState.widgetProps(widgetContext)
                    : fieldState.widgetProps

                  const defaultWidgetProps = isBuiltinWidgetKey(widget) && widget === 'input'
                    ? ({ type: inferInputType(name, schemaField.zodType) } as Record<string, unknown>)
                    : isBuiltinWidgetKey(widget) && widget === 'select'
                      ? ({
                          options: schemaField.enumOptions,
                          placeholder: `Select ${fieldState.label}`,
                          required: schemaField.required,
                        } as Record<string, unknown>)
                      : isBuiltinWidgetKey(widget) && widget === 'textarea' && schemaField.zodType !== 'string'
                        ? ({ placeholder: 'Input JSON' } as Record<string, unknown>)
                        : ({ } as Record<string, unknown>)

                  const mergedWidgetProps = {
                    ...defaultWidgetProps,
                    ...(resolvedWidgetProps as Record<string, unknown> | undefined),
                    ...bind,
                  }

                  const Widget = widgetComponent as any

                  const control = slots.field
                    ? slots.field({
                        field: {
                          disabled: fieldState.disabled,
                          hidden: fieldState.hidden,
                          label: fieldState.label,
                          name,
                          required: fieldState.required,
                          widget: fieldState.widget,
                        },
                        slotProps: fieldSlotProps,
                      })
                    : <Widget {...mergedWidgetProps} />

                  return (
                    <div class="grid gap-2">
                      <div class="flex items-center justify-between gap-2">
                        <Label>
                          {fieldState.label}
                          {fieldState.required
                            ? (
                                <span class="text-destructive"> *</span>
                              )
                            : null}
                        </Label>
                      </div>

                      {control}

                      {combinedError
                        ? (
                            <p class="text-destructive text-xs">{combinedError}</p>
                          )
                        : null}
                    </div>
                  )
                },
              }}
            />
          )
        }

        const { class: attrsClass, ...formAttrs } = attrs as Record<string, unknown>
        const mergedClass = $cn(
          'grid gap-4',
          typeof attrsClass === 'string' ? attrsClass : undefined,
          props.class,
        )
        const submitText = props.submitText ?? options.submitText ?? 'Submit'

        return (
          <form
            {...formAttrs}
            class={mergedClass}
            onSubmit={onSubmit}
          >
            {slots.default
              ? slots.default({
                  errors: errors.value as Partial<Record<TFieldName, string | undefined>>,
                  fields: visibleFields,
                  isSubmitting: isSubmitting.value,
                  renderField,
                  values,
                })
              : visibleFields.map(field => renderField(field.name))}

            {slots.default
              ? null
              : slots.actions
                ? slots.actions({
                    isSubmitting: isSubmitting.value,
                  })
                : (
                    <div class="flex justify-end">
                      <AtomButton
                        type="submit"
                        disabled={props.submitDisabled || isSubmitting.value}
                        loading={isSubmitting.value}
                      >
                        {submitText}
                      </AtomButton>
                    </div>
                  )}
          </form>
        )
      }
    },
  })

  return component as unknown as VeeFormComponent<TSchema>
}
