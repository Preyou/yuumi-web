import defaultTheme from './default.json'

type ThemeSchema = typeof defaultTheme
interface ThemeOverride {
  dark?: Partial<ThemeSchema['dark']>
  light?: Partial<ThemeSchema['light']>
}

const importedThemes = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
}) as Record<string, ThemeOverride>

function resolveThemeName(path: string): string | null {
  const match = /\/([^/]+)\.json$/.exec(path)
  return match?.[1] ?? null
}

function mergeTheme(overrides?: ThemeOverride): ThemeSchema {
  if (!overrides) {
    return defaultTheme
  }

  return {
    ...defaultTheme,
    dark: {
      ...defaultTheme.dark,
      ...overrides.dark,
    },
    light: {
      ...defaultTheme.light,
      ...overrides.light,
    },
  }
}

const mergedThemes = Object.fromEntries(
  Object.entries(importedThemes).flatMap(([path, theme]) => {
    const themeName = resolveThemeName(path)
    if (!themeName) {
      return []
    }

    return [[themeName, mergeTheme(theme)]]
  }),
) as Record<string, ThemeSchema>

if (!('default' in mergedThemes)) {
  mergedThemes.default = defaultTheme
}

export const themePresets = mergedThemes

export const themePresetNames = Object.keys(themePresets)
  .sort((a, b) => {
    if (a === 'default') {
      return -1
    }
    if (b === 'default') {
      return 1
    }
    return a.localeCompare(b, 'zh-Hans-CN')
  })

export const fallbackThemePresetName = themePresetNames.includes('default')
  ? 'default'
  : (themePresetNames[0] ?? 'default')

export type ThemePresetName = string
