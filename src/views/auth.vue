<script setup lang="tsx">
import type { FunctionalComponent } from 'vue'
import type {
  SchemaFieldControlComponent,
  SchemaFieldControlProps,
  SchemaFieldMatcher,
  SchemaFormSubmitPayload,
} from '@/shared/molecule/form'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { zPostAuthSignEmailData } from '@/api/auto'
import { sysApi } from '@/api/sysApi'
import AtomButton from '@/shared/atom/Button.vue'
import AtomInput from '@/shared/atom/Input.vue'
import LanguageSelect from '@/shared/molecule/system/LanguageSelect.vue'
import {
  createSchemaForm,
} from '@/shared/molecule/form'

definePage({
  name: 'auth-login',
  path: '/auth',
})

const { t } = useI18n()
const accessToken = useLocalStorage('access_token', '')

const loginSchema = zPostAuthSignEmailData.shape.body

const StringControl = ((props, context) => {
  const {
    disabled,
    modelValue,
    name,
    placeholder,
    readonly,
  } = props
  return (
    <AtomInput
      {...{
        ...context.attrs,
        disabled,
        modelValue: modelValue == null ? undefined : String(modelValue),
        name,
        placeholder,
        readonly,
      } satisfies Record<string, unknown>}
    />
  )
}) as FunctionalComponent<SchemaFieldControlProps> as unknown as SchemaFieldControlComponent

const fieldMatchers: readonly SchemaFieldMatcher[] = [
  (_schema, parsed) => {
    if (parsed.facts.kind === 'string') {
      return StringControl
    }
    return null
  },
]

const SchemaForm = createSchemaForm<typeof loginSchema>(fieldMatchers)
const onSubmit = async (payload: SchemaFormSubmitPayload<typeof loginSchema>): Promise<void> => {
  const response = await sysApi('/auth/sign/email').post({
    data: payload.values,
  })
  accessToken.value = response.data.token
}
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-linear-to-b from-slate-100 to-slate-200 px-4 py-12">
    <section class="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
      <header class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h1 class="text-xl font-semibold">
              {{ t('auth.title') }}
            </h1>
            <p class="text-muted-foreground text-sm">
              {{ t('auth.subtitle') }}
            </p>
          </div>
          <LanguageSelect class="shrink-0" />
        </div>
      </header>

      <SchemaForm
        :schema="loginSchema"
        label-i18n-prefix="auth.form"
        class="space-y-4"
        name="auth-login-form"
        @submit="onSubmit"
      >
        <template #actions="{ isSubmitting }">
          <AtomButton
            block
            type="submit"
            :loading="isSubmitting"
          >
            {{ t('auth.actions.loginNow') }}
          </AtomButton>
        </template>
      </SchemaForm>

      <p v-if="accessToken" class="text-muted-foreground mt-4 break-all text-xs">
        {{ t('auth.token.title') }}: {{ accessToken }}
      </p>
    </section>
  </main>
</template>
