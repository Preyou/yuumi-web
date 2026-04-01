import type { AlovaGenerics } from 'alova'
import type {
  ApiMethodArg,
  ApiMethods,
  ApiOptions,
  ApiPathMap,
  ApiRequestControlOptions,
  ApiRequestProgress,
  ApiResponse,
  ApiUrls,
  CreateApiClient,
} from '@/api/createApi'
import type { UsePromiseBaseRunContext, UsePromiseFnOptions, UsePromiseFnReturns, UsePromiseFnWatchOption } from '@/shared/molecule/usePromiseFn'

/**
 * 分页状态快照。
 */
export interface RequestPaginationState {
  /** 当前页码。 */
  page?: number
  /** 每页条数。 */
  pageSize?: number
}

/**
 * 标准分页解析结果。
 */
export interface RequestPaginationResult<Item> {
  /** 当前页列表。 */
  list: Item[]
  /** 全量总条数。 */
  total: number
}

/**
 * 分页协议：负责参数映射与响应解析。
 */
export interface RequestPaginationProtocol<Params, Data, Item> {
  /**
   * 将响应解析为统一分页结构。
   *
   * @example
   * fromResponse: (res) => ({ list: res.items, total: res.total })
   */
  fromResponse: (response: Data) => RequestPaginationResult<Item>

  /**
   * 是否按无限列表模式合并数据。
   *
   * @remarks
   * 开启后新页会按页码写入已有数组片段，而不是整页覆盖。
   */
  infinite?: boolean

  /**
   * 分页起始页。
   *
   * @defaultValue `1`
   */
  firstPage?: number

  /**
   * 将分页信息写入实际请求参数。
   *
   * @example
   * toParams: ({ page, pageSize, params }) => ({
   *   ...params,
   *   params: { ...params.params, page, pageSize },
   * })
   */
  toParams: (options: {
    /** 目标页码。 */
    page: number
    /** 目标每页条数。 */
    pageSize: number
    /** 原始查询参数。 */
    params: Params
  }) => Params
}

/**
 * 工厂级默认分页协议（允许局部配置）。
 */
export type RequestCreatePaginationProtocol = Partial<RequestPaginationProtocol<unknown, unknown, unknown>>

/**
 * 请求状态写回策略类型。
 */
export type RequestStateStrategy = NonNullable<
  UsePromiseFnOptions<unknown, unknown, unknown, boolean | undefined>['strategy']
>

/**
 * 按 HTTP 方法定制的状态写回策略表。
 */
export type RequestMethodStrategyMap = Partial<Record<
  'all' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put',
  RequestStateStrategy
>>

/**
 * 某路径方法可接受的请求参数结构。
 */
export type RequestSourceOptions<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = ApiOptions<PathMap, Url, Method>

/**
 * 请求参数源中可直接透传的关键字段。
 */
export type RequestSourceOptionKey = 'data' | 'headers' | 'params' | 'path'

/**
 * 请求控制项（去除 `signal` 以便内部托管）。
 */
export type RequestControlOptions = Omit<ApiRequestControlOptions, 'signal'>

/**
 * API 客户端单方法完整参数类型。
 */
export type RequestApiMethodOptions<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = ApiMethodArg<PathMap, AG, Url, Method>

/**
 * 运行时实际传入 API 方法的参数类型。
 */
export type RequestRuntimeOptions<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = TypeFest.Simplify<RequestSourceOptions<PathMap, Url, Method> & ApiRequestControlOptions>

/**
 * 请求策略配置：统一策略或按方法策略。
 */
export type RequestStrategyOption = RequestStateStrategy | RequestMethodStrategyMap

/**
 * 工厂级 Promise 默认配置（去除局部专用字段）。
 */
export type RequestPromiseDefaultOptions = Omit<
  UsePromiseFnOptions<unknown, unknown, unknown, boolean | undefined>,
  'initData' | 'onBefore' | 'onCancel' | 'onError' | 'onFinally' | 'onSuccess' | 'params' | 'strategy' | 'timeout'
> & {
  /** 工厂级默认请求策略。 */
  strategy?: RequestStrategyOption
}

/**
 * `createRequest` 工厂级可选项。
 */
export interface CreateRequestFactoryOptions extends RequestPromiseDefaultOptions {
  /**
   * 工厂级前置钩子。
   *
   * @remarks
   * 与实例级 `onBefore` 并行执行。
   */
  onBefore?: (params: unknown, abort: (reason?: unknown) => void) => VueUse.Awaitable<void>
  /** 工厂级取消回调。 */
  onCancel?: (reason: unknown, params: unknown) => void
  /** 工厂级错误回调。 */
  onError?: (error: Error, params: unknown) => void
  /** 工厂级结算回调。 */
  onFinally?: (params: unknown) => void
  /** 工厂级成功回调。 */
  onSuccess?: (data: unknown, params: unknown) => void

  /**
   * 工厂级分页协议默认值。
   *
   * @remarks
   * `useRequest(..., { pagination: true })` 时直接复用。
   */
  pagination?: RequestCreatePaginationProtocol

  /**
   * 工厂级默认超时（毫秒）。
   *
   * @remarks
   * 实例级 `timeout` 优先级更高。
   */
  timeout?: number
}

/**
 * 请求前置钩子签名。
 */
export type RequestBeforeHandler<Params> = (
  /** 本次执行参数。 */
  params: Params | undefined,
  /** 调用可取消当前执行。 */
  abort: (reason?: unknown) => void,
) => VueUse.Awaitable<void>

/**
 * 通用事件处理函数签名。
 */
export type RequestHandler<Args extends readonly unknown[]> = (...args: Args) => void

/**
 * `useRequest` 的 `run` 方法类型。
 */
export type UseRequestRun<
  Params,
  Data,
  InitData extends Data | undefined,
> = UsePromiseFnReturns<Params, Data, InitData>['run']

/**
 * `useRequest` 的刷新方法类型。
 */
export type UseRequestRefresh<Data> = (force?: boolean) => Promise<Data>

/**
 * `useRequest` 基础返回值（重写 refresh 行为）。
 */
export type UseRequestPromiseReturns<
  Params,
  Data,
  InitData extends Data | undefined,
> = Omit<UsePromiseFnReturns<Params, Data, InitData>, 'refresh'> & {
  /**
   * 刷新当前请求。
   *
   * @param force 是否强制走 `forceRequest` 路径。
   * @defaultValue `true`
   */
  refresh: UseRequestRefresh<Data>
}

/**
 * 传输层控制与进度状态。
 */
export interface UseRequestTransportReturns<
  Params,
  Data,
  InitData extends Data | undefined,
> {
  /** 中止当前作用域内所有活动请求。 */
  abort: (reason?: unknown) => void

  /** 下载进度（0-1）。 */
  downloadProgress: Readonly<Vue.Ref<number>>

  /**
   * 强制执行请求。
   *
   * @remarks
   * 本次调用会强制带上 `forceRequest=true`，不受默认配置影响。
   */
  forceRun: UseRequestRun<Params, Data, InitData>

  /** 当前 method key（来自底层请求实例）。 */
  key: Readonly<Vue.Ref<string | undefined>>

  /** 订阅下载进度事件（0-1）。 */
  onDownload: VueUse.EventHookOn<[progress: number]>
  /** 订阅上传进度事件（0-1）。 */
  onUpload: VueUse.EventHookOn<[progress: number]>
  /** 上传进度（0-1）。 */
  uploadProgress: Readonly<Vue.Ref<number>>
}

/**
 * 分页增强能力集合。
 */
export interface UseRequestPaginationReturns<
  Params,
  Data,
  Item,
> {
  /** 清空分页列表与总数。 */
  clear: () => void

  /** 跳转到指定页并请求。 */
  go: (page: number) => Promise<Data>

  /** 分页聚合后的列表数据。 */
  list: Readonly<Vue.Ref<Item[]>>

  /** 请求下一页。 */
  next: () => Promise<Data>

  /** 当前页码。 */
  page: Readonly<Vue.Ref<number>>
  /** 当前每页条数。 */
  pageSize: Readonly<Vue.Ref<number>>

  /** 请求上一页。 */
  prev: () => Promise<Data>

  /**
   * 以新参数重新查询，并重置到第一页。
   */
  search: (params: Params) => Promise<Data>

  /**
   * 设置每页条数并可选跳页后重新请求。
   */
  setPageSize: (pageSize: number, page?: number) => Promise<Data>

  /** 全量总条数。 */
  total: Readonly<Vue.Ref<number>>
}

/**
 * 单个请求实例的 Promise 相关配置。
 */
export type RequestPromiseOptions<
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
> = Omit<UsePromiseFnOptions<Params, Data, InitData, KeepDataOnError>, 'params' | 'strategy' | 'timeout'> & {
  /**
   * 写回策略（可按方法覆盖）。
   *
   * @example
   * strategy: { get: 'lastCall', post: 'responseOrder' }
   */
  strategy?: RequestStrategyOption
  /** 本请求超时（毫秒）。 */
  timeout?: number
}

/**
 * `useRequest` 私有扩展配置。
 */
export interface UseRequestPrivateOptions<
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
  Item,
> extends RequestPromiseOptions<Params, Data, InitData, KeepDataOnError> {
  /** 分页初始状态。 */
  initial?: RequestPaginationState

  /**
   * 请求参数源。
   *
   * @remarks
   * 可传对象、`ref`、`computed` 或 getter。
   */
  requestSource?: RequestSource<Params>

  /**
   * 分页开关/分页协议。
   *
   * @remarks
   * - `false`: 关闭分页增强。
   * - `true`: 使用工厂默认分页协议。
   * - `Partial<...>`: 在工厂默认基础上局部覆盖。
   */
  pagination?: false | true | Partial<RequestPaginationProtocol<Params, Data, Item>>

  /**
   * 成功后要自动刷新的目标请求名列表。
   *
   * @remarks
   * 不能包含当前请求自身的 `name`，否则会抛错防止循环刷新。
   */
  refreshTargets?: string | readonly string[]
}

/**
 * API 方法可透传配置（剔除被 `useRequest` 接管的字段）。
 */
export type UseRequestApiOptions<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
  Item,
> = Omit<
  RequestApiMethodOptions<PathMap, AG, Url, Method>,
  | RequestSourceOptionKey
  | 'signal'
  | 'transform'
  | keyof RequestControlOptions
  | keyof UseRequestPrivateOptions<Params, Data, InitData, KeepDataOnError, Item>
>

/**
 * 响应转换器配置。
 */
export interface UseRequestTransformOption<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Data,
> {
  /**
   * 响应转换函数。
   *
   * @remarks
   * 在请求成功后执行，可同步或异步返回转换后的 `Data`。
   */
  transform?: (
    /** 原始 API 响应数据。 */
    data: ApiResponse<PathMap, Url, Method>,
    /** 响应头。 */
    headers: AG['ResponseHeader'],
  ) => Data | Promise<Data>
}

/**
 * `useRequest` 外部可用的完整配置。
 */
export type UseRequestOptions<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
  Item,
> = TypeFest.Simplify<
  UseRequestPrivateOptions<Params, Data, InitData, KeepDataOnError, Item>
  & RequestControlOptions
  & UseRequestApiOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>
  & UseRequestTransformOption<PathMap, AG, Url, Method, Data>
>

/**
 * 请求源参数类型（支持 ref/computed/getter）。
 */
export type RequestSource<Params> = Vue.MaybeRefOrGetter<Params>

/**
 * 方法维度的默认 `immediate` 推导。
 */
export type RequestMethodDefaultImmediate<Method extends string> = Lowercase<Method> extends 'get' ? true : false

/**
 * 工厂配置里的 `immediate` 默认值提取。
 */
export type RequestFactoryImmediateDefault<CreateOptions> = CreateOptions extends {
  /** 工厂层配置的 immediate 值。 */
  immediate?: infer Immediate
}
  ? Immediate
  : undefined

/**
 * 省略 `immediate` 时的最终默认值。
 */
export type RequestImmediateWhenOmitted<
  Method extends string,
  FactoryImmediateDefault,
> = [Extract<Exclude<FactoryImmediateDefault, undefined>, boolean>] extends [never]
  ? RequestMethodDefaultImmediate<Method>
  : Extract<Exclude<FactoryImmediateDefault, undefined>, boolean>

/**
 * 参数对象是否包含必填字段。
 */
export type RequestHasRequiredParams<Params> = Params extends object ? TypeFest.HasRequiredKeys<Params> : false

/**
 * 基于 `immediate` 约束 `requestSource` 是否必填。
 */
export type RequestRequireParamsByImmediate<
  Params,
  Immediate extends boolean,
> = RequestHasRequiredParams<Params> extends true
  ? true extends Immediate
    ? {
        requestSource: RequestSource<Params>
      }
    : {
        requestSource?: RequestSource<Params>
      }
  : {
      requestSource?: RequestSource<Params>
    }

/**
 * `useRequest` 的 `immediate` 分支配置类型。
 *
 * @remarks
 * - GET 在未显式传 `immediate` 时默认视为 `true`。
 * - 非 GET 在未显式传 `immediate` 时默认视为 `false`。
 * - 当参数类型存在必填字段且最终 `immediate=true` 时，`requestSource` 会被提升为必填。
 *
 * @example
 * // GET: 默认 immediate=true，参数含必填字段时需提供 requestSource
 * useRequest('/pet/{petId}', 'get', {
 *   requestSource: computed(() => ({ path: { petId: 1 } })),
 * })
 */
export type UseRequestImmediateOptions<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
  Item,
  MethodString extends string,
  FactoryImmediateDefault,
> = Omit<
  UseRequestOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>,
  'immediate' | 'requestSource'
>
& (
    | ({
      immediate: true
    } & RequestRequireParamsByImmediate<Params, true>)
    | ({
      immediate: false
    } & RequestRequireParamsByImmediate<Params, false>)
    | ({
      immediate: boolean
    } & RequestRequireParamsByImmediate<Params, boolean>)
    | ({
      immediate?: undefined
    } & RequestRequireParamsByImmediate<Params, RequestImmediateWhenOmitted<MethodString, FactoryImmediateDefault>>)
  )

/**
 * 非分页模式下第三个参数（options）是否必填的推导类型。
 *
 * @remarks
 * 当最终 `immediate=true` 且参数存在必填字段时，`options` 会被推导为必填元组项。
 */
export type UseRequestNonPaginationArgs<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
  Item,
  MethodString extends string,
  FactoryImmediateDefault,
> = RequestHasRequiredParams<Params> extends true
  ? true extends RequestImmediateWhenOmitted<MethodString, FactoryImmediateDefault>
    ? [
      options: UseRequestImmediateOptions<
        PathMap,
        AG,
        Url,
        Method,
        Params,
        Data,
        InitData,
        KeepDataOnError,
        Item,
        MethodString,
        FactoryImmediateDefault
      > & {
        pagination?: false | undefined
      },
      ]
    : [
      options?: UseRequestImmediateOptions<
        PathMap,
        AG,
        Url,
        Method,
        Params,
        Data,
        InitData,
        KeepDataOnError,
        Item,
        MethodString,
        FactoryImmediateDefault
      > & {
        pagination?: false | undefined
      },
      ]
  : [
    options?: UseRequestImmediateOptions<
      PathMap,
      AG,
      Url,
      Method,
      Params,
      Data,
      InitData,
      KeepDataOnError,
      Item,
      MethodString,
      FactoryImmediateDefault
    > & {
      pagination?: false | undefined
    },
    ]

/**
 * 刷新目标注册到全局表后的句柄。
 */
export interface RequestRefreshTargetHandle {
  /** 触发一次刷新。 */
  refresh: () => Promise<unknown>
}

/**
 * 指定路径方法的请求参数类型。
 */
export type UseRequestParams<
  PathMap extends ApiPathMap,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
> = RequestSourceOptions<PathMap, Url, Method>

/**
 * 实际调用 API 方法时的参数结构。
 */
export type UseRequestMethodOptions<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  Url extends ApiUrls<PathMap>,
  Method extends ApiMethods<PathMap, Url>,
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
  Item,
> = TypeFest.Simplify<
  RequestRuntimeOptions<PathMap, Url, Method>
  & UseRequestApiOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>
  & UseRequestTransformOption<PathMap, AG, Url, Method, Data>
  & {
    /** 单次请求超时（毫秒）。 */
    timeout?: number
  }
>

/**
 * 传给 `usePromiseFn` 的请求执行函数签名。
 */
export type UseRequestPromiseFn<Params, Data> = Extract<Params, (...args: readonly unknown[]) => unknown> extends never
  ? (
      /** 已归一化后的请求参数。 */
      params: Params,
      /** 当前调用运行上下文。 */
      context: UsePromiseBaseRunContext,
    ) => Promise<Data>
  : never

function isWatchableRequestSource<Params>(
  requestSource: RequestSource<Params> | undefined,
): requestSource is Vue.WatchSource<Params> {
  return requestSource !== undefined
    && (typeof requestSource === 'function' || isRef(requestSource) || isReactive(requestSource))
}

function resolveRequestWatchOption(
  watch: UsePromiseFnWatchOption | undefined,
  isGetMethod: boolean,
): UsePromiseFnWatchOption {
  return watch ?? isGetMethod
}

function resolveRequestStrategyByMethod(
  strategyOption: RequestStrategyOption | undefined,
  method: string,
  isGetMethod: boolean,
): RequestStateStrategy {
  const defaultStrategy = isGetMethod ? 'lastCall' : 'responseOrder'
  if (strategyOption === undefined || typeof strategyOption === 'string') {
    return strategyOption ?? defaultStrategy
  }
  return strategyOption[method as keyof RequestMethodStrategyMap] ?? strategyOption.all ?? defaultStrategy
}

function consumeRequestPromise(task: Promise<unknown>): void {
  void task.catch(() => {})
}

function normalizeProgressValue(progress: ApiRequestProgress): number {
  if (progress.total <= 0) {
    return 0
  }
  return Math.min(1, Math.max(0, progress.loaded / progress.total))
}

function normalizeRefreshTargetNames(
  refreshTargets: string | readonly string[] | undefined,
): readonly string[] {
  if (!refreshTargets) {
    return []
  }

  const source = typeof refreshTargets === 'string' ? [refreshTargets] : refreshTargets
  const uniqueNames = new Set<string>()

  for (const targetName of source) {
    if (targetName) {
      uniqueNames.add(targetName)
    }
  }

  return [...uniqueNames]
}

function bindAbortSignal(
  sourceSignal: AbortSignal | undefined,
  targetController: AbortController,
): () => void {
  if (!sourceSignal) {
    return () => {}
  }

  const targetSignal = targetController.signal
  const readSourceReason = () => (sourceSignal as AbortSignal & {
    reason?: unknown
  }).reason

  if (sourceSignal.aborted) {
    if (!targetSignal.aborted) {
      targetController.abort(readSourceReason())
    }
    return () => {}
  }

  const relayAbort = () => {
    if (!targetSignal.aborted) {
      targetController.abort(readSourceReason())
    }
  }

  sourceSignal.addEventListener('abort', relayAbort, { once: true })
  return () => {
    sourceSignal.removeEventListener('abort', relayAbort)
  }
}

function mergeRequestHandlers<Args extends readonly unknown[]>(
  globalHandler: RequestHandler<Args> | undefined,
  localHandler: RequestHandler<Args> | undefined,
): RequestHandler<Args> | undefined {
  if (!globalHandler && !localHandler) {
    return undefined
  }

  return (...args: Args) => {
    globalHandler?.(...args)
    localHandler?.(...args)
  }
}

function mergeParallelBeforeHandlers<Params>(
  globalHandler: RequestBeforeHandler<Params> | undefined,
  localHandler: RequestBeforeHandler<Params> | undefined,
): RequestBeforeHandler<Params> | undefined {
  if (!globalHandler && !localHandler) {
    return undefined
  }

  return async (params, abort) => {
    await Promise.all([
      globalHandler?.(params, abort),
      localHandler?.(params, abort),
    ])
  }
}

/**
 * 创建与 API 客户端绑定的请求 Hook 工厂。
 *
 * @param api `createApi` 返回的 API 客户端。
 * @param createOptions 全局配置；全局与局部 `onBefore` 会并行执行。
 * @returns `useRequest` 函数：按 URL + method 创建带状态管理的请求实例。
 *
 * @example
 * const useRequest = createRequest(sysApi)
 * const detail = useRequest('/pet/{petId}', 'get', {
 *   requestSource: computed(() => ({ path: { petId: 1 } })),
 *   watch: true,
 * })
 *
 * @example
 * const useRequest = createRequest(sysApi)
 * const update = useRequest('/pet', 'post', {
 *   immediate: false,
 *   watch: { deps: [() => route.query.keyword], deep: false },
 *   rateLimit: { mode: 'debounce', wait: 300 },
 * })
 *
 * @example
 * const useRequest = createRequest(sysApi, {
 *   immediate: true,
 *   keepDataOnError: false,
 *   strategy: {
 *     get: 'lastCall',
 *     post: 'responseOrder',
 *   },
 *   pagination: {
 *     toParams: ({ page, pageSize, params }) => ({
 *       ...params,
 *       params: { ...params.params, page, pageSize },
 *     }),
 *     fromResponse: (response) => ({
 *       list: response.items,
 *       total: response.total,
 *     }),
 *   },
 * })
 */
export function createRequest<
  PathMap extends ApiPathMap,
  AG extends AlovaGenerics,
  const FactoryOptions extends CreateRequestFactoryOptions = Record<string, never>,
>(
  api: CreateApiClient<PathMap, AG>,
  createOptions?: FactoryOptions,
) {
  const {
    onBefore: globalOnBefore,
    onCancel: globalOnCancel,
    onError: globalOnError,
    onFinally: globalOnFinally,
    onSuccess: globalOnSuccess,
    pagination: globalPagination,
    timeout: globalTimeout,
    ...factoryPromiseDefaults
  } = (createOptions ?? {}) as FactoryOptions
  const refreshTargetRegistry = new Map<string, Set<RequestRefreshTargetHandle>>()

  const registerRefreshTargetHandle = (name: string, handle: RequestRefreshTargetHandle) => {
    const handles = refreshTargetRegistry.get(name) ?? new Set<RequestRefreshTargetHandle>()
    handles.add(handle)
    refreshTargetRegistry.set(name, handles)

    return () => {
      const currentHandles = refreshTargetRegistry.get(name)
      if (!currentHandles) {
        return
      }
      currentHandles.delete(handle)
      if (currentHandles.size === 0) {
        refreshTargetRegistry.delete(name)
      }
    }
  }

  const refreshByTargetNames = async (targetNames: readonly string[]) => {
    if (targetNames.length === 0) {
      return
    }

    const targetHandles = new Set<RequestRefreshTargetHandle>()
    for (const targetName of targetNames) {
      const handles = refreshTargetRegistry.get(targetName)
      if (!handles) {
        continue
      }
      for (const handle of handles) {
        targetHandles.add(handle)
      }
    }

    await Promise.all([...targetHandles].map(handle => handle.refresh()))
  }

  /**
   * 创建单个 API 请求状态（不启用分页增强）。
   *
   * @param url OpenAPI 路径。
   * @param method HTTP 方法（从路径上可用的方法中自动推导）。
   * @param args 请求配置。
   * @returns `usePromiseFn` 返回值。
   */
  function useRequest<
    Url extends ApiUrls<PathMap>,
    Method extends ApiMethods<PathMap, Url>,
    Params = UseRequestParams<PathMap, Url, Method>,
    Data = ApiResponse<PathMap, Url, Method>,
    InitData extends Data | undefined = undefined,
    KeepDataOnError extends boolean | undefined = undefined,
  >(
    url: Url,
    method: Method,
    ...args: UseRequestNonPaginationArgs<
      PathMap,
      AG,
      Url,
      Method,
      Params,
      Data,
      InitData,
      KeepDataOnError,
      unknown,
      Method,
      RequestFactoryImmediateDefault<FactoryOptions>
    >
  ): UseRequestPromiseReturns<
    Params,
    Data,
    InitData
  > & UseRequestTransportReturns<
    Params,
    Data,
    InitData
  >

  /**
   * 创建单个 API 请求状态（启用分页增强）。
   *
   * @param url OpenAPI 路径。
   * @param method HTTP 方法（从路径上可用的方法中自动推导）。
   * @param options 请求配置；当 `pagination: true` 时使用全局协议，`pagination: Partial<...>` 时按字段覆盖。
   * @returns `usePromiseFn` 返回值 + 分页控制方法（`go/next/prev/search/setPageSize/clear`）。
   *
   * @example
   * const users = useRequest('/users', 'get', {
   *   requestSource: computed(() => ({ params: { keyword: keyword.value } })),
   *   pagination: true,
   * })
   * await users.next()
   */
  function useRequest<
    Url extends ApiUrls<PathMap>,
    Method extends ApiMethods<PathMap, Url>,
    Params = UseRequestParams<PathMap, Url, Method>,
    Data = ApiResponse<PathMap, Url, Method>,
    InitData extends Data | undefined = undefined,
    KeepDataOnError extends boolean | undefined = undefined,
    Item = unknown,
  >(
    url: Url,
    method: Method,
    options: UseRequestImmediateOptions<
      PathMap,
      AG,
      Url,
      Method,
      Params,
      Data,
      InitData,
      KeepDataOnError,
      Item,
      Method,
      RequestFactoryImmediateDefault<FactoryOptions>
    > & {
      pagination: true | Partial<RequestPaginationProtocol<Params, Data, Item>>
    },
  ): UseRequestPromiseReturns<
    Params,
    Data,
    InitData
  >
  & UseRequestPaginationReturns<Params, Data, Item>
  & UseRequestTransportReturns<
    Params,
    Data,
    InitData
  >

  /**
   * `useRequest` 实现：
   * - 默认行为：GET 请求默认 `immediate=true` 且 `watch=true`；非 GET 默认关闭。
   * - 生命周期：全局钩子与局部钩子合并后执行。
   * - 分页模式：在 `usePromiseFn` 基础上附加分页状态与控制方法。
   */
  function useRequest<
    Url extends ApiUrls<PathMap>,
    Method extends ApiMethods<PathMap, Url>,
    Params = UseRequestParams<PathMap, Url, Method>,
    Data = ApiResponse<PathMap, Url, Method>,
    InitData extends Data | undefined = undefined,
    KeepDataOnError extends boolean | undefined = undefined,
    Item = unknown,
  >(
    url: Url,
    method: Method,
    options?: UseRequestImmediateOptions<
      PathMap,
      AG,
      Url,
      Method,
      Params,
      Data,
      InitData,
      KeepDataOnError,
      Item,
      Method,
      RequestFactoryImmediateDefault<FactoryOptions>
    >,
  ) {
    const {
      clearErrorOnRun,
      forceRequest: forceRequestOption = false,
      immediate,
      initData,
      initial,
      isCanceledError,
      keepDataOnError,
      key: keyOption,
      onBefore: localOnBefore,
      onCancel: localOnCancel,
      onDownload: onDownloadOption,
      onError: localOnError,
      onFinally: localOnFinally,
      onMethodCreated: onMethodCreatedOption,
      onSuccess: localOnSuccess,
      onUpload: onUploadOption,
      pagination: paginationOption,
      rateLimit,
      refreshTargets: refreshTargetsOption,
      requestSource = {} as Params,
      retry,
      strategy,
      timeout: timeoutOption,
      watch: watchOption,
      ...apiPassThroughOptions
    } = (options ?? {}) as UseRequestOptions<
      PathMap,
      AG,
      Url,
      Method,
      Params,
      Data,
      InitData,
      KeepDataOnError,
      Item
    >

    const localPromiseOptions = Object.fromEntries(
      Object.entries({
        clearErrorOnRun,
        immediate,
        initData,
        isCanceledError,
        keepDataOnError,
        onBefore: localOnBefore,
        onCancel: localOnCancel,
        onError: localOnError,
        onFinally: localOnFinally,
        onSuccess: localOnSuccess,
        rateLimit,
        retry,
        strategy,
        watch: watchOption,
      }).filter(([, value]) => value !== undefined),
    ) as Partial<Omit<
      UseRequestPrivateOptions<Params, Data, InitData, KeepDataOnError, Item>,
      'initial' | 'pagination' | 'requestSource' | 'timeout'
    >>

    const mergedPromiseOptions = {
      ...factoryPromiseDefaults,
      ...localPromiseOptions,
    } as RequestPromiseDefaultOptions & Omit<
      UseRequestPrivateOptions<Params, Data, InitData, KeepDataOnError, Item>,
      'initial' | 'pagination' | 'requestSource' | 'timeout'
    >
    const normalizedMethod = String(method).toLowerCase()
    const isGetMethod = normalizedMethod === 'get'
    const resolvedImmediate = mergedPromiseOptions.immediate ?? isGetMethod
    const resolvedWatch = resolveRequestWatchOption(mergedPromiseOptions.watch, isGetMethod)
    const resolvedTimeout = timeoutOption ?? globalTimeout
    const resolvedStrategy = resolveRequestStrategyByMethod(
      mergedPromiseOptions.strategy,
      normalizedMethod,
      isGetMethod,
    )
    const resolvedKeepDataOnError = mergedPromiseOptions.keepDataOnError ?? true
    const resetDataOnError = resolvedKeepDataOnError === false
    const requestNameOption = (apiPassThroughOptions as {
      name?: unknown
    }).name
    const requestName = typeof requestNameOption === 'string' ? requestNameOption : undefined
    const refreshTargetNames = normalizeRefreshTargetNames(refreshTargetsOption)

    if (requestName && refreshTargetNames.includes(requestName)) {
      throw new Error('[useRequest] `refreshTargets` cannot contain current request `name`.')
    }

    const paramsSource = requestSource as RequestSource<Params>
    const activeAbortControllers = new Set<AbortController>()
    const forceRequestMarkers = new WeakSet<object>()
    const requestKey = ref<string>()
    const downloadProgress = ref(0)
    const uploadProgress = ref(0)
    const downloadProgressEvent = createEventHook<[progress: number]>()
    const uploadProgressEvent = createEventHook<[progress: number]>()

    const normalizeParams = (params: Params | undefined): Params => {
      if (params === undefined) {
        return {} as Params
      }
      return params
    }

    const requestApi = api(url) as Record<string, unknown>
    const requestMethod = requestApi[method] as unknown as (
      options: UseRequestMethodOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>,
    ) => Promise<Data>

    const requestWithTimeout = (
      params: UseRequestMethodOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>,
    ) => requestMethod(
      resolvedTimeout === undefined
        ? params
        : {
            ...(params as Record<string, unknown>),
            timeout: resolvedTimeout,
          } as UseRequestMethodOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>,
    )

    const abort = (reason?: unknown) => {
      for (const controller of activeAbortControllers) {
        if (!controller.signal.aborted) {
          controller.abort(reason)
        }
      }
    }

    const isPaginationEnabled = paginationOption !== false && paginationOption !== undefined

    let page: Vue.Ref<number> | null = null
    let pageSize: Vue.Ref<number> | null = null
    let list: Vue.Ref<Item[]> | null = null
    let total: Vue.Ref<number> | null = null
    let toParams: RequestPaginationProtocol<Params, Data, Item>['toParams'] | null = null
    let fromResponse: RequestPaginationProtocol<Params, Data, Item>['fromResponse'] | null = null
    let infinite = false
    let firstPage = 1
    let latestSearchParams = normalizeParams(toValue(paramsSource))

    if (isPaginationEnabled) {
      const mergedPagination = {
        ...globalPagination,
        ...(paginationOption === true ? {} : paginationOption),
      } as Partial<RequestPaginationProtocol<Params, Data, Item>>

      if (!mergedPagination.toParams || !mergedPagination.fromResponse) {
        throw new Error('[useRequest] pagination enabled but `toParams` or `fromResponse` is missing.')
      }

      toParams = mergedPagination.toParams
      fromResponse = mergedPagination.fromResponse
      infinite = mergedPagination.infinite ?? false
      firstPage = mergedPagination.firstPage ?? 1

      page = ref(initial?.page ?? firstPage)
      pageSize = ref(initial?.pageSize ?? 10)
      list = ref<Item[]>([]) as Vue.Ref<Item[]>
      total = ref(0)

      if (isWatchableRequestSource(paramsSource) && page) {
        const pageRef = page
        watch(paramsSource, (nextParams) => {
          latestSearchParams = normalizeParams(nextParams)
          pageRef.value = firstPage
        }, {
          deep: true,
        })
      }
    }

    const readForceRequest = (params: Params): boolean => {
      const marker = params as unknown as object
      if (forceRequestMarkers.has(marker)) {
        forceRequestMarkers.delete(marker)
        return true
      }
      return forceRequestOption
    }

    const executeRequest = (rawParams: Params, context: UsePromiseBaseRunContext) => {
      const normalizedParams = normalizeParams(rawParams as Params | undefined)
      const forceRequest = readForceRequest(normalizedParams)
      const baseParams = (!isPaginationEnabled || !toParams || !page || !pageSize)
        ? normalizedParams
        : normalizeParams(toParams({
            page: page.value,
            pageSize: pageSize.value,
            params: normalizedParams,
          }))
      const requestController = new AbortController()
      const cleanupContextAbortBridge = bindAbortSignal(context.signal, requestController)

      activeAbortControllers.add(requestController)
      requestKey.value = keyOption
      downloadProgress.value = 0
      uploadProgress.value = 0

      const requestParams = {
        ...(apiPassThroughOptions as Record<string, unknown>),
        ...(baseParams as Record<string, unknown>),
        forceRequest,
        key: keyOption,
        onDownload: (progress: ApiRequestProgress) => {
          const progressValue = normalizeProgressValue(progress)
          downloadProgress.value = progressValue
          consumeRequestPromise(downloadProgressEvent.trigger(progressValue))
          onDownloadOption?.(progress)
        },
        onMethodCreated: (methodInstance: NonNullable<ApiRequestControlOptions['onMethodCreated']> extends (
          method: infer M,
        ) => void ? M : never) => {
          requestKey.value = methodInstance.key
          onMethodCreatedOption?.(methodInstance)
        },
        onUpload: (progress: ApiRequestProgress) => {
          const progressValue = normalizeProgressValue(progress)
          uploadProgress.value = progressValue
          consumeRequestPromise(uploadProgressEvent.trigger(progressValue))
          onUploadOption?.(progress)
        },
        signal: requestController.signal,
      } as UseRequestMethodOptions<PathMap, AG, Url, Method, Params, Data, InitData, KeepDataOnError, Item>

      return requestWithTimeout(requestParams).finally(() => {
        cleanupContextAbortBridge()
        activeAbortControllers.delete(requestController)
      })
    }

    const mergedOnBefore = mergeParallelBeforeHandlers<Params>(
      globalOnBefore as RequestBeforeHandler<Params> | undefined,
      localOnBefore,
    )
    const mergedOnSuccess = mergeRequestHandlers<[data: Data, params: Params]>(
      globalOnSuccess as RequestHandler<[data: Data, params: Params]> | undefined,
      localOnSuccess,
    )
    const mergedOnError = mergeRequestHandlers<[error: Error, params: Params | undefined]>(
      globalOnError as RequestHandler<[error: Error, params: Params | undefined]> | undefined,
      localOnError,
    )
    const mergedOnFinally = mergeRequestHandlers<[params: Params | undefined]>(
      globalOnFinally as RequestHandler<[params: Params | undefined]> | undefined,
      localOnFinally,
    )
    const mergedOnCancel = mergeRequestHandlers<[reason: unknown, params: Params | undefined]>(
      globalOnCancel as RequestHandler<[reason: unknown, params: Params | undefined]> | undefined,
      localOnCancel,
    )

    const requestPromiseFn = executeRequest as unknown as UseRequestPromiseFn<Params, Data>
    const requestPromiseOptions = {
      ...mergedPromiseOptions,
      immediate: false,
      keepDataOnError: resolvedKeepDataOnError,
      onBefore: mergedOnBefore,
      onCancel: mergedOnCancel,
      onError: mergedOnError,
      onFinally: mergedOnFinally,
      onSuccess: mergedOnSuccess,
      params: paramsSource,
      strategy: resolvedStrategy,
      watch: resolvedWatch,
    } as UsePromiseFnOptions<Params, Data, InitData, KeepDataOnError> & {
      immediate: false
      params: RequestSource<Params>
    }
    const requestState = usePromiseFn(requestPromiseFn, requestPromiseOptions) as UsePromiseFnReturns<
      Params,
      Data,
      InitData
    >
    const runRequestState = requestState.run as UseRequestRun<Params, Data, InitData>
    const runRequestStateInternal = runRequestState as (
      params: Params,
      ...optimisticArgs: [] | [unknown]
    ) => Promise<Data>
    const forceRun = ((...args: Parameters<UseRequestRun<Params, Data, InitData>>) => {
      const rawParams = args[0] as Params | undefined
      const optimisticArgs = args.slice(1) as [] | [unknown]
      const normalizedParams = normalizeParams(rawParams)
      const marker = normalizedParams as unknown as object
      forceRequestMarkers.add(marker)
      return runRequestStateInternal(normalizedParams, ...optimisticArgs).finally(() => {
        forceRequestMarkers.delete(marker)
      })
    }) as UseRequestRun<Params, Data, InitData>
    const forceRunInternal = forceRun as (
      params: Params,
      ...optimisticArgs: [] | [unknown]
    ) => Promise<Data>
    let hasRefreshParamsSnapshot = false
    let refreshParamsSnapshot: Params | undefined
    requestState.onBefore((params) => {
      hasRefreshParamsSnapshot = true
      refreshParamsSnapshot = params as Params | undefined
    })
    const refresh: UseRequestRefresh<Data> = (force = true) => {
      if (!force) {
        return requestState.refresh()
      }
      const normalizedParams = normalizeParams(
        (hasRefreshParamsSnapshot ? refreshParamsSnapshot : toValue(paramsSource)) as Params | undefined,
      )
      return forceRunInternal(normalizedParams)
    }
    let autoRefreshDepth = 0
    const refreshAsTarget = () => {
      autoRefreshDepth += 1
      return refresh(true).finally(() => {
        autoRefreshDepth = Math.max(0, autoRefreshDepth - 1)
      })
    }
    const unregisterRefreshTargetHandle = requestName
      ? registerRefreshTargetHandle(requestName, {
          refresh: refreshAsTarget,
        })
      : undefined
    const transportState = {
      abort,
      downloadProgress: readonly(downloadProgress),
      forceRun,
      key: readonly(requestKey),
      onDownload: downloadProgressEvent.on,
      onUpload: uploadProgressEvent.on,
      uploadProgress: readonly(uploadProgress),
    } satisfies UseRequestTransportReturns<Params, Data, InitData>

    requestState.onSuccess(() => {
      if (autoRefreshDepth > 0 || refreshTargetNames.length === 0) {
        return
      }
      consumeRequestPromise(refreshByTargetNames(refreshTargetNames))
    })

    onScopeDispose(() => {
      unregisterRefreshTargetHandle?.()
      abort(new Error('Canceled by scope dispose'))
    })

    if (!isPaginationEnabled || !page || !pageSize || !list || !total || !fromResponse) {
      if (resolvedImmediate) {
        consumeRequestPromise(refresh(false))
      }
      return {
        ...requestState,
        ...transportState,
        refresh,
      }
    }

    const resetPaginationData = () => {
      if (mergedPromiseOptions.initData !== undefined) {
        const parsedInit = fromResponse(mergedPromiseOptions.initData as Data)
        total.value = parsedInit.total
        list.value = parsedInit.list
        return
      }
      total.value = 0
      list.value = []
    }

    if (mergedPromiseOptions.initData !== undefined) {
      resetPaginationData()
    }

    const applyPaginationData = (response: Data) => {
      const parsed = fromResponse(response)
      total.value = parsed.total

      if (!infinite) {
        list.value = parsed.list
        return
      }

      const mergedList = list.value.slice()
      mergedList.length = parsed.total
      const startIndex = Math.max(0, page.value - firstPage) * pageSize.value

      for (let index = 0; index < parsed.list.length; index += 1) {
        mergedList[startIndex + index] = parsed.list[index] as Item
      }

      list.value = mergedList
    }

    requestState.onSuccess((response, params) => {
      latestSearchParams = normalizeParams(params as Params | undefined)
      applyPaginationData(response)
    })

    if (resetDataOnError) {
      requestState.onError(() => {
        resetPaginationData()
      })
    }

    let paginationActionSeed = 0
    let latestPaginationAction = 0

    const isValidPaginationAction = (actionId: number) =>
      resolvedStrategy !== 'lastCall' || actionId === latestPaginationAction

    const runWithPagination = async (
      nextPage: number,
      nextPageSize: number,
      params: Params,
    ) => {
      const snapshotPage = page.value
      const snapshotPageSize = pageSize.value
      const actionId = ++paginationActionSeed
      latestPaginationAction = actionId

      page.value = nextPage
      pageSize.value = nextPageSize
      latestSearchParams = params

      try {
        return await runRequestStateInternal(params)
      }
      catch (error) {
        if (isValidPaginationAction(actionId)) {
          page.value = resetDataOnError ? firstPage : snapshotPage
          pageSize.value = snapshotPageSize
        }
        throw error
      }
    }

    const go = (nextPage: number) => runWithPagination(nextPage, pageSize.value, latestSearchParams)
    const next = () => go(page.value + 1)
    const prev = () => go(page.value - 1)
    const search = (params: Params) => runWithPagination(firstPage, pageSize.value, params)
    const setPageSize = (nextPageSize: number, nextPage = firstPage) =>
      runWithPagination(nextPage, nextPageSize, latestSearchParams)

    const clear = () => {
      list.value = []
      total.value = 0
    }

    if (resolvedImmediate) {
      consumeRequestPromise(refresh(false))
    }

    return {
      ...requestState,
      ...transportState,
      clear,
      go,
      list: readonly(list),
      next,
      page: readonly(page),
      pageSize: readonly(pageSize),
      prev,
      refresh,
      search,
      setPageSize,
      total: readonly(total),
    }
  }

  return useRequest
}
