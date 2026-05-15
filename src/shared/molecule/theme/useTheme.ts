import type { ComputedRef, Ref } from 'vue'
import type { ThemeEntry, ThemeMode, ThemeSchema, ThemeVariables } from '@/assets/themes'
import { getAppStorageKey } from '@/lib/appName'

export interface ThemePreset {
  key: string
  themeName: string
  mode: ThemeMode
}

export interface ResolvedTheme<Schema extends ThemeSchema = ThemeSchema> {
  name: string
  mode: ThemeMode
  variables: ThemeVariables<Schema>
  schema: Schema
}

export interface RegisterThemeOptions {
  activateIfEmpty?: boolean
  overwrite?: boolean
}

export interface UseThemeReturn {
  preset: Ref<string>
  themeName: ComputedRef<string>
  mode: ComputedRef<ThemeMode>
  theme: ComputedRef<ResolvedTheme>
  presets: ComputedRef<ThemePreset[]>
  themes: ComputedRef<ThemeEntry[]>
  hasThemes: ComputedRef<boolean>
  registerTheme: <Schema extends ThemeSchema>(
    theme: ThemeEntry<Schema>,
    options?: RegisterThemeOptions,
  ) => () => void
  registerThemes: (
    themes: Iterable<ThemeEntry>,
    options?: RegisterThemeOptions,
  ) => Array<() => void>
  unregisterTheme: (themeName: string) => void
  hasTheme: (themeName: string) => boolean
  setPreset: (preset: string) => void
}

const defaultPresetName = 'default'

function resolveThemeName(presetName: string): string {
  return presetName.replace(/\.dark$/, '')
}

function resolveThemeMode(presetName: string): ThemeMode {
  return presetName.endsWith('.dark') ? 'dark' : 'light'
}

function createThemePreset(themeName: string, mode: ThemeMode): ThemePreset {
  return {
    key: mode === 'dark' ? `${themeName}.dark` : themeName,
    mode,
    themeName,
  }
}

export const useTheme = createGlobalState((): UseThemeReturn => {
  const registry = shallowReactive(new Map<string, ThemeEntry>())
  const preset = useLocalStorage<string>(getAppStorageKey('theme'), defaultPresetName)

  const themes = computed(() => {
    return Array.from(registry.values())
  })

  const presets = computed(() => {
    return themes.value.flatMap(({ name }) => [
      createThemePreset(name, 'light'),
      createThemePreset(name, 'dark'),
    ])
  })

  const hasThemes = computed(() => {
    return registry.size > 0
  })

  const fallbackPreset = computed(() => {
    if (registry.has(defaultPresetName)) {
      return defaultPresetName
    }
    return presets.value[0]?.key ?? defaultPresetName
  })

  const themeName = computed(() => {
    return resolveThemeName(preset.value)
  })

  const mode = computed(() => {
    return resolveThemeMode(preset.value)
  })

  watchEffect(() => {
    if (!hasThemes.value) {
      return
    }

    if (!presets.value.some(({ key }) => key === preset.value)) {
      preset.value = fallbackPreset.value
    }
  })

  const theme = computed<ResolvedTheme>(() => {
    const entry = registry.get(themeName.value)

    if (!entry) {
      throw new Error(`[useTheme] theme preset "${preset.value}" is not registered.`)
    }

    const variables = entry[mode.value]

    return {
      name: entry.name,
      schema: entry.schema,
      mode: mode.value,
      variables,
    }
  })

  function hasTheme(themeName: string) {
    return registry.has(themeName)
  }

  function setPreset(nextPreset: string) {
    if (!presets.value.some(({ key }) => key === nextPreset)) {
      throw new Error(`[useTheme] theme preset "${nextPreset}" is not registered.`)
    }

    preset.value = nextPreset
  }

  function unregisterTheme(themeName: string) {
    registry.delete(themeName)
  }

  function registerTheme<Schema extends ThemeSchema>(
    theme: ThemeEntry<Schema>,
    options: RegisterThemeOptions = {},
  ) {
    const { activateIfEmpty = true, overwrite = false } = options

    if (!overwrite && registry.has(theme.name)) {
      throw new Error(`[useTheme] theme "${theme.name}" is already registered.`)
    }

    const wasEmpty = registry.size === 0
    registry.set(theme.name, theme as ThemeEntry)

    if (activateIfEmpty && wasEmpty) {
      preset.value = createThemePreset(theme.name, 'light').key
    }

    return () => {
      unregisterTheme(theme.name)
    }
  }

  function registerThemes(
    themes: Iterable<ThemeEntry>,
    options?: RegisterThemeOptions,
  ) {
    return Array.from(themes, theme => registerTheme(theme, options))
  }

  return {
    hasTheme,
    hasThemes,
    mode,
    preset,
    presets,
    registerTheme,
    registerThemes,
    setPreset,
    theme,
    themeName,
    themes,
    unregisterTheme,
  }
})
