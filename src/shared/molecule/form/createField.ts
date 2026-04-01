import type {
  FieldSlotProps,
  Path,
  PathValue,
} from 'vee-validate'
import { Field } from 'vee-validate'

type PlainFormValues = Record<string, unknown>
type FieldProps = InstanceType<typeof Field>['$props']

export type VeeFieldProps<
  TValues extends PlainFormValues,
  TName extends Path<TValues>,
> = Omit<FieldProps, 'name'> & {
  name: TName
}

export type VeeFieldSlotProps<
  TValues extends PlainFormValues,
  TName extends Path<TValues>,
> = FieldSlotProps<PathValue<TValues, TName>>

export type VeeFieldComponent<TValues extends PlainFormValues> = typeof Field & {
  new<TName extends Path<TValues>>(props: VeeFieldProps<TValues, TName>): {
    $props: VeeFieldProps<TValues, TName>
    $slots: {
      default?: (slotProps: VeeFieldSlotProps<TValues, TName>) => unknown
    }
  }
}

/**
 * 基于“表单值类型”创建强类型 `VeeField` 组件。
 *
 * @example
 * const VeeField = createField<{ username?: string }>()
 * // `name="username"` 时，slot `value` 会推断为 `string | undefined`
 */
export function createField<TValues extends PlainFormValues>(): VeeFieldComponent<TValues> {
  return Field as unknown as VeeFieldComponent<TValues>
}
