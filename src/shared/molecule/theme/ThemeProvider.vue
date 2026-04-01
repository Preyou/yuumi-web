<script setup lang="ts">
const { global, isDark, theme = {} } = defineProps<{
  theme?: {
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  isDark?: boolean
  global?: boolean
}>()

const atomEl = useCurrentElement<HTMLElement>()

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
  <Atom base-class="size-full bg-background">
    <slot />
  </Atom>
</template>
