<script setup lang="ts">
import { useCurrentElement } from '@vueuse/core'
import { themeProviderPortalTargetKey } from './themeProviderPortal'

const { global, isDark, theme = {} } = defineProps<{
  theme?: {
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  isDark?: boolean
  global?: boolean
}>()

const atomEl = useCurrentElement<HTMLElement>()

provide(themeProviderPortalTargetKey, atomEl)

watchEffect(() => {
  const el = global ? document.body : atomEl.value
  if (!el) {
    return
  }
  if (isDark) {
    el.classList.remove('light')
    el.classList.add('dark')
    Object.entries(Object.assign({}, theme.light, theme.dark)).forEach(([k, v]) => el.style.setProperty(`--${k}`, v))
  }
  else {
    el.classList.remove('dark')
    el.classList.add('light')
    Object.entries(Object.assign({}, theme.dark, theme.light)).forEach(([k, v]) => el.style.setProperty(`--${k}`, v))
  }
})
</script>

<template>
  <Atom base-class="relative flex size-full min-h-0 min-w-0 overflow-hidden bg-background">
    <div class="min-h-0 min-w-0 flex-1">
      <slot />
    </div>
  </Atom>
</template>
