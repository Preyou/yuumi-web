# P0-GENERATED-ARTIFACTS

Priority: P0
Scope: `src/api/auto/**`, `types/auto/**`, `src/shared/ui/**`, `package.json`

## Rule
- 生成物目录必须通过脚本或工具生成，禁止手改：
  - `src/api/auto/**`
  - `types/auto/**`
- OpenAPI 相关生成统一使用脚本：
  - 在当前仓库执行：`bun run openapi-ts`
- OpenAPI 源地址选择遵循“用户配置优先”：用户配置什么地址就连接什么地址，不做自动切换、猜测或回退到其他地址。
- 不允许通过会话口头指令临时覆盖 OpenAPI 地址；如需变更地址，必须由用户明确要求修改配置文件后再执行。
- 当 OpenAPI 生成物或相关数据过时，允许直接使用仓库已有生成脚本进行刷新。
- `src/shared/ui/**` 缺失组件时，统一通过 shadcn 命令生成：
  - `bunx --bun shadcn-vue@latest add <component>`
- 自动导入与路由类型声明文件（`types/auto/**`）仅作为工具产物，禁止手写修复。
- 需要云端 registry 或远程 OpenAPI 源时，必须先尝试联网；失败时按 `重试 2 次、间隔 3 秒` 处理。
- 重试后仍失败（网络不可用、权限不足、MCP 不可用）时，必须暂停并询问用户，不得自行改写为手工生成。
- 默认不提交以下生成目录的改动：`src/api/auto/**`、`types/auto/**`；若确需提交，必须先获得用户确认。

## Non-Goals
- 不限制业务代码目录内的正常手写开发。
- 不限制生成后在允许目录内做适配封装。

## Exceptions
- 无。

## Checks
- 检查 `src/api/auto/**`、`types/auto/**` 是否存在手工编辑痕迹。
- 检查新增 UI 基础组件是否优先通过 shadcn 命令生成。
- 检查 OpenAPI 源地址是否严格使用用户配置值。
- 检查是否存在“未改配置文件却口头覆盖地址”的行为。
- 检查发现生成物过时时，是否优先执行已有脚本刷新，而非手工编辑。
- 检查网络失败时是否按“重试 2 次、间隔 3 秒”执行后再暂停询问。
- 检查提交内容是否包含生成目录改动；若包含则需有用户确认记录。
