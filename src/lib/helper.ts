type SafeAwaitSuccess<Data>
  = readonly [isOk: true, error: null, data: Data] & {
    readonly isOk: true
    readonly error: null
    readonly data: Data
  }

type SafeAwaitFailure
  = readonly [isOk: false, error: Error, data: null] & {
    readonly isOk: false
    readonly error: Error
    readonly data: null
  }

export type SafeAwaitResult<Data> = SafeAwaitSuccess<Data> | SafeAwaitFailure

function hideTupleIndexKeys<Result extends readonly [unknown, unknown, unknown]>(
  result: Result,
): Result {
  Object.defineProperty(result, 0, { enumerable: false })
  Object.defineProperty(result, 1, { enumerable: false })
  Object.defineProperty(result, 2, { enumerable: false })
  return result
}

function createSuccessResult<Data>(data: Data): SafeAwaitSuccess<Data> {
  return hideTupleIndexKeys(Object.assign([true, null, data] as const, {
    data,
    error: null,
    isOk: true as const,
  })) as SafeAwaitSuccess<Data>
}

function createFailureResult(error: Error): SafeAwaitFailure {
  return hideTupleIndexKeys(Object.assign([false, error, null] as const, {
    data: null,
    error,
    isOk: false as const,
  })) as SafeAwaitFailure
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error, { cause: error })
  }

  return new Error('Unknown error', { cause: error })
}

export async function safeAwait<Data, Args extends readonly unknown[]>(
  fn: (...args: Args) => Promise<Data>,
  ...args: Args
): Promise<SafeAwaitResult<Data>> {
  try {
    const data = await fn(...args)
    return createSuccessResult(data)
  }
  catch (error) {
    return createFailureResult(normalizeError(error))
  }
}

interface CreateContextReturns<T> {
  provideContext: (value: T) => T
  useContext: () => T
}

interface CreateContextWithDefaultReturns<T> {
  provideContext: (value?: T) => T
  useContext: () => T
}

export function createContext<T>(): CreateContextReturns<T>
export function createContext<T>(defaultValue: T): CreateContextWithDefaultReturns<T>
export function createContext<T>(
  defaultValue?: T,
): CreateContextReturns<T> | CreateContextWithDefaultReturns<T> {
  const key = Symbol('context') as Vue.InjectionKey<T>
  const hasDefaultValue = arguments.length > 0
  const missingContextValue = Symbol('context.inject.missing')

  function provideContext(value?: T): T {
    if (arguments.length === 0) {
      if (!hasDefaultValue) {
        throw new Error('Context value is missing. Pass value to provideContext or set a default in createContext.')
      }
      provide(key, defaultValue as T)
      return defaultValue as T
    }

    const contextValue = value as T
    provide(key, contextValue)
    return contextValue
  }

  function useContext(): T {
    const contextValue = inject(key, missingContextValue as T | typeof missingContextValue)

    if (contextValue !== missingContextValue) {
      return contextValue
    }

    if (hasDefaultValue) {
      return defaultValue as T
    }

    throw new Error('Context is missing. Call provideContext in parent scope before useContext.')
  }

  return {
    provideContext,
    useContext,
  }
}
