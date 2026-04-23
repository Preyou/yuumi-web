import type { DateValue } from '@internationalized/date'
import type { FunctionalComponent } from 'vue'
import type * as z from 'zod'
import type {
  SchemaFieldControlComponent,
  SchemaFieldControlProps,
  SchemaFieldErrorSlotProps,
  SchemaFieldLabelSlotProps,
  SchemaFieldMatcher,
} from './schemaField.types'
import { fromDate, getLocalTimeZone } from '@internationalized/date'
import AtomButton from '@/shared/atom/Button.vue'
import AtomDatePicker from '@/shared/atom/DatePicker.vue'
import AtomFilePicker from '@/shared/atom/FilePicker.vue'
import AtomInput from '@/shared/atom/Input.vue'
import AtomNumberField from '@/shared/atom/NumberField.vue'
import AtomSelect from '@/shared/atom/Select.vue'
import AtomSwitch from '@/shared/atom/Switch.vue'
import { FieldError, FieldLabel } from '@/shared/ui/field'
import {
  parseSchemaField,
  readObjectShapeFromSchema,
  resolveSchemaFieldControl,
} from './schemaField.parse'

type ZodLike = z.ZodType & {
  _def?: Record<string, unknown>
  def?: Record<string, unknown>
  type?: string
}

function getSchemaDef(schema: z.ZodType): Record<string, unknown> {
  const schemaLike = schema as unknown as ZodLike
  return schemaLike.def ?? schemaLike._def ?? {}
}

function getSchemaType(schema: z.ZodType): string {
  const schemaLike = schema as unknown as ZodLike
  return schemaLike.type ?? String(getSchemaDef(schema).type ?? 'unknown')
}

function asSchema(value: unknown): z.ZodType | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  return value as z.ZodType
}

function asSchemaList(value: unknown): z.ZodType[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((item) => {
    const schema = asSchema(item)
    return schema ? [schema] : []
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

function readControlUpdateHandler(attrs: Record<string, unknown>): ((value: unknown) => unknown) | undefined {
  const onUpdateModelValue = attrs['onUpdate:modelValue']
  if (typeof onUpdateModelValue !== 'function') {
    return undefined
  }
  return onUpdateModelValue as (value: unknown) => unknown
}

function readMatchers(matchers: SchemaFieldControlProps['matchers']): readonly SchemaFieldMatcher[] {
  return Array.isArray(matchers)
    ? matchers
    : []
}

function safeParseBySchema(schema: z.ZodType, value: unknown): boolean {
  try {
    return schema.safeParse(value).success
  }
  catch {
    return false
  }
}

function readTupleItems(baseSchema: z.ZodType): z.ZodType[] {
  return asSchemaList(getSchemaDef(baseSchema).items)
}

function readTupleRest(baseSchema: z.ZodType): z.ZodType | undefined {
  return asSchema(getSchemaDef(baseSchema).rest)
}

function readArrayLikeItemSchema(baseSchema: z.ZodType, kind: string, index: number): z.ZodType | undefined {
  if (kind === 'array') {
    return asSchema(getSchemaDef(baseSchema).element)
  }

  if (kind === 'set') {
    return asSchema(getSchemaDef(baseSchema).valueType)
  }

  if (kind === 'tuple') {
    const tupleItems = readTupleItems(baseSchema)
    if (index < tupleItems.length) {
      return tupleItems[index]
    }
    return readTupleRest(baseSchema)
  }

  return undefined
}

function readRecordLikeValueSchema(baseSchema: z.ZodType): z.ZodType | undefined {
  return asSchema(getSchemaDef(baseSchema).valueType)
}

function readUnionOptions(baseSchema: z.ZodType): z.ZodType[] {
  return asSchemaList(getSchemaDef(baseSchema).options)
}

function readUnionDiscriminator(baseSchema: z.ZodType): string | undefined {
  const discriminator = getSchemaDef(baseSchema).discriminator
  return typeof discriminator === 'string' && discriminator.length > 0
    ? discriminator
    : undefined
}

function readLiteralValue(schema: z.ZodType): unknown {
  const parsed = parseSchemaField(schema)
  return parsed.facts.kind === 'literal'
    ? parsed.facts.constraints.literalValues?.[0]
    : undefined
}

function readEnumValues(schema: z.ZodType): readonly unknown[] {
  const parsed = parseSchemaField(schema)
  return parsed.facts.kind === 'enum'
    ? (parsed.facts.constraints.enumValues ?? [])
    : []
}

function readUnionOptionLabel(optionSchema: z.ZodType, index: number, discriminator?: string): string {
  const optionKind = getSchemaType(optionSchema)

  if (optionKind === 'literal') {
    return String(readLiteralValue(optionSchema))
  }

  if (optionKind === 'enum') {
    const enumValues = readEnumValues(optionSchema)
    if (enumValues.length <= 4) {
      return enumValues.map(enumValue => String(enumValue)).join(' | ')
    }
    return `enum(${enumValues.length})`
  }

  if (optionKind === 'object' && discriminator) {
    const shape = readObjectShapeFromSchema(optionSchema)
    const discriminatorSchema = shape?.[discriminator]
    if (discriminatorSchema) {
      const discriminatorLiteral = readLiteralValue(discriminatorSchema)
      if (discriminatorLiteral !== undefined) {
        return `${discriminator}=${String(discriminatorLiteral)}`
      }

      const discriminatorEnumValues = readEnumValues(discriminatorSchema)
      if (discriminatorEnumValues.length > 0) {
        return `${discriminator}=${String(discriminatorEnumValues[0])}`
      }
    }
  }

  return `Option ${index + 1} (${optionKind})`
}

function resolveUnionSelectedIndex(options: readonly z.ZodType[], modelValue: unknown): number {
  const matchedIndex = options.findIndex(optionSchema => safeParseBySchema(optionSchema, modelValue))
  return matchedIndex >= 0 ? matchedIndex : 0
}

function normalizeArrayLikeModelValue(kind: string, modelValue: unknown): unknown[] {
  if (Array.isArray(modelValue)) {
    return [...modelValue]
  }

  if (kind === 'set' && modelValue instanceof Set) {
    return Array.from(modelValue)
  }

  return []
}

function toArrayLikeModelValue(kind: string, nextArray: unknown[]): unknown {
  if (kind === 'set') {
    return new Set(nextArray)
  }
  return nextArray
}

function normalizeObjectLikeModelValue(kind: string, modelValue: unknown): Record<string, unknown> {
  if (kind === 'map' && modelValue instanceof Map) {
    return Object.fromEntries(
      Array.from(modelValue.entries()).map(([entryKey, entryValue]) => [String(entryKey), entryValue]),
    )
  }

  return asRecord(modelValue)
}

function toObjectLikeModelValue(kind: string, value: Record<string, unknown>): unknown {
  if (kind === 'map') {
    return new Map(Object.entries(value))
  }
  return value
}

function buildNextDynamicKey(currentValue: Record<string, unknown>): string {
  let keyIndex = 1
  while (`key${keyIndex}` in currentValue) {
    keyIndex += 1
  }
  return `key${keyIndex}`
}

function createDefaultValueBySchema(schema: z.ZodType): unknown {
  const parsed = parseSchemaField(schema)
  const baseSchema = parsed.baseSchema

  if (parsed.facts.kind === 'literal') {
    return parsed.facts.constraints.literalValues?.[0]
  }

  if (parsed.facts.kind === 'enum') {
    return parsed.facts.constraints.enumValues?.[0]
  }

  if (parsed.facts.kind === 'string') {
    return ''
  }

  if (parsed.facts.kind === 'boolean') {
    return false
  }

  if (parsed.facts.kind === 'array') {
    return []
  }

  if (parsed.facts.kind === 'tuple') {
    return readTupleItems(baseSchema).map(tupleItem => createDefaultValueBySchema(tupleItem))
  }

  if (parsed.facts.kind === 'set') {
    return new Set<unknown>()
  }

  if (parsed.facts.kind === 'object' || parsed.facts.kind === 'record') {
    return {}
  }

  if (parsed.facts.kind === 'map') {
    return new Map<string, unknown>()
  }

  if (parsed.facts.kind === 'union') {
    const options = readUnionOptions(baseSchema)
    const firstOption = options[0]
    return firstOption
      ? createDefaultValueBySchema(firstOption)
      : undefined
  }

  if (parsed.facts.kind === 'null') {
    return null
  }

  return undefined
}

function renderControlFallback(kind: string) {
  return (
    <p class="text-muted-foreground text-xs leading-5">
      {`No matcher available for nested schema kind "${kind}".`}
    </p>
  )
}

function renderNestedControl(options: {
  disabled?: boolean
  matchers: readonly SchemaFieldMatcher[]
  modelValue: unknown
  name?: string
  onUpdateModelValue: ((value: unknown) => unknown) | undefined
  placeholder?: string
  readonly?: boolean
  required?: boolean
  schema: z.ZodType
}) {
  const {
    disabled,
    matchers,
    modelValue,
    name,
    onUpdateModelValue,
    placeholder,
    readonly,
    required,
    schema,
  } = options

  const nestedParsed = parseSchemaField(schema)
  const nestedControl = resolveSchemaFieldControl(matchers, schema, nestedParsed)

  if (!nestedControl) {
    return renderControlFallback(nestedParsed.facts.kind)
  }

  return (
    <component
      is={nestedControl}
      {...{
        disabled,
        matchers,
        modelValue,
        name,
        'onUpdate:modelValue': onUpdateModelValue,
        'parsed': nestedParsed,
        placeholder,
        readonly,
        'required': required ?? nestedParsed.facts.semantics.required,
        schema,
      } satisfies Record<string, unknown>}
    />
  )
}

const schemaFieldArrayLikeControl = ((props, context) => {
  const {
    disabled,
    matchers,
    modelValue,
    name,
    parsed,
    readonly,
    required,
  } = props

  const kind = parsed.facts.kind
  const runtimeMatchers = readMatchers(matchers)
  const emitModelUpdate = readControlUpdateHandler(context.attrs as Record<string, unknown>)
  const currentValue = normalizeArrayLikeModelValue(kind, modelValue)
  const tupleItems = kind === 'tuple' ? readTupleItems(parsed.baseSchema) : []
  const tupleRest = kind === 'tuple' ? readTupleRest(parsed.baseSchema) : undefined
  const renderCount = kind === 'tuple'
    ? Math.max(tupleItems.length, currentValue.length)
    : currentValue.length
  const canAddItem = !disabled
    && !readonly
    && (kind !== 'tuple' || tupleRest !== undefined)

  const rows = Array.from({ length: renderCount }, (_, index) => {
    const itemSchema = readArrayLikeItemSchema(parsed.baseSchema, kind, index)
    const canRemoveItem = !disabled
      && !readonly
      && (kind !== 'tuple' || index >= tupleItems.length)

    return (
      <div key={index} class="space-y-2 rounded-lg border border-border bg-background/80 p-3 transition-colors">
        <div class="flex items-center justify-between gap-2">
          <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Item
            {' '}
            {index + 1}
          </p>
          {canRemoveItem
            ? (
                <AtomButton
                  variant="ghost"
                  size="sm"
                  type="button"
                  {...{
                    onClick: () => {
                      if (!emitModelUpdate) {
                        return
                      }

                      const nextArray = currentValue.filter((_, itemIndex) => itemIndex !== index)
                      emitModelUpdate(toArrayLikeModelValue(kind, nextArray))
                    },
                  } satisfies Record<string, unknown>}
                >
                  Remove
                </AtomButton>
              )
            : null}
        </div>

        {itemSchema
          ? renderNestedControl({
              disabled,
              matchers: runtimeMatchers,
              modelValue: currentValue[index],
              name: name ? `${name}[${index}]` : undefined,
              onUpdateModelValue: (nextItemValue) => {
                if (!emitModelUpdate) {
                  return
                }

                const nextArray = [...currentValue]
                nextArray[index] = nextItemValue
                emitModelUpdate(toArrayLikeModelValue(kind, nextArray))
              },
              placeholder: `Item ${index + 1}`,
              readonly,
              required,
              schema: itemSchema,
            })
          : renderControlFallback('unknown')}
      </div>
    )
  })

  return (
    <div class="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
      {rows}

      {canAddItem
        ? (
            <AtomButton
              variant="outline"
              size="sm"
              type="button"
              {...{
                onClick: () => {
                  if (!emitModelUpdate) {
                    return
                  }

                  const nextSchema = readArrayLikeItemSchema(parsed.baseSchema, kind, currentValue.length)
                  if (!nextSchema) {
                    return
                  }

                  const nextArray = [...currentValue, createDefaultValueBySchema(nextSchema)]
                  emitModelUpdate(toArrayLikeModelValue(kind, nextArray))
                },
              } satisfies Record<string, unknown>}
            >
              Add item
            </AtomButton>
          )
        : null}
    </div>
  )
}) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent

const schemaFieldObjectLikeControl = ((props, context) => {
  const {
    disabled,
    matchers,
    modelValue,
    name,
    parsed,
    readonly,
    required,
  } = props

  const kind = parsed.facts.kind
  const runtimeMatchers = readMatchers(matchers)
  const emitModelUpdate = readControlUpdateHandler(context.attrs as Record<string, unknown>)
  const currentValue = normalizeObjectLikeModelValue(kind, modelValue)
  const objectShape = kind === 'object'
    ? (readObjectShapeFromSchema(parsed.baseSchema) ?? {})
    : {}
  const recordLikeValueSchema = kind === 'record' || kind === 'map'
    ? readRecordLikeValueSchema(parsed.baseSchema)
    : undefined
  const keys = kind === 'object'
    ? Object.keys(objectShape)
    : Object.keys(currentValue)

  return (
    <div class="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
      {keys.map((entryKey) => {
        const fieldSchema = kind === 'object'
          ? objectShape[entryKey]
          : recordLikeValueSchema

        return (
          <div key={entryKey} class="space-y-2 rounded-lg border border-border bg-background/80 p-3 transition-colors">
            {kind === 'object'
              ? (
                  <p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    {entryKey}
                  </p>
                )
              : (
                  <div class="flex items-center gap-2">
                    <AtomInput
                      {...{
                        disabled,
                        'modelValue': entryKey,
                        'onUpdate:modelValue': (nextKeyValue: unknown) => {
                          if (!emitModelUpdate) {
                            return
                          }

                          const nextKey = String(nextKeyValue ?? '')
                          if (nextKey.length === 0 || nextKey === entryKey) {
                            return
                          }

                          const renamedValue = Object.fromEntries(
                            Object.entries(currentValue).map(([currentKey, currentEntryValue]) => [
                              currentKey === entryKey ? nextKey : currentKey,
                              currentEntryValue,
                            ]),
                          )

                          emitModelUpdate(toObjectLikeModelValue(kind, renamedValue))
                        },
                        readonly,
                      } satisfies Record<string, unknown>}
                    />

                    <AtomButton
                      variant="ghost"
                      size="sm"
                      type="button"
                      disabled={disabled || readonly}
                      {...{
                        onClick: () => {
                          if (!emitModelUpdate) {
                            return
                          }

                          const nextValue = { ...currentValue }
                          delete nextValue[entryKey]
                          emitModelUpdate(toObjectLikeModelValue(kind, nextValue))
                        },
                      } satisfies Record<string, unknown>}
                    >
                      Remove
                    </AtomButton>
                  </div>
                )}

            {fieldSchema
              ? renderNestedControl({
                  disabled,
                  matchers: runtimeMatchers,
                  modelValue: currentValue[entryKey],
                  name: name ? `${name}.${entryKey}` : entryKey,
                  onUpdateModelValue: (nextFieldValue) => {
                    if (!emitModelUpdate) {
                      return
                    }

                    const nextValue = {
                      ...currentValue,
                      [entryKey]: nextFieldValue,
                    }
                    emitModelUpdate(toObjectLikeModelValue(kind, nextValue))
                  },
                  placeholder: entryKey,
                  readonly,
                  required,
                  schema: fieldSchema,
                })
              : renderControlFallback('unknown')}
          </div>
        )
      })}

      {(kind === 'record' || kind === 'map')
        && !disabled
        && !readonly
        && recordLikeValueSchema
        ? (
            <AtomButton
              variant="outline"
              size="sm"
              type="button"
              {...{
                onClick: () => {
                  if (!emitModelUpdate) {
                    return
                  }

                  const nextKey = buildNextDynamicKey(currentValue)
                  const nextValue = {
                    ...currentValue,
                    [nextKey]: createDefaultValueBySchema(recordLikeValueSchema),
                  }
                  emitModelUpdate(toObjectLikeModelValue(kind, nextValue))
                },
              } satisfies Record<string, unknown>}
            >
              Add field
            </AtomButton>
          )
        : null}
    </div>
  )
}) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent

const schemaFieldUnionControl = ((props, context) => {
  const {
    disabled,
    matchers,
    modelValue,
    name,
    parsed,
    placeholder,
    readonly,
    required,
  } = props

  const runtimeMatchers = readMatchers(matchers)
  const emitModelUpdate = readControlUpdateHandler(context.attrs as Record<string, unknown>)
  const unionOptions = readUnionOptions(parsed.baseSchema)
  const discriminator = readUnionDiscriminator(parsed.baseSchema)

  if (unionOptions.length === 0) {
    return renderControlFallback(parsed.facts.kind)
  }

  const selectedOptionIndex = resolveUnionSelectedIndex(unionOptions, modelValue)
  const selectedOptionSchema = unionOptions[selectedOptionIndex]
  if (!selectedOptionSchema) {
    return renderControlFallback(parsed.facts.kind)
  }

  return (
    <div class="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
      <AtomSelect
        {...{
          disabled,
          'modelValue': String(selectedOptionIndex),
          'name': name ? `${name}.__union` : undefined,
          'onUpdate:modelValue': (nextValue: unknown) => {
            if (!emitModelUpdate) {
              return
            }

            const nextIndex = Number(nextValue)
            if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= unionOptions.length) {
              return
            }

            const nextSchema = unionOptions[nextIndex]
            if (!nextSchema) {
              return
            }
            if (safeParseBySchema(nextSchema, modelValue)) {
              emitModelUpdate(modelValue)
              return
            }

            emitModelUpdate(createDefaultValueBySchema(nextSchema))
          },
          'options': unionOptions.map((optionSchema, optionIndex) => ({
            label: readUnionOptionLabel(optionSchema, optionIndex, discriminator),
            value: String(optionIndex),
          })),
          'placeholder': placeholder ?? 'Choose one option',
          required,
        } satisfies Record<string, unknown>}
      />

      {renderNestedControl({
        disabled,
        matchers: runtimeMatchers,
        modelValue,
        name,
        onUpdateModelValue: emitModelUpdate,
        placeholder,
        readonly,
        required,
        schema: selectedOptionSchema,
      })}
    </div>
  )
}) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent

export function schemaFieldDefaultErrorRender(context: SchemaFieldErrorSlotProps) {
  if (context.errors.length === 0) {
    return null
  }
  return (
    <FieldError class="text-xs leading-5" errors={context.errors} />
  )
}

export function schemaFieldDefaultLabelRender(context: SchemaFieldLabelSlotProps) {
  if (context.label === undefined) {
    return null
  }
  return (
    <FieldLabel class="leading-none text-sm font-medium">
      {context.label}
    </FieldLabel>
  )
}

export const schemaFieldHiddenControlFlag = Symbol('schemaFieldHiddenControlFlag')

const schemaFieldLiteralControl = (() => null) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent

;(schemaFieldLiteralControl as unknown as Record<PropertyKey, unknown>)[schemaFieldHiddenControlFlag] = true

export const schemaFieldBuiltInMatchers = [
  (_, parsed) => (parsed.facts.kind === 'boolean'
    ? (({ disabled, modelValue, name, readonly, required }, context) => (
        <AtomSwitch
          {...{
            ...context.attrs,
            disabled,
            modelValue: typeof modelValue === 'boolean' ? modelValue : Boolean(modelValue),
            name,
            readonly,
            required,
          } satisfies Record<string, unknown>}
        />
      )) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
  (_, parsed) => (parsed.facts.kind === 'number'
    ? (({ disabled, modelValue, name, placeholder, readonly, required }, context) => (
        <AtomNumberField
          {...{
            ...context.attrs,
            disabled,
            max: parsed.facts.constraints.max,
            min: parsed.facts.constraints.min,
            modelValue: typeof modelValue === 'number' && Number.isFinite(modelValue) ? modelValue : undefined,
            name,
            placeholder,
            readonly,
            required,
            step: parsed.facts.constraints.multipleOf ?? (parsed.facts.constraints.integer ? 1 : undefined),
            stepSnapping: parsed.facts.constraints.integer || parsed.facts.constraints.multipleOf !== undefined,
          } satisfies Record<string, unknown>}
        />
      )) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
  (_, parsed) => (parsed.facts.kind === 'bigint'
    ? (({ disabled, modelValue, name, placeholder, readonly, required }, context) => (
        <AtomNumberField
          {...{
            ...context.attrs,
            disabled,
            'max': parsed.facts.constraints.max,
            'min': parsed.facts.constraints.min,
            'modelValue': typeof modelValue === 'bigint'
              ? Number(modelValue)
              : (typeof modelValue === 'number' && Number.isFinite(modelValue) ? modelValue : undefined),
            name,
            'onUpdate:modelValue': (nextValue: unknown) => {
              ;(context.attrs['onUpdate:modelValue'] as ((value: unknown) => unknown) | undefined)?.(
                typeof nextValue === 'number' && Number.isFinite(nextValue)
                  ? BigInt(Math.trunc(nextValue))
                  : undefined,
              )
            },
            placeholder,
            readonly,
            required,
            'step': 1,
            'stepSnapping': true,
          } satisfies Record<string, unknown>}
        />
      )) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
  (_, parsed) => (parsed.facts.kind === 'date'
    ? (({ disabled, modelValue, name, placeholder, readonly, required }, context) => (
        <AtomDatePicker
          {...{
            ...context.attrs,
            disabled,
            'emptyText': placeholder,
            'modelValue': modelValue instanceof Date
              ? fromDate(modelValue, getLocalTimeZone())
              : (modelValue
                && typeof modelValue === 'object'
                && 'toDate' in modelValue
                && typeof (modelValue as DateValue).toDate === 'function'
                  ? modelValue as DateValue
                  : undefined),
            name,
            'onUpdate:modelValue': (nextValue: unknown) => {
              ;(context.attrs['onUpdate:modelValue'] as ((value: unknown) => unknown) | undefined)?.(
                nextValue
                && typeof nextValue === 'object'
                && 'toDate' in nextValue
                && typeof (nextValue as DateValue).toDate === 'function'
                  ? (nextValue as DateValue).toDate(getLocalTimeZone())
                  : undefined,
              )
            },
            readonly,
            required,
          } satisfies Record<string, unknown>}
        />
      )) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
  (_, parsed) => (parsed.facts.kind === 'string'
    ? (({ disabled, modelValue, name, placeholder, readonly, required }, context) => (
        <AtomInput
          {...{
            ...context.attrs,
            disabled,
            modelValue: modelValue == null ? undefined : String(modelValue),
            name,
            placeholder,
            readonly,
            required,
          } satisfies Record<string, unknown>}
        />
      )) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
  (_, parsed) => (parsed.facts.kind === 'enum'
    ? (({ disabled, modelValue, name, placeholder, required }, context) => {
        const enumValues = parsed.facts.constraints.enumValues ?? []
        return (
          <AtomSelect
            {...{
              ...context.attrs,
              disabled,
              'modelValue': enumValues.findIndex(enumValue => Object.is(enumValue, modelValue)) >= 0
                ? String(enumValues.findIndex(enumValue => Object.is(enumValue, modelValue)))
                : undefined,
              name,
              'onUpdate:modelValue': (nextValue: unknown) => {
                if (typeof nextValue !== 'string' || nextValue.length === 0) {
                  ;(context.attrs['onUpdate:modelValue'] as ((value: unknown) => unknown) | undefined)?.(undefined)
                  return
                }

                const enumIndex = Number(nextValue)
                if (!Number.isInteger(enumIndex) || enumIndex < 0 || enumIndex >= enumValues.length) {
                  ;(context.attrs['onUpdate:modelValue'] as ((value: unknown) => unknown) | undefined)?.(undefined)
                  return
                }

                ;(context.attrs['onUpdate:modelValue'] as ((value: unknown) => unknown) | undefined)?.(
                  enumValues[enumIndex],
                )
              },
              'options': enumValues.map((enumValue, enumIndex) => ({
                label: String(enumValue),
                value: String(enumIndex),
              })),
              placeholder,
              required,
            } satisfies Record<string, unknown>}
          />
        )
      }) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
  (_, parsed) => (parsed.facts.kind === 'literal'
    && Array.isArray(parsed.facts.constraints.literalValues)
    && parsed.facts.constraints.literalValues.length > 0
    ? schemaFieldLiteralControl
    : null),
  (_, parsed) => (parsed.facts.kind === 'union'
    ? schemaFieldUnionControl
    : null),
  (_, parsed) => ((parsed.facts.kind === 'array' || parsed.facts.kind === 'tuple' || parsed.facts.kind === 'set')
    ? schemaFieldArrayLikeControl
    : null),
  (_, parsed) => ((parsed.facts.kind === 'object' || parsed.facts.kind === 'record' || parsed.facts.kind === 'map')
    ? schemaFieldObjectLikeControl
    : null),
  (_, parsed) => (parsed.facts.kind === 'file'
    ? (({ disabled, modelValue, name, placeholder, readonly, required }, context) => (
        <AtomFilePicker
          {...{
            ...context.attrs,
            disabled,
            modelValue: modelValue instanceof File ? modelValue : undefined,
            name,
            placeholder,
            readonly,
            required,
          } satisfies Record<string, unknown>}
        />
      )) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent
    : null),
] as const satisfies readonly SchemaFieldMatcher[]
