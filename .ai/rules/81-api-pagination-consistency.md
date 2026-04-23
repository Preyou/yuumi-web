# P1-API-PAGINATION-CONSISTENCY

Priority: P1
Scope: `src/api/**`, 依赖分页能力的页面与组件

## Rule
- 前端请求分页参数统一为 `page`、`pageSize`，并与后端分页协议保持一致。
- 分页解析统一映射为 `list` 与 `total`，并保留 `page/pageSize` 状态同步。
- 禁止在业务代码中引入额外分页参数别名（如 `page_size`、`size`、`limit/offset`）作为主路径。
- 使用 `$req` 分页能力时，`toParams` 必须输出 `page/pageSize`，`fromResponse` 必须解析统一分页结构。

## Non-Goals
- 不限制 UI 组件的分页展示样式。
- 不限制分页组件内部状态实现方式。

## Exceptions
- 对接第三方接口且无法改造后端时，可在边界层做一次适配转换，但业务层仍使用统一协议字段。

## Checks
- 分页请求若未传 `page/pageSize`，要求修正。
- `fromResponse` 若未映射 `list/total`，要求修正。
- 业务代码出现混用多种分页参数命名时，要求统一。

