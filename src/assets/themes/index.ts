import { z } from 'zod'
import defaultDarkTheme from './default.dark.json'
import defaultTheme from './default.json'
import defaultSchema from './default.schema.json'

export type ThemeMode = 'dark' | 'light'
export type ThemeSource = Record<string, string>
type JsonSchemaSource = Record<string, unknown>
export type ThemeSchema = z.ZodObject
export type ThemeVariables<Schema extends ThemeSchema = ThemeSchema> = z.infer<Schema> & ThemeSource

export interface ThemeEntry<Schema extends ThemeSchema = ThemeSchema> {
  name: string
  dark: ThemeVariables<Schema>
  light: ThemeVariables<Schema>
  schema: Schema
}

interface ThemeFile {
  name: string
  mode: ThemeMode
  source: ThemeSource
}

const defaultZodSchema = z.fromJSONSchema(defaultSchema as JsonSchemaSource) as ThemeSchema

const themeFiles = import.meta.glob(['./*.json', '!./*.schema.json'], {
  eager: true,
  import: 'default',
}) as Record<string, ThemeSource>

const schemaFiles = import.meta.glob('./*.schema.json', {
  eager: true,
  import: 'default',
}) as Record<string, JsonSchemaSource>

function resolveThemeFile(path: string, source: ThemeSource): ThemeFile | null {
  const match = /\/([^/]+)\.json$/.exec(path)
  const fileName = match?.[1]
  if (!fileName || fileName.endsWith('.schema')) {
    return null
  }

  const mode = fileName.endsWith('.dark') ? 'dark' : 'light'
  const name = fileName.replace(/\.dark$/, '')

  return {
    mode,
    name,
    source,
  }
}

function resolveSchemaName(path: string): string | null {
  const match = /\/([^/]+)\.schema\.json$/.exec(path)
  return match?.[1] ?? null
}

function createZodSchema(schemaSource?: JsonSchemaSource): ThemeSchema {
  if (!schemaSource) {
    return defaultZodSchema
  }

  const schema = z.fromJSONSchema(schemaSource) as ThemeSchema
  return defaultZodSchema.merge(schema) as ThemeSchema
}

function parseTheme<Schema extends ThemeSchema>(
  schema: Schema,
  mode: ThemeMode,
  override?: ThemeSource,
): ThemeVariables<Schema> {
  const baseline = mode === 'dark' ? defaultDarkTheme : defaultTheme
  return schema.parse({
    ...baseline,
    ...override,
  }) as ThemeVariables<Schema>
}

const groupedThemeFiles = Object.entries(themeFiles).reduce<Record<string, Partial<Record<ThemeMode, ThemeSource>>>>(
  (groups, [path, source]) => {
    const themeFile = resolveThemeFile(path, source)
    if (!themeFile) {
      return groups
    }

    return {
      ...groups,
      [themeFile.name]: {
        ...groups[themeFile.name],
        [themeFile.mode]: themeFile.source,
      },
    }
  },
  {},
)

const groupedSchemas = Object.fromEntries(
  Object.entries(schemaFiles).flatMap(([path, source]) => {
    const name = resolveSchemaName(path)
    if (!name) {
      return []
    }
    return [[name, name === 'default' ? defaultZodSchema : createZodSchema(source)]]
  }),
) as Record<string, ThemeSchema>

const themeNames = Array.from(new Set([
  'default',
  ...Object.keys(groupedThemeFiles),
  ...Object.keys(groupedSchemas),
]))
  .sort((a, b) => {
    if (a === 'default') {
      return -1
    }
    if (b === 'default') {
      return 1
    }
    return a.localeCompare(b, 'zh-Hans-CN')
  })

const themeMap = new Map<string, ThemeEntry>(
  themeNames.map((name) => {
    const schema = groupedSchemas[name] ?? defaultZodSchema
    const themeSource = groupedThemeFiles[name] ?? {}

    return [
      name,
      {
        dark: parseTheme(schema, 'dark', themeSource.dark),
        light: parseTheme(schema, 'light', themeSource.light),
        name,
        schema,
      },
    ]
  }),
)

export default themeMap
