# Request Hook (`$req`)

## Purpose
- 为当前仓库提供 `$req`（`useRequest`）统一手册，覆盖源码已实现的全部能力、默认值、优先级与边界行为。
- 统一“什么时候用 `$req/$api`、怎么配参数、如何处理并发/重试/取消/分页/联动刷新”。

## Source of Truth
- `$req` 入口：`src/shared/hooks/useRequest/useRequest.ts`
- `$req` 核心：`src/api/createRequest.ts`
- 调度层：`src/shared/hooks/usePromiseFn/usePromiseFn.ts`
- 状态机层：`src/shared/hooks/usePromiseFn/usePromiseBase.ts`
- 全局自动导入：`types/auto/auto-imports.d.ts`

## Use When
- 需要请求状态管理：`data/loading/error/status/pendingCount`。
- 需要执行调度：`immediate/watch/rateLimit/retry/strategy`。
- 需要传输控制：`abort/timeout/key/progress/forceRequest`。
- 需要分页增强或成功后自动刷新其他请求。
- 一次性无状态调用可优先 `$api`。

## Hard Rules
- `$req` 返回值只允许解构：
  - 正确：`const { loading, run } = $req(...)`
  - 冲突时别名：`const { loading: loginLoading } = $req(...)`
  - 禁止：`const req = $req(...)`
- 业务层禁止绕过 `$req/$api` 直接手写 `fetch/axios`，除非现有能力无法覆盖且已说明原因。

## Mental Model
- `$req` 是 `createRequest(sysApi, factoryOptions)` 产物。
- `$req(url, method, options)` 在 `usePromiseFn/usePromiseBase` 之上叠加：
  - OpenAPI 参数与响应类型推导
  - 执行调度、状态机、生命周期事件
  - 传输控制与进度
  - 分页协议
  - 基于 `name + refreshTargets` 的请求联动刷新

## API Shape
- 调用形态：
  - `const { run, refresh, loading } = $req('/users/me', 'get', options)`
- 非分页返回：
  - `run`, `refresh`, `forceRun`, `abort`
  - `data`, `error`, `status`, `isSuccess`, `isError`, `loading`, `pendingCount`
  - `key`, `downloadProgress`, `uploadProgress`, `onDownload`, `onUpload`
  - `onBefore`, `onSuccess`, `onError`, `onCancel`, `onFinally`
- 分页返回额外包含：
  - `list`, `total`, `page`, `pageSize`
  - `go`, `next`, `prev`, `search`, `setPageSize`, `clear`

## Status Model
- `status` 值域：`'idle' | 'pending' | 'success' | 'error' | 'canceled'`
- `loading = pendingCount > 0`
- `isSuccess = status === 'success'`
- `isError = status === 'error'`

## Defaults & Priority
- HTTP 方法默认：
  - `GET`: `immediate=true`, `watch=true`, `strategy='lastCall'`
  - 非 `GET`: `immediate=false`, `watch=false`, `strategy='responseOrder'`
- 其他默认：
  - `keepDataOnError=true`
  - `clearErrorOnRun=true`
  - `refresh(force=true)` 默认强制刷新
- 优先级：
  - 局部 `options`（仅已定义值）覆盖工厂默认
  - `timeout`: 局部 `timeout` > 工厂 `timeout`
  - `watch`/`strategy` 先合并再按方法归一化

## Full Option Map
- 参数源：
  - `requestSource`: 对象 / `ref` / `reactive` / `computed` / getter
- 调度与并发：
  - `immediate`, `watch`, `rateLimit`, `retry`, `strategy`
- 状态行为：
  - `clearErrorOnRun`, `initData`, `keepDataOnError`, `isCanceledError`
- 生命周期：
  - `onBefore`, `onSuccess`, `onError`, `onCancel`, `onFinally`
- 传输控制：
  - `forceRequest`, `timeout`, `key`, `onMethodCreated`, `onDownload`, `onUpload`, `notify`
- 响应处理：
  - `transform`
- 联动刷新：
  - `name`, `refreshTargets`
- 分页：
  - `pagination: false | true | Partial<RequestPaginationProtocol>`
  - `initial: { page?, pageSize? }`

## Typing Constraints
- 若最终 `immediate=true` 且参数类型存在必填字段，`requestSource` 在类型层必填。
- `$req` 会基于 `url + method + PathMap` 推导 `params/path/data/headers/response` 类型。
- `pagination=true` 使用工厂分页协议；传对象时与工厂分页协议按字段合并。
- `run/forceRun` 支持第二参数乐观更新：可传“目标值”或“更新函数”。

## Lifecycle Semantics
- `onBefore`（工厂 + 局部）并行执行（`Promise.all`）。
- `onSuccess/onError/onFinally/onCancel`（工厂 + 局部）按合并后的处理器执行。
- `onBefore` 可调用 `abort(reason)` 取消当前调用；抛错也会进入取消分支。
- 任一 documented hook 抛错只会在开发态警告，不会中断主流程。

## run / forceRun / refresh / abort
- `run(params, optimistic?)`
  - 常规执行路径，遵循当前 `rateLimit/strategy/retry/...`。
- `forceRun(params, optimistic?)`
  - 本次调用强制携带 `forceRequest=true`，优先于默认 `forceRequest`。
- `refresh(false)`
  - 走内部 `requestState.refresh()`：
  - 若存在“最近一次通过 `onBefore` 并进入执行阶段”的参数快照，优先复用该参数。
  - 否则读取当前 `requestSource`。
- `refresh(true)`（默认）
  - 强制走 `forceRun`。
  - 优先使用“最近一次触发 `onBefore` 的参数快照”（即使该次可能被 `onBefore` 取消）。
  - 若无快照，再回退到当前 `requestSource`。
- `abort(reason)`
  - 中止当前作用域内所有活跃请求（通过内部 `AbortController` 集合）。

## immediate / watch
- `$req` 内部创建 `usePromiseFn` 时固定 `immediate=false`，随后由 `$req` 自己按 `resolvedImmediate` 触发一次 `refresh(false)`。
- `watch` 归一化规则：
  - `undefined` -> `GET:true`，非 `GET:false`
  - `true/false` -> 开关监听
  - `{ deps, deep }` -> 监听 `deps`，而不是直接监听 `paramsSource`
- `watch.deep` 默认 `true`。

## rateLimit
- `debounce`
  - 新调度会取消旧调度（旧调度 Promise reject，并触发 `onCancel`）。
  - 支持 `maxWait`。
- `throttle`
  - 支持 `leading/trailing`。
  - `leading=false` 时类型上要求 `trailing=true`。
  - 窗口内若 `trailing=false`，额外调用会被取消（触发 `onCancel`）。
- 被限频取消的任务会以 `Error` 作为 reason（`Canceled by debounce` / `Canceled by throttle`）。
- 作用域销毁时，尚未执行的防抖/节流任务会被取消并触发取消事件。

## strategy
- `lastCall`
  - 新调用会取消旧调用。
  - 旧调用触发 `onCancel`，但不写回状态机（不会把状态改为 canceled/error/success）。
- `responseOrder`
  - 谁先返回谁先写回。
- `callOrder`
  - 按触发顺序写回；后返回结果会排队等待。
- 可按方法配置：
  - `strategy: { all: 'responseOrder', get: 'lastCall', post: 'callOrder' }`

## Retry / Timeout / Canceled Error
- `retry`：
  - 数字：重试次数
  - 对象：`{ count, delay, shouldRetry }`
- `timeout`：单次 attempt 超时；每次重试都会重新计时。
- 默认取消错误识别：`AbortError` / `CanceledError` / `ERR_CANCELED`。
- 可用 `isCanceledError` 覆盖默认识别逻辑。

## Data & Error Behavior
- `initData` 既是初始值，也是 `keepDataOnError=false` 的回滚基线。
- `clearErrorOnRun=true` 时每次执行先清空旧错误。
- `keepDataOnError=false` 时失败回滚到 `initData` 基线。
- 乐观更新回滚仅回滚“最新有效 token”对应的乐观值，避免旧请求误回滚新值。

## Transport & Progress
- `downloadProgress/uploadProgress` 为 `0~1`。
- 进度归一化：`total<=0` 时视为 `0`。
- `onDownload/onUpload` 同时支持事件订阅与 options 回调。
- `key` 初值来自 `options.key`，若配置 `onMethodCreated`，会同步更新为底层 method 实际 key。
- `notify` 为单请求自动提示覆盖项（由 `createApi(..., { notify })` 消费）：
  - `notify: false`：关闭该请求全部自动提示。
  - `notify: { success?: boolean, error?: boolean }`：仅关闭成功或失败一侧提示。
  - `notify: { successMessage?, errorMessage? }`：覆盖该请求提示文案。
  - 通知文案优先级：`successMessage/errorMessage` -> `response.code 对应 i18n key` -> `response.message`。
  - 按后端固定 `{ code, data, message }` 契约解析，不额外做字段猜测与兜底拼接。

## Notify Coordination (Avoid Duplicate Toast)
- 若项目已在 `createApi(..., { notify })` 配置全局自动提示，页面层又要自行提示（例如 `onSuccess` 里 `toast.success`、或状态条文案），必须在该 `$req` 上设置 `notify: false`。
- 若页面层只想接管一侧提示，使用 `notify: { success: false }` 或 `notify: { error: false }`。
- 推荐只保留一个“用户可见提示主渠道”，避免同一结果在“全局自动提示 + 页面局部提示”重复出现。
- 对表单提交场景，若错误会落到字段级校验展示，建议关闭该请求错误提示（`notify: { error: false }`），避免“表单错误 + toast”双重噪音。
- 初始化加载、后台刷新、watch 联动等自动触发请求，默认建议 `notify: false`，仅在确有全局提醒价值时再显式开启。

## Refresh Targets
- 通过 `name` 注册当前请求句柄，通过 `refreshTargets` 声明“成功后要刷新谁”。
- `refreshTargets` 支持字符串或数组，内部会去重。
- 禁止在 `refreshTargets` 中包含自身 `name`，会直接抛错。
- 自动联动刷新带深度保护（`autoRefreshDepth`），避免刷新链循环触发。
- 目标不存在时静默跳过，不抛错。

## Pagination
- 开启方式：
  - `pagination=true`（使用工厂协议）
  - `pagination={...}`（在工厂协议上局部覆盖）
- 必需项：
  - 合并后必须存在 `toParams` + `fromResponse`，否则抛错。
- 初始值：
  - `firstPage` 默认 `1`
  - `pageSize` 默认 `10`
  - `initial.page/initial.pageSize` 可覆盖初始分页状态
- 数据写回：
  - 非 infinite：`list = 当前页 list`
  - `infinite=true`：按页区间写入（不是简单 append），并将 `list.length` 拉到 `total`
- 与参数源联动：
  - 只要 `requestSource` 可 watch，参数变化会把 `page` 重置为 `firstPage`（不自动请求，且与 `watch` 开关无关）。
- 分页 API：
  - `go(page)`、`next()`、`prev()`
  - `search(params)`：重置到 `firstPage` 再请求
  - `setPageSize(pageSize, page = firstPage)`
  - `clear()`：仅清空 `list/total`，不重置 `page/pageSize`
- 分页失败回滚：
  - 默认回滚到发起前 `page/pageSize`
  - 若 `keepDataOnError=false`，失败时 `page` 回滚到 `firstPage` 且分页数据按 `initData`/空值重置

## Parameter Merge Notes
- `requestParams` 组装顺序是：
  - `apiPassThroughOptions` -> `baseParams` -> 控制字段（`forceRequest/key/onDownload/.../signal`）
- 结论：
  - `requestSource`（或分页 `toParams` 结果）会覆盖 options 中同名业务参数字段。

## Recommended Patterns
1. 登录（手动触发）
```ts
const { loading: loginLoading, run: runLogin } = $req('/auth/sign/email', 'post', {
  immediate: false,
})
await runLogin({ data: { email, password } })
```

2. GET 自动加载 + 参数监听
```ts
const detailId = computed(() => Number(route.params.id))
const { data, loading, refresh } = $req('/users/user/{id}', 'get', {
  requestSource: computed(() => ({ path: { id: detailId.value } })),
})
```

3. 写操作成功后联动刷新
```ts
const { run: runCreate } = $req('/items', 'post', {
  immediate: false,
  name: 'items.create',
  refreshTargets: ['items.list'],
})
```

4. 已有页面内自定义提示，关闭全局自动提示避免重复
```ts
const { run: runLogin } = $req('/auth/sign/email', 'post', {
  immediate: false,
  notify: false,
  onSuccess() {
    // 页面层自定义提示/状态文案
  },
})
```

5. 分页列表
```ts
const {
  list,
  total,
  page,
  pageSize,
  next,
  search,
} = $req('/items', 'get', {
  requestSource: computed(() => ({ params: { keyword: keyword.value } })),
  pagination: {
    toParams: ({ page, pageSize, params }) => ({
      ...params,
      params: { ...params.params, page, pageSize },
    }),
    fromResponse: (res) => ({ list: res.list, total: res.total }),
  },
})
```

## Anti-Patterns
- `const req = $req(...)`（违反仅解构规则）。
- `GET + 必填参数` 场景省略 `requestSource`。
- 开启分页却缺失 `toParams/fromResponse`。
- 在 `refreshTargets` 中包含当前请求自身 `name`。
- 把 `refresh(false)` 误当“强制请求”。
- 同时在 options 和 `requestSource` 写同名业务参数，却误判覆盖顺序。

## Troubleshooting
- 报错：`pagination enabled but toParams or fromResponse is missing`
  - 补齐分页协议（全局或局部）。
- 报错：`refreshTargets cannot contain current request name`
  - 去掉自引用目标。
- 请求频繁自动触发
  - 检查 `immediate/watch` 默认值与 `watch.deps`。
- 并发结果覆盖不符合预期
  - 检查 `strategy` 是否匹配业务语义。
- 失败后数据“被清空”
  - 检查 `keepDataOnError` 是否设为 `false`。

## Delivery Checklist
- 是否严格使用 `$req` 解构（冲突时用解构别名）？
- 是否按方法语义配置 `immediate/watch/strategy`？
- 是否明确了重试、超时、取消分支语义？
- 写操作是否使用 `name + refreshTargets` 进行联动？
- 分页是否提供并验证 `toParams/fromResponse`、`list/total` 与错误回滚行为？
