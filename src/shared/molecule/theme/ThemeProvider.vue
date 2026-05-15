<script setup lang="ts">
import { useCurrentElement } from '@vueuse/core'

type ThemeVariables = Record<string, string>
interface ThemeLike {
  mode?: 'dark' | 'light'
  variables?: ThemeVariables
}

const { global, theme = {} } = defineProps<{
  theme?: ThemeLike
  global?: boolean
}>()

const atomEl = useCurrentElement<HTMLElement>()

watchEffect(() => {
  const el = global ? document.body : atomEl.value
  if (!el) {
    return
  }

  if (theme.mode === 'dark') {
    el.classList.remove('light')
    el.classList.add('dark')
  }
  else {
    el.classList.remove('dark')
    el.classList.add('light')
  }

  Object.entries(theme.variables ?? {}).forEach(([k, v]) => el.style.setProperty(`--${k}`, v))
})
</script>

<template>
  <Atom base-class="flex size-full min-h-0 min-w-0 overflow-hidden bg-background">
    <slot />
  </Atom>
</template>
