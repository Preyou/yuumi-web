import type {
  VeeFieldProps,
  VeeFieldSlotProps,
} from './createField'

type Equal<Left, Right>
  = (<T>() => T extends Left ? 1 : 2) extends (<T>() => T extends Right ? 1 : 2)
    ? true
    : false

type Expect<T extends true> = T

type FormValues = {
  age?: number
  name: string
  profile: {
    bio?: string
  }
}

type _FormNameValue = Expect<Equal<VeeFieldSlotProps<FormValues, 'name'>['value'], string>>
type _FormAgeValue = Expect<Equal<VeeFieldSlotProps<FormValues, 'age'>['value'], number | undefined>>
type _FormBioValue = Expect<Equal<VeeFieldSlotProps<FormValues, 'profile.bio'>['value'], string | undefined>>
type _FormNameProp = Expect<Equal<VeeFieldProps<FormValues, 'name'>['name'], 'name'>>

// @ts-expect-error invalid path must be rejected
type _InvalidPath = VeeFieldSlotProps<FormValues, 'profile.unknown'>
