# P0-API-TYPE-INFERENCE

Priority: P0
Scope: `packages/web/src/api/**`, `packages/web/src/**`

## Rule
- 接口参数与返回类型必须优先使用 `src/api/auto` 与 `@/api/createApi` 导出的工具类型推导。
- 避免手写接口结构类型，必要时配合 `NonNullable`、`satisfies` 收敛类型。
- `src/api/auto/*` 为 OpenAPI 自动生成目录，禁止手改。
- 推荐工具类型包括：`Urls`、`PathMethods<Url>`、`PathParams<Url, Method>`、`PathResponse<Url, Method>`、`ApiUrls`、`ApiMethods<Url>`、`ApiOptions<Url, Method>`、`ApiResponse<Url, Method>`。

## Non-Goals
- 不禁止在自动推导无法覆盖时编写少量补充类型。
- 不限制 API 分层组织方式。

## Exceptions
- 自动推导暂时无法表达的边界场景，可添加局部补充类型并标注原因。

## Checks
- 检查新增接口代码是否优先引用自动生成类型与工具类型。
- 检查 `src/api/auto/*` 是否存在手动改动。

