# P1-WORKSPACE-MEMORY

Priority: P1
Scope: `packages/web/**` task workflows and the workspace-root `.memory/**`

## Rule
- 前端相关任务允许 AI 读写工作区根目录 `.memory/`，用于保存仅供 AI 自主管理的中间记忆。
- `.memory/` 中可保存前端任务的重要中间信息，例如页面约束、交互决策、排障结论、待办拆分与交接摘要。
- AI 必须使用当前会话唯一标识创建自己的专属记忆文件；在 Codex Desktop 中默认使用 `CODEX_THREAD_ID`，文件路径约定为 `.memory/<thread-id>.md`。
- AI 可以不经询问地创建、修改或删除自己的会话专属记忆文件，以维持任务连续性，但文件名应保持为 `.memory/<thread-id>.md`。
- `.memory/` 中其他文件可能由并行 AI 会话创建；当前会话可以读取，但不得修改、重命名或删除。
- `.memory/` 不是前端源码、设计系统或正式文档的事实来源；需要长期保留的内容应转移到受版本控制的位置。
- 具体使用约定见 `skills/workspace-memory/SKILL.md`。

## Non-Goals
- 不要求每个前端任务都必须生成 `.memory/*` 文件。
- 不允许用 `.memory/` 代替组件源码、文案资源或正式设计说明。
- 不提供跨会话共享可写记忆文件。

## Exceptions
- 若用户明确要求某类信息不要落盘，则不得写入 `.memory/`。
- 若任务指定了其他记忆载体，优先遵循用户指示。

## Checks
- 检查 `.memory/` 仅作为 AI 中间记忆使用，不承载正式交付物。
- 检查写入、删除操作是否仅作用于当前会话专属记忆文件。
- 检查当前会话专属记忆文件名是否保持为 `.memory/<thread-id>.md`。
- 检查其他 `.memory/*` 文件是否保持只读引用，不被当前会话修改。
- 检查高价值中间结论是否在需要时被整理进 `.memory/`，避免上下文压缩后丢失。
- 检查 `.memory/` 仍保持 Git 忽略状态。
