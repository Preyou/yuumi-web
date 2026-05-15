<script setup lang="ts">
import { useTheme } from '@/shared/molecule/theme/useTheme'
import { Toaster } from '@/shared/ui/sonner'
import 'vue-sonner/style.css'

const { theme } = useTheme()
</script>

<template>
  <ThemeProvider :theme="theme" global>
    <RouterView />
    <Toaster position="top-right" />
  </ThemeProvider>
</template>
