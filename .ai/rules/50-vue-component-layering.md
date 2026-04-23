# P0-VUE-COMPONENT-LAYERING

Priority: P0
Scope: `src/**`

## Rule
- 必须使用 Vue 3 组合式 API。
- UI 能力复用顺序必须为：`@/shared/molecule` 与 `@/shared/atom` -> `@/shared/ui` -> `reka-ui` -> 原生标签封装。
- 新增或修改 UI 前，必须按上述顺序检索并复用现有能力。
- 进入 `@/shared/ui` 层时，必须先通过 shadcn MCP 查询云端 registry。
- 若云端存在可用组件，再检查本地 `src/shared/ui`：本地有则复用；本地无则先下载再复用。
- 若云端查询因网络不可用、MCP 不可用或权限问题失败，必须先重试 2 次（每次间隔 3 秒）。
- 重试后仍失败时，必须暂停并向用户确认下一步，不得自行降级为本地自定义实现。
- 仅当上述层级均不可用时，才允许自定义实现，并在回复中说明无法复用原因。
- 若已有同类能力，禁止以原生标签重复实现同类控件（如 `button`、`input`、`select`、`textarea`、`table`、`dialog`、`pagination`）。
- `src/shared/ui` 默认不直接手改；缺失组件通过 `bunx --bun shadcn-vue@latest add <component>` 安装。
- “阻断级 bug”判定标准为满足以下任一项：页面白屏、核心流程不可用、线上报错持续、无法发布修复。
- 仅在“阻断级 bug 修复”且用户明确确认后，才允许直接修改 `src/shared/ui`。
- 逻辑能力优先使用 `vueuse`。
- 在非 `.vue` 环境（`.ts`/`.tsx`）定义组件时，优先 TSX，不使用 `h()` 手写 VNode（第三方 API 强制要求除外）。
- `.vue` 中涉及渲染函数时，优先 `<script setup lang="tsx">` 与 TSX 表达。
- 表单校验使用 `zod v4`。
- `props`、`emits`、`slots` 必须类型化定义。
- `defineProps` 需要默认值时，必须使用解构赋默认值，禁止 `withDefaults`。
- 默认值只在 `undefined` 缺失语义下生效；`null` 视为显式值，不得被默认值覆盖。
- `defineProps` 默认采用最小解构：仅解构“需要默认值的字段”或“脚本逻辑确需使用的少量字段”。
- 仅在模板中使用且无需默认值的 props，不做解构，直接在模板中使用。
- 默认情况下，脚本中使用到的 props 必须显式解构后再使用，不写 `props.xxx`。
- 透传封装例外：允许 `const props = defineProps<...>()` 或 `const { xxx, ...props } = defineProps<...>()`，用于 `v-bind` 透传。
- 透传封装例外中，透传对象仅用于下传，不用于业务判断、派生计算或再次默认值回填。
- 路由采用文件路由，`src/views` 下文件自动生成路由。

## Non-Goals
- 不限制具体 UI 风格。
- 不禁止必要的底层能力封装。

## Exceptions
- 第三方 API 强制要求 `h()` 或非 TSX 方式时，可例外处理并注明原因。
- 仅当已确认存在编译器或三方类型限制、无法安全使用解构默认值时，才可临时使用 `withDefaults`，并在实现附近注明原因与后续回收条件。

## Checks
- 检查 UI 实现是否遵守组件复用顺序。
- 检查云端查询失败场景是否已执行“重试 2 次、间隔 3 秒”。
- 检查重试后失败场景是否已暂停并向用户确认。
- 检查“阻断级 bug”判定是否满足定义标准。
- 检查 `src/shared/ui` 直接改动是否满足“阻断级 bug + 用户确认”。
- 检查是否存在可复用组件却直接写原生控件的情况。
- 检查新增表单是否使用 `zod v4` 且具备类型化定义。
- 检查渲染函数是否优先 TSX。
- 检查 `defineProps` 默认值是否通过解构赋值实现，是否出现 `withDefaults`。
- 检查 `defineProps` 是否遵循“最小解构”或“透传例外”两类模式。
- 检查“仅模板使用且无默认值”的 props 是否被不必要解构。
- 检查脚本中是否出现不必要的 `props.xxx` 访问风格（透传例外除外）。
