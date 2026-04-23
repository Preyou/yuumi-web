<script setup lang="ts">
import { useThemeState } from '@/shared/molecule/theme/useTheme'
import { Toaster } from '@/shared/ui/sonner'
import 'vue-sonner/style.css'

const { currentTheme, isDark } = useThemeState()
</script>

<template>
  <ThemeProvider :theme="currentTheme" :is-dark="isDark" global>
    <RouterView />
    <ThemeEditorShell />
    <Toaster position="top-right" />
  </ThemeProvider>
</template>
