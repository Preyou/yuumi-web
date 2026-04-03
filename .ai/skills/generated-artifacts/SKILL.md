# Generated Artifacts

## Purpose
- 统一处理 `packages/web` 中“必须由脚本或工具生成”的文件，避免手改生成物。

## Use When
- 需求涉及 `src/api/auto/**`、`types/auto/**`、`src/shared/ui/**`。
- 需要新增或更新 OpenAPI 生成代码。
- 需要新增 shadcn-vue UI 基础组件。

## Workflow
1. 先判断目标是否属于生成物目录。
2. 若是 OpenAPI 生成：
   - 在仓库根执行：`bun run --filter @yuumi/web openapi-ts`
   - 或在 `packages/web` 执行：`bun run openapi-ts`
   - OpenAPI 源地址严格使用用户配置值，不做自动切换或回退。
   - 不接受会话口头临时覆盖地址；如需切换地址，先按用户要求修改配置文件。
3. 若是 `src/shared/ui/**` 缺失组件：
   - 执行：`bunx --bun shadcn-vue@latest add <component>`
4. 生成后只在业务目录做适配封装，避免直接手改生成目录。
5. 默认不提交 `src/api/auto/**` 与 `types/auto/**` 改动；确需提交先询问用户。
6. 执行：`bun run --filter @yuumi/web type-check`。
7. 交付时记录：执行命令、生成结果、验证结果。

## Network Policy
- 需要访问云端 registry 或远程 OpenAPI 源时，必须先尝试联网。
- 首次失败后重试 2 次（每次间隔 3 秒）。
- 若重试后仍网络不可用、权限不足或 MCP 不可用，立即暂停并询问用户下一步。
- 未经用户确认，不得改为手工创建等价生成物。

## Never Do
- 手改 `src/api/auto/**` 或 `types/auto/**`。
- 跳过生成命令直接复制粘贴生成代码。
- 网络失败后未经确认自行降级方案。
