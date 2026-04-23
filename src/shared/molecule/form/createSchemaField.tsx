import type {
  CreateSchemaFieldOptions,
  SchemaFieldComponentByMode,
  SchemaFieldExpose,
  SchemaFieldFormControlledComponent,
  SchemaFieldMatcher,
  SchemaFieldMode,
  SchemaFieldStandaloneComponent,
} from './schemaField.types'
import { defineComponent, ref } from 'vue'
import {
  schemaFieldDefaultErrorRender,
  schemaFieldDefaultLabelRender,
} from './schemaField.defaults'
import SchemaFieldInner from './SchemaField.vue'

export function createSchemaField(
  matchers: readonly SchemaFieldMatcher[],
  options: CreateSchemaFieldOptions & { mode: 'form-controlled' },
): SchemaFieldFormControlledComponent
export function createSchemaField(
  matchers: readonly SchemaFieldMatcher[],
  options?: CreateSchemaFieldOptions,
): SchemaFieldStandaloneComponent
export function createSchemaField<TMode extends SchemaFieldMode>(
  matchers: readonly SchemaFieldMatcher[],
  {
    errorRender = schemaFieldDefaultErrorRender,
    labelRender = schemaFieldDefaultLabelRender,
    mode = 'standalone',
  }: CreateSchemaFieldOptions = {},
): SchemaFieldComponentByMode<TMode> {
  const SchemaField = defineComponent({
    inheritAttrs: false,
    name: mode === 'form-controlled' ? 'SchemaFieldFormControlled' : 'SchemaFieldStandalone',
    setup(_, { attrs, expose, slots }) {
      const schemaFieldRef = ref<SchemaFieldExpose | null>(null)

      expose({
        clear: () => {
          if (!schemaFieldRef.value) {
            throw new Error('[SchemaField] internal field instance is not ready.')
          }
          schemaFieldRef.value.clear()
        },
        reset: () => {
          if (!schemaFieldRef.value) {
            throw new Error('[SchemaField] internal field instance is not ready.')
          }
          schemaFieldRef.value.reset()
        },
        validate: () => {
          if (!schemaFieldRef.value) {
            throw new Error('[SchemaField] internal field instance is not ready.')
          }
          return schemaFieldRef.value.validate()
        },
      })

      return () => (
        <SchemaFieldInner
          ref={schemaFieldRef}
          schema={attrs.schema as never}
          {...{
            ...attrs,
            defaultErrorRender: errorRender,
            defaultLabelRender: labelRender,
            matchers,
            mode,
          } satisfies Record<string, unknown>}
          v-slots={slots}
        />
      )
    },
  })

  return SchemaField as unknown as SchemaFieldComponentByMode<TMode>
}
