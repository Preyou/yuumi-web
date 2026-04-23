import type * as z from 'zod'
import type {
  ParsedSchemaField,
  ParsedSchemaFieldConstraints,
  ParsedSchemaFieldWrappers,
  SchemaFieldControlComponent,
  SchemaFieldMatcher,
} from './schemaField.types'

type ZodLike = z.ZodType & {
  _def?: Record<string, unknown>
  def?: Record<string, unknown>
  description?: string
  meta?: () => unknown
  type?: string
}

function getSchemaDef(schema: z.ZodType): Record<string, unknown> {
  const schemaLike = schema as ZodLike
  return schemaLike.def ?? schemaLike._def ?? {}
}

function getSchemaType(schema: z.ZodType): string {
  const schemaLike = schema as ZodLike
  return schemaLike.type ?? String(getSchemaDef(schema).type ?? 'unknown')
}

function asSchema(value: unknown): z.ZodType | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  return value as z.ZodType
}

function getDescription(schema: z.ZodType): string | undefined {
  const schemaLike = schema as ZodLike
  if (typeof schemaLike.description === 'string') {
    return schemaLike.description
  }
  return undefined
}

function getMeta(schema: z.ZodType): unknown {
  const schemaLike = schema as ZodLike
  if (typeof schemaLike.meta !== 'function') {
    return undefined
  }
  try {
    return schemaLike.meta()
  }
  catch {
    return undefined
  }
}

function readCheckDef(check: unknown): Record<string, unknown> {
  if (!check || typeof check !== 'object') {
    return {}
  }
  const checkLike = check as {
    _zod?: {
      def?: Record<string, unknown>
    }
    def?: Record<string, unknown>
  }
  return checkLike._zod?.def ?? checkLike.def ?? {}
}

function unwrapSchema(rawSchema: z.ZodType): {
  baseSchema: z.ZodType
  warnings: string[]
  wrapperChain: string[]
  wrappers: ParsedSchemaFieldWrappers
} {
  const warnings: string[] = []
  const wrapperChain: string[] = []
  const wrappers: ParsedSchemaFieldWrappers = {
    catch: false,
    default: false,
    nonoptional: false,
    nullable: false,
    optional: false,
    pipe: false,
    prefault: false,
    readonly: false,
    transform: false,
  }

  let current: z.ZodType = rawSchema
  const visited = new Set<z.ZodType>()

  while (true) {
    if (visited.has(current)) {
      warnings.push('Detected schema unwrap cycle, stopped unwrapping.')
      break
    }
    visited.add(current)

    const def = getSchemaDef(current)
    const type = getSchemaType(current)
    wrapperChain.push(type)

    if (type === 'optional' || type === 'exact_optional') {
      wrappers.optional = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Optional schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'nullable') {
      wrappers.nullable = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Nullable schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'default') {
      wrappers.default = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Default schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'prefault') {
      wrappers.prefault = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Prefault schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'catch') {
      wrappers.catch = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Catch schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'readonly') {
      wrappers.readonly = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Readonly schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'nonoptional') {
      wrappers.nonoptional = true
      const next = asSchema(def.innerType)
      if (!next) {
        warnings.push('Nonoptional schema has no innerType.')
        break
      }
      current = next
      continue
    }

    if (type === 'pipe') {
      wrappers.pipe = true
      const next = asSchema(def.in) ?? asSchema(def.innerType)
      if (!next) {
        warnings.push('Pipe schema has no renderable input schema.')
        break
      }
      current = next
      continue
    }

    if (type === 'transform') {
      wrappers.transform = true
      warnings.push('Transform schema cannot be unwrapped further.')
    }

    break
  }

  return {
    baseSchema: current,
    warnings,
    wrapperChain,
    wrappers,
  }
}

function acceptsValue(schema: z.ZodType, value: unknown): boolean {
  try {
    return schema.safeParse(value).success
  }
  catch {
    return false
  }
}

function getObjectShape(schema: z.ZodType): Record<string, z.ZodType> | null {
  const schemaLike = schema as ZodLike & {
    shape?: Record<string, z.ZodType>
  }
  if (schemaLike.shape && typeof schemaLike.shape === 'object' && !Array.isArray(schemaLike.shape)) {
    return schemaLike.shape
  }

  const def = getSchemaDef(schema)
  const shape = def.shape
  if (shape && typeof shape === 'object' && !Array.isArray(shape)) {
    return shape as Record<string, z.ZodType>
  }

  return null
}

function pickNumberishMin(current: number | undefined, next: number | undefined): number | undefined {
  if (next == null) {
    return current
  }
  if (current == null) {
    return next
  }
  return Math.max(current, next)
}

function pickNumberishMax(current: number | undefined, next: number | undefined): number | undefined {
  if (next == null) {
    return current
  }
  if (current == null) {
    return next
  }
  return Math.min(current, next)
}

function extractConstraints(baseSchema: z.ZodType): ParsedSchemaFieldConstraints {
  const constraints: ParsedSchemaFieldConstraints = {}
  const baseType = getSchemaType(baseSchema)
  const baseLike = baseSchema as ZodLike & {
    format?: string | null
    isInt?: boolean
    maxLength?: number | null
    minLength?: number | null
  }
  const def = getSchemaDef(baseSchema)

  if (typeof baseLike.minLength === 'number') {
    constraints.minLength = baseLike.minLength
  }
  if (typeof baseLike.maxLength === 'number') {
    constraints.maxLength = baseLike.maxLength
  }
  if (typeof baseLike.isInt === 'boolean') {
    constraints.integer = baseLike.isInt
  }
  if (typeof baseLike.format === 'string' && baseLike.format.length > 0) {
    constraints.format = baseLike.format
  }

  if (baseType === 'enum') {
    const entries = def.entries
    if (entries && typeof entries === 'object') {
      constraints.enumValues = Object.values(entries)
    }
  }
  if (baseType === 'literal') {
    const values = def.values
    if (Array.isArray(values)) {
      constraints.literalValues = values
    }
  }

  const checks = Array.isArray(def.checks) ? def.checks : []
  for (const check of checks) {
    const checkDef = readCheckDef(check)
    const checkType = typeof checkDef.check === 'string' ? checkDef.check : ''

    if (checkType === 'min_length' || checkType === 'min_size') {
      const minimum = Number(checkDef.minimum)
      if (!Number.isNaN(minimum)) {
        constraints.minLength = pickNumberishMin(constraints.minLength, minimum)
      }
      continue
    }

    if (checkType === 'max_length' || checkType === 'max_size') {
      const maximum = Number(checkDef.maximum)
      if (!Number.isNaN(maximum)) {
        constraints.maxLength = pickNumberishMax(constraints.maxLength, maximum)
      }
      continue
    }

    if (checkType === 'length_equals' || checkType === 'size_equals') {
      const size = Number(checkDef.size)
      if (!Number.isNaN(size)) {
        constraints.length = size
      }
      continue
    }

    if (checkType === 'greater_than') {
      const value = Number(checkDef.value)
      if (!Number.isNaN(value)) {
        constraints.min = pickNumberishMin(constraints.min, value)
      }
      continue
    }

    if (checkType === 'less_than') {
      const value = Number(checkDef.value)
      if (!Number.isNaN(value)) {
        constraints.max = pickNumberishMax(constraints.max, value)
      }
      continue
    }

    if (checkType === 'multiple_of') {
      const value = Number(checkDef.value)
      if (!Number.isNaN(value)) {
        constraints.multipleOf = value
      }
      continue
    }

    if (checkType === 'string_format') {
      if (typeof checkDef.format === 'string' && checkDef.format.length > 0) {
        constraints.format = checkDef.format
      }
      continue
    }

    if (checkType === 'regex' && checkDef.pattern instanceof RegExp) {
      constraints.pattern = checkDef.pattern
      continue
    }
  }

  return constraints
}

export function parseSchemaField(schema: z.ZodType): ParsedSchemaField {
  const { baseSchema, warnings, wrapperChain, wrappers } = unwrapSchema(schema)
  const baseType = getSchemaType(baseSchema)

  const acceptsUndefined = acceptsValue(schema, undefined)
  const acceptsNull = acceptsValue(schema, null)
  const shape = getObjectShape(baseSchema)

  return {
    baseSchema,
    diagnostics: {
      warnings,
      wrapperChain,
    },
    facts: {
      constraints: extractConstraints(baseSchema),
      kind: baseType,
      semantics: {
        acceptsNull,
        acceptsUndefined,
        required: !acceptsUndefined,
      },
      structure: {
        isArray: baseType === 'array',
        isEnum: baseType === 'enum',
        isLiteral: baseType === 'literal',
        isObject: baseType === 'object',
        isRecord: baseType === 'record',
        isTuple: baseType === 'tuple',
        isUnion: baseType === 'union',
        shapeKeys: shape ? Object.keys(shape) : [],
      },
      wrappers,
    },
    hints: {
      description: getDescription(schema) ?? getDescription(baseSchema),
      meta: getMeta(schema),
    },
    rawSchema: schema,
  }
}

export function resolveSchemaFieldControl(
  matchers: readonly SchemaFieldMatcher[],
  schema: z.ZodType,
  parsed: ParsedSchemaField,
): SchemaFieldControlComponent | null {
  for (const matcher of matchers) {
    try {
      const matched = matcher(schema, parsed)
      if (matched) {
        return matched
      }
    }
    catch (error) {
      console.warn('[SchemaField] matcher throws error:', error)
    }
  }
  return null
}

export function readObjectShapeFromSchema(schema: z.ZodType): Record<string, z.ZodType> | null {
  const parsed = parseSchemaField(schema)
  if (!parsed.facts.structure.isObject) {
    return null
  }
  return getObjectShape(parsed.baseSchema)
}
