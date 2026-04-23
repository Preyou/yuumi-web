import type {
  SchemaFieldMatcher,
  SchemaFormComponent,
  SchemaFormExpose,
  SchemaFormSchema,
} from './schemaField.types'
import { defineComponent, ref } from 'vue'
import SchemaFormInner from './SchemaForm.vue'

export function createSchemaForm<TSchema extends SchemaFormSchema>(
  matchers: readonly SchemaFieldMatcher[] = [],
): SchemaFormComponent<TSchema> {
  const SchemaForm = defineComponent({
    inheritAttrs: false,
    name: 'SchemaForm',
    setup(_, { attrs, expose, slots }) {
      const schemaFormRef = ref<SchemaFormExpose<TSchema> | null>(null)

      expose({
        clear: () => {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          schemaFormRef.value.clear()
        },
        get errors() {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.errors
        },
        get isSubmitting() {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.isSubmitting
        },
        get isValidating() {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.isValidating
        },
        reset: () => {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          schemaFormRef.value.reset()
        },
        submit: () => {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.submit()
        },
        get submitCount() {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.submitCount
        },
        validate: () => {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.validate()
        },
        validateField: (fieldName: string) => {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.validateField(fieldName as never)
        },
        get values() {
          if (!schemaFormRef.value) {
            throw new Error('[SchemaForm] internal form instance is not ready.')
          }
          return schemaFormRef.value.values
        },
      })

      return () => (
        <SchemaFormInner
          ref={schemaFormRef}
          schema={attrs.schema as never}
          {...{
            ...attrs,
            matchers,
          } satisfies Record<string, unknown>}
          v-slots={slots}
        />
      )
    },
  })

  return SchemaForm as unknown as SchemaFormComponent<TSchema>
}

export const AutoForm = createSchemaForm()
