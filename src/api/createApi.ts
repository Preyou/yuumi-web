import type { Alova, AlovaGenerics, Method as AlovaMethod, AlovaMethodCreateConfig } from 'alova'

export type ApiPathMap = Record<string, Record<string, {
  params?: unknown
  responses?: unknown
}>>

export type ApiUrls<PathMap extends ApiPathMap> = Extract<keyof PathMap, string>

export type ApiMethods<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
> = Extract<keyof PathMap[Url], string>

export type ApiResponse<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = PathMap[Url][Method] extends { responses: infer Responses } ? Responses : never

export type ApiOptions<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = ApiParams<PathMap[Url][Method] extends { params: infer Params } ? Params : never>

export interface ApiRequestProgress {
  loaded: number
  total: number
}

export interface ApiRequestNotifyOptions {
  /**
   * 是否展示成功提示。
   *
   * @remarks
   * 优先级高于 `createApi(..., { notify })` 中的默认策略。
   */
  success?: boolean
  /**
   * 是否展示失败提示。
   *
   * @remarks
   * 优先级高于 `createApi(..., { notify })` 中的默认策略。
   */
  error?: boolean
  /**
   * 成功提示文案覆盖。
   */
  successMessage?: string
  /**
   * 失败提示文案覆盖。
   */
  errorMessage?: string
}

export interface ApiNotifyContext {
  forceRequest: boolean
  key?: string
  method: string
  url: string
}

export interface ApiNotifyOptions {
  /**
   * 默认是否展示失败提示。
   *
   * @defaultValue `true`
   */
  defaultError?: boolean | ((context: ApiNotifyContext) => boolean)
  /**
   * 默认是否展示成功提示。
   *
   * @defaultValue 非 `GET/HEAD/OPTIONS` 请求为 `true`，其余为 `false`
   */
  defaultSuccess?: boolean | ((context: ApiNotifyContext) => boolean)
  /**
   * 错误文案解析器。
   */
  getErrorMessage?: (response: unknown | undefined, error: unknown, context: ApiNotifyContext) => string
  /**
   * 成功文案解析器。
   */
  getSuccessMessage?: (response: unknown, context: ApiNotifyContext) => string
  /**
   * 业务成功判定。
   *
   * @remarks
   * 默认返回 `true`（仅网络错误会进入失败提示链路）。
   */
  isBusinessSuccess?: (response: unknown, context: ApiNotifyContext) => boolean
  /**
   * 失败提示分发器（如 `toast.error`）。
   */
  onError?: (message: string, context: ApiNotifyContext & { error: unknown, response?: unknown }) => void
  /**
   * 成功提示分发器（如 `toast.success`）。
   */
  onSuccess?: (message: string, context: ApiNotifyContext & { response: unknown }) => void
  /**
   * 最终提示开关（支持统一静默规则）。
   */
  shouldNotify?: (
    phase: 'error' | 'success',
    context: ApiNotifyContext,
    requestNotify: false | ApiRequestNotifyOptions | undefined,
  ) => boolean
}

export interface ApiRequestControlOptions {
  forceRequest?: boolean
  key?: string
  /**
   * Method 实例创建后触发，可用于访问最终 Method（含自动生成与手动覆盖 key 后的实例）。
   */
  onMethodCreated?: (methodInstance: AlovaMethod) => void
  /**
   * 单请求自动提示控制。
   *
   * @remarks
   * 传 `false` 可完全关闭该请求的自动提示。
   */
  notify?: false | ApiRequestNotifyOptions
  onDownload?: (progress: ApiRequestProgress) => void
  onUpload?: (progress: ApiRequestProgress) => void
  signal?: AbortSignal
}

export type ApiMethodArg<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = TypeFest.Merge<
  AlovaMethodCreateConfig<AG, unknown, ApiResponse<PathMap, Url, Method>>,
  ApiOptions<PathMap, Url, Method> & ApiRequestControlOptions & {
    transform?: (data: ApiResponse<PathMap, Url, Method>, headers: AG['ResponseHeader']) => unknown
  }
>

type ApiMethodCallArgs<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Arg extends object,
> = TypeFest.HasRequiredKeys<ApiOptions<PathMap, Url, Method>> extends true
  ? [arg: Arg]
  : [arg?: Arg]

/**
 * `createApi` 返回的 API 客户端类型。
 *
 * @remarks
 * 调用形态为：`api(url).[method](arg)`。
 * - `url`：受 `PathMap` 约束，只能传已声明路径。
 * - `method`：受路径约束，只能传该路径存在的方法。
 * - `arg`：由 OpenAPI 参数推导，包含 `path / params / data` 以及 alova 配置。
 *   无必填字段时可省略。
 * - 当传入 `transform` 时，Promise 返回值会自动收敛为 `transform` 的返回类型。
 *
 * @example
 * const api = createApi<PathMap>(alova)
 * const detail = await api('/pet/{petId}').get({
 *   path: { petId: 1 },
 * })
 *
 * @example
 * const names = await api('/pets').get({
 *   transform: (data) => data.items.map(item => item.name),
 * })
 */
export type CreateApiClient<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics = AlovaGenerics,
> = <Url extends ApiUrls<PathMap>>(url: Url) => {
  [Method in ApiMethods<PathMap, Url>]: <
    P extends ApiMethodArg<PathMap, AG, Url, Method>,
    Responded = P extends {
      transform: (data: ApiResponse<PathMap, Url, Method>, headers: AG['ResponseHeader']) => infer Res
    }
      ? Res
      : ApiResponse<PathMap, Url, Method>,
  >(...args: ApiMethodCallArgs<PathMap, Url, Method, P>
  ) => Promise<Responded>
}

export type InferAlovaGenerics<T> = T extends Alova<infer AG> ? AG : never

type ApiParams<Origin>
  = [Origin] extends [never]
    ? Record<string, never>
    : Origin extends object
      ? TypeFest.PartialOnUndefinedDeep<{
        data: Origin extends { body?: infer Body } ? Body : never
        params: Origin extends { query?: infer Query } ? Query : never
        path: Origin extends { path?: infer Path } ? Path : never
      } & Omit<Origin, 'body' | 'path' | 'query' | 'url'>>
      : Record<string, never>

type ApiPathValue = boolean | number | string

type ApiPathParams = Record<string, ApiPathValue>

function defaultResolvePath(url: string, path?: ApiPathParams): string {
  if (!path) {
    return url
  }

  return Object.entries(path).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, encodeURIComponent(String(value))),
    url,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toAbortError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason
  }

  if (typeof reason === 'string') {
    const error = new Error(reason)
    error.name = 'AbortError'
    return error
  }

  const error = new Error('Aborted by signal')
  error.name = 'AbortError'
  return error
}

function isAbortLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  if (error.name === 'AbortError') {
    return true
  }

  const message = error.message.toLowerCase()
  return message.includes('abort') || message.includes('cancel')
}

function isMutationMethod(method: string): boolean {
  const normalizedMethod = method.toLowerCase()
  return normalizedMethod !== 'get' && normalizedMethod !== 'head' && normalizedMethod !== 'options'
}

function resolveDefaultNotifyEnabled(
  phase: 'error' | 'success',
  context: ApiNotifyContext,
  notify: ApiNotifyOptions,
): boolean {
  const configuredDefault = phase === 'success' ? notify.defaultSuccess : notify.defaultError
  if (typeof configuredDefault === 'function') {
    return configuredDefault(context)
  }
  if (typeof configuredDefault === 'boolean') {
    return configuredDefault
  }

  if (phase === 'success') {
    return isMutationMethod(context.method)
  }
  return true
}

function resolveRequestNotifyEnabled(
  phase: 'error' | 'success',
  context: ApiNotifyContext,
  notify: ApiNotifyOptions,
  requestNotify: false | ApiRequestNotifyOptions | undefined,
): boolean {
  if (requestNotify === false) {
    return false
  }

  const requestOverride = phase === 'success' ? requestNotify?.success : requestNotify?.error
  const enabled = typeof requestOverride === 'boolean'
    ? requestOverride
    : resolveDefaultNotifyEnabled(phase, context, notify)

  if (!enabled) {
    return false
  }

  return notify.shouldNotify?.(phase, context, requestNotify) ?? true
}

function extractErrorResponse(error: unknown): unknown {
  if (!isRecord(error)) {
    return undefined
  }
  const response = error.response
  if (!isRecord(response)) {
    return undefined
  }
  return response.data
}

interface CreateApiOptions {
  /**
   * 自动提示策略（提示文案解析 + 提示分发）。
   */
  notify?: ApiNotifyOptions
  /**
   * 自定义路径参数替换逻辑。
   *
   * 默认逻辑会将 `/users/{id}` 与 `{ id: 1 }` 解析为 `/users/1`，
   * 并对路径值执行 `encodeURIComponent`。
   */
  resolvePath?: (url: string, path?: ApiPathParams) => string
}

/**
 * 创建类型化 API 客户端。
 *
 * @remarks
 * 若希望获得完整的 alova 配置类型提示（如请求配置、响应头类型），
 * 请同时显式传入第二个泛型参数：
 * `createApi<PathMap, InferAlovaGenerics<typeof alovaInstance>>(alovaInstance)`。
 *
 * @param alovaInstance alova 实例。
 * @param options 可选配置；可覆盖路径参数替换逻辑。
 * @param options.notify 自动提示策略（提示开关、文案解析、提示分发）。
 * @param options.resolvePath 路径解析器，默认会替换 `{key}` 并对值做 URL 编码。
 * @returns 类型安全的 `api` 客户端，调用形态为 `api(url).[method](arg)`。
 *
 * @example
 * const api = createApi<PathMap, InferAlovaGenerics<typeof alovaInstance>>(alovaInstance)
 * await api('/pet/{petId}').get({ path: { petId: 1 } })
 *
 * @example
 * const api = createApi<PathMap>(alovaInstance)
 * await api('/pet/{petId}').get({ path: { petId: 1 } })
 *
 * @example
 * const api = createApi<PathMap>(alovaInstance, {
 *   resolvePath: (url, path) => customResolve(url, path),
 * })
 *
 * @example
 * const api = createApi<PathMap>(alovaInstance)
 * const names = await api('/pets').get({
 *   params: { page: 1, pageSize: 20 },
 *   transform: (data) => data.items.map(item => item.name),
 * })
 */
export function createApi<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
>(
  alovaInstance: Alova<AG>,
  { notify: notifyOptions, resolvePath = defaultResolvePath }: CreateApiOptions = {},
): CreateApiClient<PathMap, AG> {
  return ((url: ApiUrls<PathMap>) => new Proxy({}, {
    get: (_, methodKey) => {
      return async (arg: Record<string, unknown> = {}) => {
        const {
          forceRequest = false,
          key,
          notify: requestNotify,
          onDownload,
          onMethodCreated,
          onUpload,
          path,
          signal,
          ...originConfig
        } = arg as Record<string, unknown> & ApiRequestControlOptions & {
          path?: ApiPathParams
        }
        const methodInstance = alovaInstance.Request({
          ...originConfig,
          method: String(methodKey),
          url: resolvePath(url, path),
        })

        if (key !== undefined) {
          methodInstance.key = key
        }
        onMethodCreated?.(methodInstance)
        onDownload && methodInstance.onDownload(onDownload)
        onUpload && methodInstance.onUpload(onUpload)

        const notifyContext: ApiNotifyContext = {
          forceRequest,
          key: typeof key === 'string' ? key : undefined,
          method: String(methodKey),
          url: String(url),
        }

        const getCustomMessage = (phase: 'error' | 'success'): string | undefined => {
          if (requestNotify === false) {
            return undefined
          }
          const customMessage = phase === 'success' ? requestNotify?.successMessage : requestNotify?.errorMessage
          if (typeof customMessage !== 'string') {
            return undefined
          }

          const trimmed = customMessage.trim()
          return trimmed ? trimmed : undefined
        }

        const emitSuccessNotify = (response: unknown) => {
          if (!notifyOptions?.onSuccess) {
            return
          }
          if (!resolveRequestNotifyEnabled('success', notifyContext, notifyOptions, requestNotify)) {
            return
          }

          const message = getCustomMessage('success')
            ?? notifyOptions.getSuccessMessage?.(response, notifyContext)
          if (message === undefined) {
            throw new Error('[createApi.notify] success message is required when success notify is enabled')
          }

          const normalizedMessage = message.trim()
          if (!normalizedMessage) {
            throw new Error('[createApi.notify] success message cannot be empty')
          }

          notifyOptions.onSuccess(normalizedMessage, {
            ...notifyContext,
            response,
          })
        }

        const emitErrorNotify = (response: unknown | undefined, error: unknown) => {
          if (!notifyOptions?.onError || isAbortLikeError(error)) {
            return
          }
          if (!resolveRequestNotifyEnabled('error', notifyContext, notifyOptions, requestNotify)) {
            return
          }

          const message = getCustomMessage('error')
            ?? notifyOptions.getErrorMessage?.(response, error, notifyContext)
          if (message === undefined) {
            throw new Error('[createApi.notify] error message is required when error notify is enabled')
          }

          const normalizedMessage = message.trim()
          if (!normalizedMessage) {
            throw new Error('[createApi.notify] error message cannot be empty')
          }

          notifyOptions.onError(normalizedMessage, {
            ...notifyContext,
            error,
            response,
          })
        }

        const executeRequest = () => {
          return methodInstance
            .send(forceRequest)
            .then((response) => {
              if (!notifyOptions) {
                return response
              }

              const isBusinessSuccess = notifyOptions.isBusinessSuccess?.(response, notifyContext) ?? true
              if (isBusinessSuccess) {
                emitSuccessNotify(response)
              }
              else {
                emitErrorNotify(response, response)
              }
              return response
            })
            .catch((error: unknown) => {
              emitErrorNotify(extractErrorResponse(error), error)
              return Promise.reject(error)
            })
        }

        if (!signal) {
          return executeRequest()
        }

        if (signal.aborted) {
          void methodInstance.abort()
          return Promise.reject(toAbortError((signal as AbortSignal & {
            reason?: unknown
          }).reason))
        }

        const abortBySignal = () => {
          void methodInstance.abort()
        }

        signal.addEventListener('abort', abortBySignal, { once: true })
        return executeRequest()
          .finally(() => {
            signal.removeEventListener('abort', abortBySignal)
          })
      }
    },
  })) as CreateApiClient<PathMap, AG>
}
