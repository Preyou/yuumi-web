# P0-AUTO-IMPORT-AND-API

Priority: P0
Scope: `packages/web/src/**`, `packages/web/types/auto/**`, `packages/web/vite.config.ts`

## Rule
- 本项目启用 `unplugin-auto-import`，以 `types/auto/auto-imports.d.ts` 为自动导入事实来源。
- 必须优先使用已自动导入的全局函数，避免重复手动 `import` 同名能力（存在冲突或用户明确要求除外）。
- 请求后端接口时，默认优先使用 `$req`、`$api`。
- 禁止在业务代码中重复封装 `fetch/axios` 直连请求，除非现有能力无法满足且已说明原因。
- 选择顺序：
  - 需要 `loading/error/retry/watch/pagination` 等状态管理时优先 `$req`。
  - 一次性无状态调用时优先 `$api`。
- 组件导入约束：
  - 自动注册目录：`src/shared/atom`、`src/shared/molecule`。
  - `src/shared/ui` 组件必须手动 `import`。

## Non-Goals
- 不限制底层 HTTP 实现细节。
- 不禁止基础设施层的网络能力封装。

## Exceptions
- 当 `$req`、`$api` 无法覆盖特殊协议或 SDK 约束时，可采用替代实现，但需要说明原因。

## Checks
- 检查业务代码是否优先使用 `$req` 或 `$api`。
- 检查是否出现重复手动导入已自动导入能力。
- 检查 `src/shared/ui` 组件是否按规则手动导入。

