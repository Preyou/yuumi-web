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

export interface ApiRequestControlOptions {
  forceRequest?: boolean
  key?: string
  /**
   * Method 实例创建后触发，可用于访问最终 Method（含自动生成与手动覆盖 key 后的实例）。
   */
  onMethodCreated?: (methodInstance: AlovaMethod) => void
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

interface CreateApiOptions {
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
  { resolvePath = defaultResolvePath }: CreateApiOptions = {},
): CreateApiClient<PathMap, AG> {
  return ((url: ApiUrls<PathMap>) => new Proxy({}, {
    get: (_, methodKey) => {
      return async (arg: Record<string, unknown> = {}) => {
        const {
          forceRequest = false,
          key,
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

        if (!signal) {
          return methodInstance.send(forceRequest)
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
        return methodInstance
          .send(forceRequest)
          .finally(() => {
            signal.removeEventListener('abort', abortBySignal)
          })
      }
    },
  })) as CreateApiClient<PathMap, AG>
}
