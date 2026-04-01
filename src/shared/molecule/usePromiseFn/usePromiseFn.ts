import type {
  PromiseStatus,
  UsePromiseBaseOptions,
  UsePromiseBaseRunContext,
  UsePromiseBaseRunOptimisticUpdater,
} from './usePromiseBase'
import { usePromiseBase } from './usePromiseBase'

/**
 * 根据 `initData` 是否为 `undefined` 推导响应式 `data` 的值类型。
 */
export type DataRefValue<
  Data,
  InitData extends Data | undefined,
>
  = undefined extends InitData
    ? Data | undefined
    : Data

/**
 * `run` 的乐观更新函数签名。
 */
export type UsePromiseFnRunOptimisticUpdater<Data> = UsePromiseBaseRunOptimisticUpdater<Data>

/**
 * `run` 乐观更新入参：可传“更新函数”或“目标值”。
 */
export type UsePromiseFnRunOptimisticValue<Data>
  = UsePromiseFnRunOptimisticUpdater<Data> | Data

/**
 * `usePromiseFn` 继承自 `usePromiseBase` 的基础配置。
 */
export type UsePromiseFnBaseOptions<
  Params,
  Data,
  InitData extends Data | undefined,
  KeepDataOnError extends boolean | undefined,
> = Omit<
  UsePromiseBaseOptions<Params, Data, DataRefValue<Data, InitData>>,
  'initData' | 'keepDataOnError'
> & {
  /** 初始数据。 */
  initData?: InitData
  /**
   * 失败时是否保留 `data`。
   *
   * @defaultValue `true`
   */
  keepDataOnError?: KeepDataOnError
}

/**
 * 参数监听配置；支持布尔开关或详细监听项。
 */
export type UsePromiseFnWatchOption
  = | boolean
    | {
      /**
       * 额外监听源列表。
       *
       * @remarks
       * 配置后由这些依赖触发执行，而不是由 `params` 本身触发。
       */
      deps?: readonly Vue.WatchSource<unknown>[]
      /**
       * 监听是否深度追踪。
       *
       * @defaultValue `true`
       */
      deep?: boolean
    }

/**
 * 运行限频配置；支持防抖与节流两种模式。
 */
export type UsePromiseFnRateLimitOption
  = | {
    /**
     * 防抖最大等待时间（毫秒）。
     *
     * @remarks
     * 达到后会强制执行一次，避免长时间不触发。
     */
    maxWait?: number
    /** 限频模式：防抖。 */
    mode: 'debounce'
    /** 防抖等待时间（毫秒）。 */
    wait: number
  }
  | {
    /**
     * 节流窗口起始是否立即执行。
     *
     * @defaultValue `true`
     */
    leading?: true
    /** 限频模式：节流。 */
    mode: 'throttle'
    /**
     * 节流窗口结束是否补一次尾调用。
     *
     * @defaultValue `true`
     */
    trailing?: boolean
    /** 节流窗口大小（毫秒）。 */
    wait: number
  }
  | {
    /** 显式关闭首触发立即执行。 */
    leading: false
    /** 限频模式：节流。 */
    mode: 'throttle'
    /** `leading=false` 时必须保留尾调用。 */
    trailing: true
    /** 节流窗口大小（毫秒）。 */
    wait: number
  }

/**
 * `usePromiseFn` 完整配置项。
 */
export type UsePromiseFnOptions<
  Params,
  Data,
  InitData extends Data | undefined = undefined,
  KeepDataOnError extends boolean | undefined = undefined,
> = UsePromiseFnBaseOptions<Params, Data, InitData, KeepDataOnError> & {
  /**
   * 参数源（对象/ref/computed/getter）。
   *
   * @remarks
   * `immediate=true` 且参数有必填字段时，需要提供该字段。
   */
  params?: Vue.MaybeRefOrGetter<Params>

  /**
   * 自动执行的监听配置。
   *
   * @example
   * watch: { deps: [() => route.query.keyword], deep: false }
   */
  watch?: UsePromiseFnWatchOption

  /**
   * 执行限频配置。
   *
   * @example
   * rateLimit: { mode: 'debounce', wait: 300, maxWait: 1000 }
   */
  rateLimit?: UsePromiseFnRateLimitOption

  /**
   * 是否在创建后自动执行一次。
   *
   * @defaultValue `true`
   */
  immediate?: boolean
}

/**
 * `usePromiseFn` 返回的状态、事件与控制方法。
 */
export interface UsePromiseFnReturns<
  Params,
  Data,
  InitData extends Data | undefined = undefined,
> {
  /** 响应式数据。 */
  data: Readonly<Vue.Ref<DataRefValue<Data, InitData>>>
  /** 最近一次错误。 */
  error: Readonly<Vue.Ref<Error | null>>
  /** 是否有执行中的调用。 */
  loading: Readonly<Vue.Ref<boolean>>
  /** 并发执行计数。 */
  pendingCount: Readonly<Vue.Ref<number>>
  /** 状态机当前状态。 */
  status: Readonly<Vue.Ref<PromiseStatus>>
  /** `status === 'success'` 的便捷只读标记。 */
  isSuccess: Readonly<Vue.Ref<boolean>>
  /** `status === 'error'` 的便捷只读标记。 */
  isError: Readonly<Vue.Ref<boolean>>

  /**
   * 主动执行请求。
   *
   * @remarks
   * `Params=never` 场景下，参数固定为 `undefined`。
   * 第二个参数支持传更新函数或直接传目标值。
   */
  run: [Params] extends [never]
    ? (
        params: undefined,
        ...optimisticArgs: [] | [UsePromiseFnRunOptimisticValue<DataRefValue<Data, InitData>>]
      ) => Promise<Data>
    : (
        params: Params,
        ...optimisticArgs: [] | [UsePromiseFnRunOptimisticValue<DataRefValue<Data, InitData>>]
      ) => Promise<Data>

  /**
   * 重新执行。
   *
   * @remarks
   * 优先复用最近一次已执行参数；若不存在，则读取当前 `params` 源。
   */
  refresh: () => Promise<Data>

  /** 订阅执行前事件。 */
  onBefore: VueUse.EventHookOn<[
    params: [Params] extends [never] ? undefined : Params | undefined,
    abort: (reason?: unknown) => void,
  ]>

  /** 订阅成功事件。 */
  onSuccess: VueUse.EventHookOn<[
    data: Data,
    params: [Params] extends [never] ? undefined : Params,
  ]>

  /** 订阅错误事件。 */
  onError: VueUse.EventHookOn<[
    error: Error,
    params: [Params] extends [never] ? undefined : Params | undefined,
  ]>

  /** 订阅结算事件。 */
  onFinally: VueUse.EventHookOn<[
    params: [Params] extends [never] ? undefined : Params | undefined,
  ]>

  /** 订阅取消事件。 */
  onCancel: VueUse.EventHookOn<[
    reason: unknown,
    params: [Params] extends [never] ? undefined : Params | undefined,
  ]>
}

/**
 * `watch` 选项归一化后的内部结构。
 */
export interface ResolvedWatchOption {
  /** 是否深度监听。 */
  deep: boolean
  /** 额外监听源。 */
  deps?: readonly Vue.WatchSource<unknown>[]
  /** 是否开启监听。 */
  enabled: boolean
}

/**
 * 被防抖/节流暂存的待执行任务描述。
 */
export interface ScheduledRun<Params, Data, DataValue> {
  /** 本次调度携带的乐观更新入参。 */
  optimisticArgs: [] | [UsePromiseFnRunOptimisticValue<DataValue>]
  /** 本次调度参数。 */
  params: Params | undefined
  /** 失败/取消回调。 */
  reject: (reason?: unknown) => void
  /** 成功回调。 */
  resolve: (value: Data | PromiseLike<Data>) => void
}

const DEBOUNCE_CANCEL_MESSAGE = 'Canceled by debounce'
const SCOPE_DISPOSE_CANCEL_MESSAGE = 'Canceled by scope dispose'
const THROTTLE_CANCEL_MESSAGE = 'Canceled by throttle'

function createRateLimitCancelError(mode: 'debounce' | 'throttle'): Error {
  return new Error(mode === 'debounce' ? DEBOUNCE_CANCEL_MESSAGE : THROTTLE_CANCEL_MESSAGE)
}

function createScopeDisposeCancelError(): Error {
  return new Error(SCOPE_DISPOSE_CANCEL_MESSAGE)
}

function consumeRunPromise(task: Promise<unknown>): void {
  void task.catch(() => {})
}

function resolveWatchOption(watchOption: UsePromiseFnWatchOption | undefined): ResolvedWatchOption {
  if (watchOption === false) {
    return { deep: true, enabled: false }
  }

  if (watchOption === true || watchOption === undefined) {
    return { deep: true, enabled: true }
  }

  const { deep = true, deps } = watchOption
  return {
    deep,
    deps,
    enabled: true,
  }
}

function isWatchableParamsSource<Params>(
  paramsSource: Vue.MaybeRefOrGetter<Params> | undefined,
): paramsSource is Vue.WatchSource<Params> {
  return paramsSource !== undefined
    && (typeof paramsSource === 'function' || isRef(paramsSource) || isReactive(paramsSource))
}

/**
 * 统一管理 Promise 函数状态与生命周期钩子。
 *
 * @param promiseFn 无业务参数 Promise 函数（调用形态为 `promiseFn(undefined, ctx)`）。
 * @param options 配置项；不接收 `params`。
 * @returns 包含请求状态、控制方法和生命周期事件注册器。
 *
 * @example
 * const request = usePromiseFn((_params, _ctx) => fetchHealth(), { immediate: true })
 * await request.refresh()
 *
 * @example
 * const request = usePromiseFn((_params, _ctx) => fetchHealth(), {
 *   watch: false,
 * })
 */
export function usePromiseFn<
  Data,
  InitData extends Data | undefined = undefined,
  KeepDataOnError extends boolean | undefined = undefined,
>(
  promiseFn: (params: undefined, ctx: UsePromiseBaseRunContext) => Promise<Data>,
  options?: Omit<UsePromiseFnOptions<never, Data, InitData, KeepDataOnError>, 'params'> & {
    params?: never
  },
): UsePromiseFnReturns<never, Data, InitData>

/**
 * 统一管理 Promise 函数状态与生命周期钩子。
 *
 * @param promiseFn 带业务参数 Promise 函数（调用形态为 `promiseFn(params, ctx)`）。
 * @param options 配置项。
 * @returns 包含请求状态、控制方法和生命周期事件注册器。
 *
 * @remarks
 * 当函数需要参数且 `immediate` 为 `true`（默认）时，`options.params` 必填。
 *
 * @example
 * const query = reactive({ page: 1, pageSize: 20 })
 * const request = usePromiseFn((params: { page: number, pageSize: number }, _ctx) => fetchList(params), {
 *   params: query,
 *   watch: true,
 * })
 *
 * @example
 * const request = usePromiseFn((params: Query, _ctx) => fetchList(params), {
 *   immediate: false,
 *   params: () => ({ page: 1, pageSize: 20 }),
 *   watch: {
 *     deps: [() => route.query.keyword],
 *     deep: false,
 *   },
 * })
 *
 * @example
 * const request = usePromiseFn((params: Query, _ctx) => fetchList(params), {
 *   params: query,
 *   rateLimit: { mode: 'debounce', wait: 300, maxWait: 1000 },
 * })
 */
export function usePromiseFn<
  PromiseFn extends (params: never, ctx: UsePromiseBaseRunContext) => Promise<unknown>,
  Params = Parameters<PromiseFn>[0],
  Data = Awaited<ReturnType<PromiseFn>>,
  InitData extends Data | undefined = undefined,
  KeepDataOnError extends boolean | undefined = undefined,
>(
  promiseFn: Extract<Params, (...args: readonly unknown[]) => unknown> extends never ? PromiseFn : never,
  options:
    | (UsePromiseFnOptions<NoInfer<Params>, Data, InitData, KeepDataOnError> & {
      immediate?: true
      params: Vue.MaybeRefOrGetter<NoInfer<Params>>
    })
    | (UsePromiseFnOptions<NoInfer<Params>, Data, InitData, KeepDataOnError> & {
      immediate: false
    }),
): UsePromiseFnReturns<Params, Data, InitData>

export function usePromiseFn(...args: readonly unknown[]): unknown {
  const [promiseFn, options] = args as readonly [
    ((params: unknown, ctx: UsePromiseBaseRunContext) => Promise<unknown>),
    UsePromiseFnOptions<unknown, unknown, unknown, boolean | undefined> | undefined,
  ]

  return createUsePromiseFn(promiseFn, options)
}

function createUsePromiseFn<
  Params,
  Data,
  InitData extends Data | undefined = undefined,
  KeepDataOnError extends boolean | undefined = undefined,
>(
  promiseFn: (params: Params, ctx: UsePromiseBaseRunContext) => Promise<Data>,
  options: UsePromiseFnOptions<Params, Data, InitData, KeepDataOnError> = {} as UsePromiseFnOptions<
    Params,
    Data,
    InitData,
    KeepDataOnError
  >,
): UsePromiseFnReturns<Params, Data, InitData> {
  const {
    immediate = true,
    params: paramsSource,
    rateLimit: rateLimitOption,
    watch: watchOption,
    ...basePassThroughOptions
  } = options
  const resolvedWatchOption = resolveWatchOption(watchOption)
  const executePromiseFn = promiseFn as (params: Params, ctx: UsePromiseBaseRunContext) => Promise<Data>

  const readParamsFromSource = (): Params | undefined => {
    return paramsSource === undefined ? undefined : toValue(paramsSource)
  }

  const base = usePromiseBase<Params, Data, DataRefValue<Data, InitData>>(executePromiseFn, {
    ...basePassThroughOptions,
    initData: basePassThroughOptions.initData as DataRefValue<Data, InitData>,
  })

  const debounceWait = rateLimitOption?.mode === 'debounce' ? Math.max(0, rateLimitOption.wait) : 0
  const debounceMaxWait = rateLimitOption?.mode === 'debounce' && rateLimitOption.maxWait !== undefined
    ? Math.max(0, rateLimitOption.maxWait)
    : undefined
  const throttleWait = rateLimitOption?.mode === 'throttle' ? Math.max(0, rateLimitOption.wait) : 0
  const throttleLeading = rateLimitOption?.mode === 'throttle' ? rateLimitOption.leading ?? true : true
  const throttleTrailing = rateLimitOption?.mode === 'throttle' ? rateLimitOption.trailing ?? true : true

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let debounceMaxWaitTimer: ReturnType<typeof setTimeout> | null = null
  let pendingDebounceRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>> | null = null
  let throttleTimer: ReturnType<typeof setTimeout> | null = null
  let trailingThrottleRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>> | null = null

  const clearRateLimitTimers = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    if (debounceMaxWaitTimer) {
      clearTimeout(debounceMaxWaitTimer)
    }
    if (throttleTimer) {
      clearTimeout(throttleTimer)
    }
    debounceTimer = null
    debounceMaxWaitTimer = null
    throttleTimer = null
  }

  const cancelScheduledRun = (
    scheduledRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>>,
    reason: Error,
  ) => {
    scheduledRun.reject(reason)
    base.notifyCancel(reason, scheduledRun.params)
  }

  const dropScheduledRun = (
    scheduledRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>>,
    mode: 'debounce' | 'throttle',
  ) => {
    cancelScheduledRun(scheduledRun, createRateLimitCancelError(mode))
  }

  const executeScheduledRun = (scheduledRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>>) => {
    void base.runNow(scheduledRun.params, ...scheduledRun.optimisticArgs)
      .then(scheduledRun.resolve)
      .catch(scheduledRun.reject)
  }

  const flushDebounceRun = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    if (debounceMaxWaitTimer) {
      clearTimeout(debounceMaxWaitTimer)
    }
    debounceTimer = null
    debounceMaxWaitTimer = null

    if (!pendingDebounceRun) {
      return
    }

    const scheduledRun = pendingDebounceRun
    pendingDebounceRun = null
    executeScheduledRun(scheduledRun)
  }

  const scheduleDebounceRun = (scheduledRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>>) => {
    if (pendingDebounceRun) {
      dropScheduledRun(pendingDebounceRun, 'debounce')
    }

    pendingDebounceRun = scheduledRun
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(flushDebounceRun, debounceWait)

    if (debounceMaxWait !== undefined && debounceMaxWaitTimer === null) {
      debounceMaxWaitTimer = setTimeout(flushDebounceRun, debounceMaxWait)
    }
  }

  const onThrottleWindowEnd = () => {
    throttleTimer = null

    if (!trailingThrottleRun) {
      return
    }

    const scheduledRun = trailingThrottleRun
    trailingThrottleRun = null
    executeScheduledRun(scheduledRun)
    throttleTimer = setTimeout(onThrottleWindowEnd, throttleWait)
  }

  const scheduleThrottleRun = (scheduledRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>>) => {
    if (throttleTimer === null) {
      if (throttleLeading) {
        executeScheduledRun(scheduledRun)
      }
      else {
        trailingThrottleRun = scheduledRun
      }
      throttleTimer = setTimeout(onThrottleWindowEnd, throttleWait)
      return
    }

    if (!throttleTrailing) {
      dropScheduledRun(scheduledRun, 'throttle')
      return
    }

    if (trailingThrottleRun) {
      dropScheduledRun(trailingThrottleRun, 'throttle')
    }
    trailingThrottleRun = scheduledRun
  }

  const dispatchRun = (
    params: Params | undefined,
    ...optimisticArgs: [] | [UsePromiseFnRunOptimisticValue<DataRefValue<Data, InitData>>]
  ): Promise<Data> => {
    return new Promise<Data>((resolve, reject) => {
      const scheduledRun: ScheduledRun<Params, Data, DataRefValue<Data, InitData>> = {
        optimisticArgs,
        params,
        reject,
        resolve,
      }

      switch (rateLimitOption?.mode) {
        case 'debounce':
          scheduleDebounceRun(scheduledRun)
          break
        case 'throttle':
          scheduleThrottleRun(scheduledRun)
          break
        default:
          executeScheduledRun(scheduledRun)
          break
      }
    })
  }

  const run = ((
    params: Params | undefined,
    ...optimisticArgs: [] | [UsePromiseFnRunOptimisticValue<DataRefValue<Data, InitData>>]
  ) => {
    return dispatchRun(params, ...optimisticArgs)
  }) as UsePromiseFnReturns<Params, Data, InitData>['run']

  const refresh = () => {
    const lastExecuted = base.readLastExecutedParams()
    if (lastExecuted.hasExecuted) {
      return dispatchRun(lastExecuted.params)
    }
    const initialParams = readParamsFromSource()
    return dispatchRun(initialParams)
  }

  onScopeDispose(() => {
    clearRateLimitTimers()
    const disposeReason = createScopeDisposeCancelError()
    if (pendingDebounceRun) {
      cancelScheduledRun(pendingDebounceRun, disposeReason)
      pendingDebounceRun = null
    }
    if (trailingThrottleRun) {
      cancelScheduledRun(trailingThrottleRun, disposeReason)
      trailingThrottleRun = null
    }
  })

  if (resolvedWatchOption.enabled) {
    if (resolvedWatchOption.deps !== undefined) {
      watch(resolvedWatchOption.deps, () => {
        consumeRunPromise(dispatchRun(readParamsFromSource()))
      }, {
        deep: resolvedWatchOption.deep,
      })
    }
    else if (isWatchableParamsSource(paramsSource)) {
      watch(paramsSource, (nextParams) => {
        consumeRunPromise(dispatchRun(nextParams))
      }, {
        deep: resolvedWatchOption.deep,
      })
    }
  }

  if (immediate) {
    consumeRunPromise(dispatchRun(readParamsFromSource()))
  }

  return {
    data: base.data as unknown as UsePromiseFnReturns<Params, Data, InitData>['data'],
    error: base.error as unknown as UsePromiseFnReturns<Params, Data, InitData>['error'],
    isError: base.isError as unknown as UsePromiseFnReturns<Params, Data, InitData>['isError'],
    isSuccess: base.isSuccess as unknown as UsePromiseFnReturns<Params, Data, InitData>['isSuccess'],
    loading: base.loading as unknown as UsePromiseFnReturns<Params, Data, InitData>['loading'],
    onBefore: base.onBefore as UsePromiseFnReturns<Params, Data, InitData>['onBefore'],
    onCancel: base.onCancel as UsePromiseFnReturns<Params, Data, InitData>['onCancel'],
    onError: base.onError as UsePromiseFnReturns<Params, Data, InitData>['onError'],
    onFinally: base.onFinally as UsePromiseFnReturns<Params, Data, InitData>['onFinally'],
    onSuccess: base.onSuccess as UsePromiseFnReturns<Params, Data, InitData>['onSuccess'],
    pendingCount: base.pendingCount as unknown as UsePromiseFnReturns<Params, Data, InitData>['pendingCount'],
    refresh,
    run,
    status: base.status as unknown as UsePromiseFnReturns<Params, Data, InitData>['status'],
  } satisfies UsePromiseFnReturns<Params, Data, InitData>
}
