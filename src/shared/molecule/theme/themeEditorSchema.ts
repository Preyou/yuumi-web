import themeJsonSchema from './theme.schema.json'

const themeEditorSchemaParsed = z.fromJSONSchema(
  themeJsonSchema as unknown as Parameters<typeof z.fromJSONSchema>[0],
)

if (!(themeEditorSchemaParsed instanceof z.ZodObject)) {
  throw new TypeError('[themeEditorSchema] Expected zod object generated from theme.schema.json.')
}

export const themeEditorSchema = themeEditorSchemaParsed

interface ThemeLike {
  dark?: Record<string, string>
  light?: Record<string, string>
}

interface ThemeEditorInitialValues extends Record<string, string> {
  baseColor: string
  darkBackground: string
  darkForeground: string
  darkPrimary: string
  darkRing: string
  lightBackground: string
  lightForeground: string
  lightPrimary: string
  lightRing: string
  radius: string
}

export function createThemeEditorInitialValues(theme: ThemeLike | undefined): ThemeEditorInitialValues {
  const light = theme?.light ?? {}
  const dark = theme?.dark ?? {}

  return {
    baseColor: light['base-color'] ?? '',
    darkBackground: dark.background ?? '',
    darkForeground: dark.foreground ?? '',
    darkPrimary: dark.primary ?? '',
    darkRing: dark.ring ?? '',
    lightBackground: light.background ?? '',
    lightForeground: light.foreground ?? '',
    lightPrimary: light.primary ?? '',
    lightRing: light.ring ?? '',
    radius: light.radius ?? '',
  }
}
