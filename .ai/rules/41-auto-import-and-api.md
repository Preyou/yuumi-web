# P0-AUTO-IMPORT-AND-API

Priority: P0
Scope: `src/**`, `types/auto/**`, `vite.config.ts`

## Rule
- 本项目启用 `unplugin-auto-import`，以 `types/auto/auto-imports.d.ts` 为自动导入事实来源。
- 必须优先使用已自动导入的全局函数，避免重复手动 `import` 同名能力（存在冲突或用户明确要求除外）。
- 请求后端接口时，默认优先使用 `$req`、`$api`。
- `$req` 的完整能力说明、参数矩阵与边界行为，统一以 `.ai/skills/request-hook/SKILL.md` 为准。
- 前后端接口响应契约统一按固定 `{ code, data, message }` 处理；前端实现禁止通过“猜测字段/过多兜底”掩盖协议问题。
- 禁止在业务代码中重复封装 `fetch/axios` 直连请求，除非现有能力无法满足且已说明原因。
- i18n 使用约束：
  - 模板中统一使用 `$t(...)`。
  - 非模板位置（`<script setup>`、ts/tsx）统一使用 `$i18n.t(...)`。
  - 避免在同一文件中混用 `t(...)` 与 `$t(...)` / `$i18n.t(...)`。
- 选择顺序：
  - 需要 `loading/error/retry/watch/pagination` 等状态管理时优先 `$req`。
  - 一次性无状态调用时优先 `$api`。
- 自动提示约束（`createApi`/`$api` + `$req`）：
  - 当请求结果已由 `createApi(..., { notify })` 触发全局提示时，页面层若再做自定义成功/失败提示，必须显式设置 `notify: false`，避免重复提示。
  - 若仅需关闭一侧提示，使用局部覆盖（示例：`notify: { success: false }` 或 `notify: { error: false }`）。
  - 通知文案优先级固定为：`手动指定(successMessage/errorMessage)` -> `response.code 作为 i18n key` -> `response.message`。
  - 需要自定义单请求文案时，优先使用 `notify.successMessage` / `notify.errorMessage`，避免在多个层级重复拼文案。
  - `$toast` 的触发边界与“是否应该提示”判定，统一遵循 `46-toast-usage-boundary.md`，避免过度通知。
- `$req` 返回值使用约束：
  - 仅允许解构用法，不允许整体对象赋值（示例：`const { loading, run } = $req(...)`）。
  - 当与已有变量冲突时，必须通过解构别名消歧（示例：`const { loading: loginLoading } = $req(...)`）。
- 组件导入约束：
  - 自动注册目录：`src/shared/atom`、`src/shared/molecule`。
  - 组件使用顺序：优先使用自动注册（先查 `types/auto/components.d.ts` 的 `GlobalComponents` 声明），避免先入为主手动 `import`。
  - 组件名生成规则：
    - 默认由 `.vue` 文件名生成 PascalCase 组件名（示例：`Button.vue` -> `Button`）。
    - 对于部分目录结构，工具可能生成带目录前缀的附加名称（示例：`TaijiCircle`）；最终以 `types/auto/components.d.ts` 的声明结果为准，不做主观猜测。
  - 当自动注册存在歧义时（如同名冲突、同文件存在多个可用自动名影响可读性、需要在同一文件区分不同语义），允许手动 `import` 并使用别名。
  - `src/shared/ui` 组件必须手动 `import`。

## Non-Goals
- 不限制底层 HTTP 实现细节。
- 不禁止基础设施层的网络能力封装。

## Exceptions
- 当 `$req`、`$api` 无法覆盖特殊协议或 SDK 约束时，可采用替代实现，但需要说明原因。

## Checks
- 检查业务代码是否优先使用 `$req` 或 `$api`。
- 检查是否出现重复手动导入已自动导入能力。
- 检查是否存在对 `{ code, data, message }` 的过度兜底处理（猜测字段、静默吞错、默认文案掩盖协议异常）。
- 检查 `$req` 是否按“仅解构”方式使用；冲突场景是否使用了解构别名。
- 检查 i18n 是否遵循“模板 `$t`、脚本 `$i18n.t`”约束。
- 检查开启全局 `notify` 的请求是否出现页面层重复提示；如有重复，检查是否正确设置 `notify: false` 或局部覆盖。
- 检查组件是否优先按自动注册名称使用。
- 对手动导入并别名的自动注册组件，检查是否存在“自动注册歧义”这一正当原因。
- 检查 `src/shared/ui` 组件是否按规则手动导入。
