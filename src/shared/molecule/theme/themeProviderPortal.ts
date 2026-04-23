import type { InjectionKey, Ref } from 'vue'

export type ThemeProviderPortalTarget = Ref<HTMLElement | null | undefined>

export const themeProviderPortalTargetKey: InjectionKey<ThemeProviderPortalTarget> = Symbol('theme-provider-portal-target')
