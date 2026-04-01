import { delay as sleep } from 'es-toolkit/promise'
import { normalizeError } from '@/lib/helper'

/**
 * Promise 状态机的可见状态。
 */
export type PromiseStatus = 'idle' | 'pending' | 'success' | 'error' | 'canceled'

/**
 * 单次执行时传入 Promise 函数的运行上下文。
 */
export interface UsePromiseBaseRunContext {
  /**
   * 主动取消当前调用。
   *
   * @remarks
   * 调用后会触发取消流程，最终进入 `onCancel` / `onFinally` 对应的事件链路。
   */
  abort: (reason?: unknown) => void

  /**
   * 当前调用的 `AbortSignal`。
   *
   * @remarks
   * 传给底层请求库后，可与外部取消动作保持一致。
   */
  signal: AbortSignal
}

/**
 * `onBefore` 钩子的执行结果。
 */
export type OnBeforeResult
  = | {
    /** 是否取消。 */
    canceled: false
  }
  | {
    /** 是否取消。 */
    canceled: true
    /** 取消原因，会透传到取消事件和 Promise reject。 */
    reason: unknown
  }

/**
 * 单次调用最终写回状态机时的结果快照。
 */
export type Outcome<Params, Data>
  = | {
    /** 当前调用序号（自增）。 */
    callOrder: number
    /** 结果类型。 */
    type: 'success'
    /** 成功数据。 */
    data: Data
    /** 本次执行参数。 */
    params: Params | undefined
  }
  | {
    /** 当前调用序号（自增）。 */
    callOrder: number
    /** 结果类型。 */
    type: 'error'
    /** 失败错误。 */
    error: Error
    /** 本次执行参数。 */
    params: Params | undefined
  }
  | {
    /** 当前调用序号（自增）。 */
    callOrder: number
    /** 结果类型。 */
    type: 'canceled'
    /** 取消原因。 */
    reason: unknown
    /** 本次执行参数。 */
    params: Params | undefined
  }

/**
 * 尚未结算调用的内部管理结构。
 */
export interface PendingCall<Params, Data, DataValue> {
  /** 当前调用独立的中止控制器。 */
  abortController: AbortController
  /** 调用序号。 */
  callOrder: number
  /**
   * 乐观更新上下文。
   *
   * @remarks
   * 仅在传入 `optimisticUpdater` 时存在，用于失败/取消时回滚。
   */
  optimisticContext?: {
    /** 乐观更新前的旧值。 */
    previousData: DataValue
    /** 乐观更新令牌，用于只回滚最新一次有效乐观更新。 */
    token: number
  }
  /** 本次执行参数。 */
  params: Params | undefined
  /** 失败或取消时拒绝 Promise。 */
  reject: (reason?: unknown) => void
  /** 成功时完成 Promise。 */
  resolve: (value: Data | PromiseLike<Data>) => void
  /** 是否已结算。 */
  settled: boolean
}

/**
 * 乐观更新函数签名。
 */
export type UsePromiseBaseRunOptimisticUpdater<DataValue> = (data: DataValue) => DataValue

/**
 * 乐观更新入参：可传“更新函数”或“目标值”。
 */
export type UsePromiseBaseRunOptimisticValue<DataValue>
  = UsePromiseBaseRunOptimisticUpdater<DataValue> | DataValue

/**
 * 重试策略：可直接传重试次数，或传包含次数、延迟和判定函数的对象。
 */
export type UsePromiseBaseRetryOption<Params>
  = | number
    | {
      /**
       * 最大重试次数（不包含首次请求）。
       *
       * @defaultValue `0`
       */
      count?: number
      /**
       * 每次重试前等待时间（毫秒）。
       *
       * @remarks
       * 可传固定值，或按 `(attempt, error, params)` 动态计算。
       */
      delay?: number | ((attempt: number, error: Error, params: Params) => number)
      /**
       * 是否应继续重试。
       *
       * @defaultValue 总是重试直到达到 `count`
       */
      shouldRetry?: (error: Error, attempt: number, params: Params) => boolean
    }

/**
 * `usePromiseBase` 的配置项。
 */
export interface UsePromiseBaseOptions<Params, Data, DataValue> {
  /**
   * 每次开始执行前是否清空上一次错误。
   *
   * @defaultValue `true`
   */
  clearErrorOnRun?: boolean

  /** 初始数据，同时作为 `keepDataOnError=false` 时的回滚基线。 */
  initData?: DataValue

  /**
   * 失败时是否保留当前 `data`。
   *
   * @defaultValue `true`
   */
  keepDataOnError?: boolean

  /**
   * 执行前钩子，可异步。
   *
   * @remarks
   * 可通过第二个参数 `abort` 取消本次执行；抛错也会按取消处理。
   */
  onBefore?: (
    params: Params | undefined,
    abort: (reason?: unknown) => void,
  ) => VueUse.Awaitable<void>

  /** 取消时回调。 */
  onCancel?: (reason: unknown, params: Params | undefined) => void
  /** 失败时回调。 */
  onError?: (error: Error, params: Params | undefined) => void
  /** 调用结算后回调（成功/失败）。 */
  onFinally?: (params: Params | undefined) => void
  /** 成功时回调。 */
  onSuccess?: (data: Data, params: Params) => void

  /**
   * 自定义“取消错误”判定。
   *
   * @remarks
   * 返回 `true` 时会走取消分支而不是错误分支。
   */
  isCanceledError?: (error: Error, params: Params | undefined) => boolean

  /**
   * 重试策略。
   *
   * @example
   * retry: { count: 2, delay: (attempt) => attempt * 300 }
   */
  retry?: UsePromiseBaseRetryOption<Params>

  /**
   * 多次并发调用时的写回策略。
   *
   * @remarks
   * - `lastCall`: 新调用会取消旧调用（默认）。
   * - `responseOrder`: 按响应先后直接写回。
   * - `callOrder`: 按触发顺序串行写回。
   */
  strategy?: 'callOrder' | 'responseOrder' | 'lastCall'

  /**
   * 单次请求超时时间（毫秒）。
   *
   * @remarks
   * 每次重试都会重新计算该超时。
   */
  timeout?: number
}

/**
 * `usePromiseBase` 返回的状态与控制能力。
 */
export interface UsePromiseBaseReturns<Params, Data, DataValue> {
  /** 当前数据。 */
  data: Readonly<Vue.Ref<DataValue>>
  /** 最近一次错误。 */
  error: Readonly<Vue.Ref<Error | null>>
  /** 是否处于错误状态。 */
  isError: Readonly<Vue.Ref<boolean>>
  /** 是否处于成功状态。 */
  isSuccess: Readonly<Vue.Ref<boolean>>
  /** 是否有执行中的调用。 */
  loading: Readonly<Vue.Ref<boolean>>

  /**
   * 仅触发取消事件，不改变状态机。
   *
   * @remarks
   * 供上层限频调度取消“尚未真正执行”的任务时使用。
   */
  notifyCancel: (reason: unknown, params: Params | undefined) => void

  /** 订阅执行前事件。 */
  onBefore: VueUse.EventHookOn<[
    params: Params | undefined,
    abort: (reason?: unknown) => void,
  ]>
  /** 订阅取消事件。 */
  onCancel: VueUse.EventHookOn<[reason: unknown, params: Params | undefined]>
  /** 订阅错误事件。 */
  onError: VueUse.EventHookOn<[error: Error, params: Params | undefined]>
  /** 订阅完成事件。 */
  onFinally: VueUse.EventHookOn<[params: Params | undefined]>
  /** 订阅成功事件。 */
  onSuccess: VueUse.EventHookOn<[data: Data, params: Params]>

  /** 当前并发中的调用数量。 */
  pendingCount: Readonly<Vue.Ref<number>>

  /**
   * 读取最近一次“真正执行”的参数快照。
   *
   * @remarks
   * 被 `onBefore` 取消的调用不会更新该快照。
   */
  readLastExecutedParams: () => {
    /** 是否存在有效执行记录。 */
    hasExecuted: boolean
    /** 最近一次执行参数。 */
    params: Params | undefined
  }

  /**
   * 立即执行一次调用。
   *
   * @remarks
   * 通过剩余参数传入乐观更新值；支持传函数或直接传目标值。
   */
  runNow: (
    params: Params | undefined,
    ...optimisticArgs: [] | [UsePromiseBaseRunOptimisticValue<DataValue>]
  ) => Promise<Data>

  /** 当前状态。 */
  status: Readonly<Vue.Ref<PromiseStatus>>
}

const LAST_CALL_CANCEL_MESSAGE = 'Canceled by lastCall'
const REQUEST_ABORTED_MESSAGE = 'Aborted by controller'

function getRetryCount<Params>(retryOption: UsePromiseBaseRetryOption<Params> | undefined): number {
  if (typeof retryOption === 'number') {
    return retryOption
  }
  return retryOption?.count ?? 0
}

function getRetryDelay<Params>(retryOption: UsePromiseBaseRetryOption<Params> | undefined) {
  if (typeof retryOption === 'number') {
    return (_attempt: number, _error: Error, _params: Params) => 0
  }

  return (attempt: number, error: Error, params: Params) => {
    const delayOption = retryOption?.delay
    if (typeof delayOption === 'function') {
      return delayOption(attempt, error, params)
    }
    return delayOption ?? 0
  }
}

function getShouldRetry<Params>(retryOption: UsePromiseBaseRetryOption<Params> | undefined) {
  if (typeof retryOption === 'number') {
    return (_error: Error, _attempt: number, _params: Params) => true
  }

  return (error: Error, attempt: number, params: Params) => retryOption?.shouldRetry?.(error, attempt, params) ?? true
}

function warnHookError(hookName: string, hookError: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[usePromiseBase] ${hookName} hook error:`, hookError)
  }
}

function triggerEventWithWarning<Args extends readonly unknown[]>(
  trigger: (...args: Args) => Promise<unknown[]>,
  hookName: string,
  ...args: Args
): void {
  void trigger(...args).catch(hookError => warnHookError(hookName, hookError))
}

function createAbortError(reason?: unknown): Error {
  if (reason instanceof Error) {
    return reason
  }

  if (typeof reason === 'string') {
    const error = new Error(reason)
    error.name = 'AbortError'
    return error
  }

  const error = new Error(REQUEST_ABORTED_MESSAGE)
  error.name = 'AbortError'
  return error
}

function isAbortLikeError(error: Error): boolean {
  const errorLike = error as Error & {
    code?: unknown
    name?: unknown
  }
  return errorLike.name === 'AbortError'
    || errorLike.name === 'CanceledError'
    || errorLike.code === 'ERR_CANCELED'
}

function runPromiseWithTimeout<Params, Data>(
  promiseFn: (params: Params, ctx: UsePromiseBaseRunContext) => Promise<Data>,
  params: Params | undefined,
  timeout: number | undefined,
  ctx: UsePromiseBaseRunContext,
): Promise<Data> {
  const requestPromise = promiseFn(params as Params, ctx)
  if (!timeout || timeout <= 0) {
    return requestPromise
  }

  return new Promise<Data>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`))
    }, timeout)

    requestPromise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((requestError) => {
        clearTimeout(timer)
        reject(requestError)
      })
  })
}

async function runAttemptWithNormalize<Params, Data>(
  promiseFn: (params: Params, ctx: UsePromiseBaseRunContext) => Promise<Data>,
  params: Params | undefined,
  timeout: number | undefined,
  ctx: UsePromiseBaseRunContext,
): Promise<{ data: Data, ok: true } | { error: Error, ok: false }> {
  try {
    const attemptData = await runPromiseWithTimeout(promiseFn, params, timeout, ctx)
    return { data: attemptData, ok: true as const }
  }
  catch (attemptError) {
    return { error: normalizeError(attemptError), ok: false as const }
  }
}

/**
 * Promise 状态机基础实现，不处理参数监听和限频调度。
 *
 * @param promiseFn 核心 Promise 函数，签名为 `(params, ctx) => Promise<Data>`。
 * @param options 状态机与生命周期配置。
 * @returns 包含状态、事件注册器、`runNow` 执行函数的控制对象。
 *
 * @example
 * const base = usePromiseBase(fetchUser, {
 *   strategy: 'lastCall',
 *   retry: { count: 2, delay: 300 },
 * })
 * await base.runNow({ id: 1 })
 */
export function usePromiseBase<
  Params,
  Data,
  DataValue,
>(
  promiseFn: (params: Params, ctx: UsePromiseBaseRunContext) => Promise<Data>,
  options: UsePromiseBaseOptions<Params, Data, DataValue>,
): UsePromiseBaseReturns<Params, Data, DataValue> {
  const {
    clearErrorOnRun = true,
    initData,
    isCanceledError: customIsCanceledError,
    keepDataOnError = true,
    onBefore,
    onCancel,
    onError,
    onFinally,
    onSuccess,
    retry,
    strategy = 'lastCall',
    timeout,
  } = options
  const retryCount = getRetryCount(retry)
  const retryDelay = getRetryDelay(retry)
  const shouldRetry = getShouldRetry(retry)
  const isCanceledError = customIsCanceledError ?? ((error: Error) => isAbortLikeError(error))

  const initialData = initData as DataValue
  const data = ref(initialData)
  const error = ref<Error | null>(null)
  const pendingCount = ref(0)
  const status = ref<PromiseStatus>('idle')
  const loading = computed(() => pendingCount.value > 0)
  const isSuccess = computed(() => status.value === 'success')
  const isError = computed(() => status.value === 'error')

  const successEvent = createEventHook<[data: Data, params: Params]>()
  const errorEvent = createEventHook<[error: Error, params: Params | undefined]>()
  const finallyEvent = createEventHook<[params: Params | undefined]>()
  const cancelEvent = createEventHook<[reason: unknown, params: Params | undefined]>()
  const beforeEvent = createEventHook<[
    params: Params | undefined,
    abort: (reason?: unknown) => void,
  ]>()

  onBefore && beforeEvent.on(onBefore)
  onSuccess && successEvent.on(onSuccess)
  onError && errorEvent.on(onError)
  onFinally && finallyEvent.on(onFinally)
  onCancel && cancelEvent.on(onCancel)

  let lastSettledStatus: PromiseStatus = 'idle'
  let callOrderSeed = 0
  let nextCallOrderToWrite = 1
  let hasExecutedParams = false
  let lastExecutedParams: Params | undefined
  let optimisticTokenSeed = 0
  let latestOptimisticToken: number | null = null
  const pendingCalls = new Map<number, PendingCall<Params, Data, DataValue>>()
  const callOrderQueue = new Map<number, Outcome<Params, Data>>()

  const setStatusByPending = () => {
    status.value = pendingCount.value > 0 ? 'pending' : lastSettledStatus
  }

  const emitSuccess = (resultData: Data, params: Params | undefined) => {
    triggerEventWithWarning(successEvent.trigger, 'onSuccess', resultData, params as Params)
  }

  const emitError = (resultError: Error, params: Params | undefined) => {
    triggerEventWithWarning(errorEvent.trigger, 'onError', resultError, params)
  }

  const emitFinally = (params: Params | undefined) => {
    triggerEventWithWarning(finallyEvent.trigger, 'onFinally', params)
  }

  const emitCancel = (reason: unknown, params: Params | undefined) => {
    triggerEventWithWarning(cancelEvent.trigger, 'onCancel', reason, params)
  }

  const applyOutcome = (outcome: Outcome<Params, Data>) => {
    switch (outcome.type) {
      case 'success':
        latestOptimisticToken = null
        data.value = outcome.data as unknown as DataValue
        error.value = null
        lastSettledStatus = 'success'
        emitSuccess(outcome.data, outcome.params)
        emitFinally(outcome.params)
        break
      case 'error':
        if (!keepDataOnError) {
          data.value = initialData
        }
        error.value = outcome.error
        lastSettledStatus = 'error'
        emitError(outcome.error, outcome.params)
        emitFinally(outcome.params)
        break
      default:
        lastSettledStatus = 'canceled'
        emitCancel(outcome.reason, outcome.params)
        break
    }

    setStatusByPending()
  }

  const rollbackOptimisticData = (call: PendingCall<Params, Data, DataValue>) => {
    const optimisticContext = call.optimisticContext
    if (!optimisticContext || latestOptimisticToken !== optimisticContext.token) {
      return
    }
    data.value = optimisticContext.previousData
    latestOptimisticToken = null
  }

  const flushCallOrderQueue = () => {
    while (callOrderQueue.has(nextCallOrderToWrite)) {
      const outcome = callOrderQueue.get(nextCallOrderToWrite)
      callOrderQueue.delete(nextCallOrderToWrite)
      nextCallOrderToWrite += 1
      if (outcome) {
        applyOutcome(outcome)
      }
    }
  }

  const registerOutcome = (outcome: Outcome<Params, Data>) => {
    if (strategy === 'callOrder') {
      callOrderQueue.set(outcome.callOrder, outcome)
      flushCallOrderQueue()
      return
    }
    applyOutcome(outcome)
  }

  const settleCall = (
    call: PendingCall<Params, Data, DataValue>,
    outcome: Outcome<Params, Data>,
    config: {
      affectState: boolean
      triggerCancelOnly?: boolean
    },
  ) => {
    if (call.settled) {
      return
    }

    call.settled = true
    pendingCalls.delete(call.callOrder)
    pendingCount.value = Math.max(0, pendingCount.value - 1)

    switch (outcome.type) {
      case 'success':
        call.resolve(outcome.data)
        break
      case 'error':
        call.reject(outcome.error)
        break
      default:
        call.reject(outcome.reason)
        break
    }

    outcome.type !== 'success' && rollbackOptimisticData(call)

    if (config.affectState) {
      registerOutcome(outcome)
    }
    else if (config.triggerCancelOnly && outcome.type === 'canceled') {
      emitCancel(outcome.reason, outcome.params)
    }

    setStatusByPending()
  }

  const cancelCall = (
    call: PendingCall<Params, Data, DataValue>,
    reason: unknown,
    config: {
      affectState: boolean
      triggerCancelOnly?: boolean
    },
  ) => {
    if (!call.abortController.signal.aborted) {
      call.abortController.abort(reason)
    }

    settleCall(call, {
      callOrder: call.callOrder,
      params: call.params,
      reason,
      type: 'canceled',
    }, config)
  }

  const cancelPreviousCallsByLastCall = (currentCallOrder: number) => {
    for (const pendingCall of Array.from(pendingCalls.values())) {
      if (pendingCall.callOrder === currentCallOrder) {
        continue
      }

      cancelCall(pendingCall, new Error(LAST_CALL_CANCEL_MESSAGE), {
        affectState: false,
        triggerCancelOnly: true,
      })
    }
  }

  const runBeforeHandlers = async (
    params: Params | undefined,
    abortController: AbortController,
  ): Promise<OnBeforeResult> => {
    let settled = false
    let firstReason: unknown

    const resolveCanceled = (reason: unknown, source: 'abort' | 'reject'): OnBeforeResult => {
      if (settled) {
        return { canceled: true, reason: firstReason }
      }

      settled = true
      firstReason = reason

      if (source === 'reject' && import.meta.env.DEV) {
        console.warn('[usePromiseBase] onBefore rejected:', reason)
      }

      return { canceled: true, reason }
    }

    let cancelByAbort: (result: OnBeforeResult) => void = () => {}
    const abortPromise = new Promise<OnBeforeResult>((resolve) => {
      cancelByAbort = resolve
    })

    const abort = (reason?: unknown) => {
      if (!abortController.signal.aborted) {
        abortController.abort(reason)
      }
      cancelByAbort(resolveCanceled(reason, 'abort'))
    }

    const triggerPromise = beforeEvent
      .trigger(params, abort)
      .then<OnBeforeResult>(() => ({ canceled: false }))
      .catch(hookError => resolveCanceled(hookError, 'reject'))

    return Promise.race([triggerPromise, abortPromise])
  }

  const executeCall = async (call: PendingCall<Params, Data, DataValue>) => {
    const resolveCanceledReason = (fallback: unknown): unknown => {
      return (call.abortController.signal as AbortSignal & {
        reason?: unknown
      }).reason ?? fallback ?? createAbortError()
    }

    const runContext: UsePromiseBaseRunContext = {
      abort: (reason?: unknown) => {
        cancelCall(call, resolveCanceledReason(reason), {
          affectState: true,
        })
      },
      signal: call.abortController.signal,
    }

    const beforeResult = await runBeforeHandlers(call.params, call.abortController)
    if (call.settled) {
      return
    }

    if (beforeResult.canceled) {
      cancelCall(call, resolveCanceledReason(beforeResult.reason), {
        affectState: true,
      })
      return
    }

    hasExecutedParams = true
    lastExecutedParams = call.params

    const firstAttempt = await runAttemptWithNormalize(promiseFn, call.params, timeout, runContext)
    if (call.settled) {
      return
    }

    if (firstAttempt.ok) {
      settleCall(call, {
        callOrder: call.callOrder,
        data: firstAttempt.data,
        params: call.params,
        type: 'success',
      }, {
        affectState: true,
      })
      return
    }

    let finalError = firstAttempt.error
    if (call.abortController.signal.aborted || isCanceledError(finalError, call.params)) {
      cancelCall(call, resolveCanceledReason(finalError), {
        affectState: true,
      })
      return
    }

    const retryParams = call.params as Params

    for (let retryAttempt = 1; retryAttempt <= retryCount; retryAttempt += 1) {
      if (call.settled) {
        return
      }

      if (!shouldRetry(finalError, retryAttempt, retryParams)) {
        break
      }

      const waitMs = retryDelay(retryAttempt, finalError, retryParams)
      await sleep(Math.max(0, waitMs))

      if (call.settled) {
        return
      }

      const retryResult = await runAttemptWithNormalize(promiseFn, retryParams, timeout, runContext)
      if (call.settled) {
        return
      }

      if (retryResult.ok) {
        settleCall(call, {
          callOrder: call.callOrder,
          data: retryResult.data,
          params: call.params,
          type: 'success',
        }, {
          affectState: true,
        })
        return
      }

      finalError = retryResult.error
      if (call.abortController.signal.aborted || isCanceledError(finalError, call.params)) {
        cancelCall(call, resolveCanceledReason(finalError), {
          affectState: true,
        })
        return
      }
    }

    settleCall(call, {
      callOrder: call.callOrder,
      error: finalError,
      params: call.params,
      type: 'error',
    }, {
      affectState: true,
    })
  }

  const runNow = (
    params: Params | undefined,
    ...optimisticArgs: [] | [UsePromiseBaseRunOptimisticValue<DataValue>]
  ): Promise<Data> => {
    const callOrder = ++callOrderSeed
    let resolve!: (value: Data | PromiseLike<Data>) => void
    let reject!: (reason?: unknown) => void

    const task = new Promise<Data>((innerResolve, innerReject) => {
      resolve = innerResolve
      reject = innerReject
    })

    const currentCall: PendingCall<Params, Data, DataValue> = {
      abortController: new AbortController(),
      callOrder,
      params,
      reject,
      resolve,
      settled: false,
    }

    if (optimisticArgs.length === 1) {
      const optimisticUpdater = optimisticArgs[0]
      const previousData = data.value
      const optimisticData = typeof optimisticUpdater === 'function'
        ? (optimisticUpdater as UsePromiseBaseRunOptimisticUpdater<DataValue>)(previousData)
        : optimisticUpdater
      const optimisticToken = ++optimisticTokenSeed
      latestOptimisticToken = optimisticToken
      data.value = optimisticData
      currentCall.optimisticContext = {
        previousData,
        token: optimisticToken,
      }
    }

    pendingCalls.set(callOrder, currentCall)
    pendingCount.value += 1

    strategy === 'lastCall' && cancelPreviousCallsByLastCall(callOrder)

    clearErrorOnRun && (error.value = null)

    setStatusByPending()
    void executeCall(currentCall)

    return task
  }

  return {
    data: data as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['data'],
    error: error as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['error'],
    isError: isError as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['isError'],
    isSuccess: isSuccess as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['isSuccess'],
    loading: loading as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['loading'],
    notifyCancel: emitCancel,
    onBefore: beforeEvent.on,
    onCancel: cancelEvent.on,
    onError: errorEvent.on,
    onFinally: finallyEvent.on,
    onSuccess: successEvent.on,
    pendingCount: pendingCount as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['pendingCount'],
    readLastExecutedParams: () => ({
      hasExecuted: hasExecutedParams,
      params: lastExecutedParams,
    }),
    runNow,
    status: status as unknown as UsePromiseBaseReturns<Params, Data, DataValue>['status'],
  } satisfies UsePromiseBaseReturns<Params, Data, DataValue>
}
