# P1-VUEUSE-FIRST

Priority: P1
Scope: `src/**`, `types/auto/**`, `vite.config.ts`

## Rule
- 在“可用 VueUse 能力”与“新增自实现”之间，必须优先 VueUse（`@vueuse/core`、`@vueuse/math`、`@vueuse/head`、`@vueuse/components`）。
- 若项目中已有可复用封装（`shared/molecule`、`shared/atom`、`shared/ui`）能满足需求，优先复用已有封装；若无现成封装，再优先选择 VueUse。
- 禁止为 VueUse 已覆盖的通用能力新增等价自实现（例如：防抖节流、事件监听、存储同步、窗口/元素状态监听、媒体查询、异步状态包装）。
- 使用 VueUse 时，优先采用项目已启用的自动导入能力，避免重复手动导入同名函数或组件。
- 涉及后端请求时仍遵循 API 规则：优先 `$req`/`$api`，不因存在 `useFetch` 等能力而绕过既有请求体系。
- 若 VueUse 方案在当前项目中与文档不一致或不可用，必须立即暂停并询问用户是否转为排查根因，确认前不得直接改为手写替代。

## Non-Goals
- 不强制将所有既有自实现立即重构为 VueUse。
- 不限制业务领域特有逻辑的必要封装。

## Exceptions
- 当 VueUse 明确无法满足需求（能力缺失、行为不匹配、兼容性或性能风险）时，允许自实现，但必须在交付说明中写明原因与取舍。

## Checks
- 检查实现前是否完成“已有封装 / VueUse 能力”检索。
- 检查新增代码是否出现与 VueUse 等价的重复实现。
- 检查 VueUse 能力是否优先通过自动导入使用。
- 检查未采用 VueUse 的场景是否附带明确原因说明。
