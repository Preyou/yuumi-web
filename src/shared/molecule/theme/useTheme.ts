import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed, watchEffect } from 'vue'
import {
  fallbackThemePresetName,
  themePresetNames,
  themePresets,
} from '@/assets/themes'
import { getAppStorageKey } from '@/lib/appName'

export const useThemeState = createGlobalState(() => {
  const currentThemeName = useLocalStorage<string>(getAppStorageKey('theme'), fallbackThemePresetName)
  const isDark = useLocalStorage<boolean>(getAppStorageKey('darkMode'), false)

  watchEffect(() => {
    if (!themePresetNames.length) {
      return
    }
    if (!themePresetNames.includes(currentThemeName.value)) {
      currentThemeName.value = fallbackThemePresetName
    }
  })

  const currentTheme = computed(() => {
    return themePresets[currentThemeName.value]
      ?? themePresets[fallbackThemePresetName]
      ?? themePresets.default
  })

  function setTheme(themeName: string) {
    if (themePresetNames.includes(themeName)) {
      currentThemeName.value = themeName
    }
  }

  return {
    currentTheme,
    currentThemeName,
    isDark,
    setTheme,
    themePresetNames,
    themePresets,
  }
})
