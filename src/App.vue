<script setup lang="ts">
import theme from '@/assets/themes/default.json'
import { Toaster } from '@/shared/ui/sonner'
import 'vue-sonner/style.css'

// const isDark = useDark()

// isDark.value = !isDark.value
</script>

<template>
  <ThemeProvider :theme global>
    <RouterView />
    <Toaster position="top-right" />
  </ThemeProvider>
</template>
