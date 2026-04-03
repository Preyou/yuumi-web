# P0-AI-WRITE-BOUNDARY

Priority: P0
Scope: `packages/web/**`

## Rule
- AI 改动必须遵循目录写入边界，默认仅可直接修改：
  - `src/views/**`
  - `src/features/**`
  - `src/shared/molecule/**`
  - `src/shared/atom/**`
  - `src/api/**`（不含 `src/api/auto/**`）
  - `src/lib/**`
  - `src/locales/**`
  - `src/router/**`
  - `src/assets/**`
  - `types/env.d.ts`
  - `.ai/**`
- 以下目录默认只读，禁止手改：
  - `src/api/auto/**`
  - `types/auto/**`
- `src/shared/ui/**` 默认不手改；若缺失组件，优先通过脚本安装生成后再复用。
- “阻断级 bug”判定标准为满足以下任一项：页面白屏、核心流程不可用、线上报错持续、无法发布修复。
- 仅在“阻断级 bug 修复”场景且用户明确确认后，才允许直接修改 `src/shared/ui/**`。
- 任何超出上述边界的改动，都必须先向用户说明影响并获得明确确认。

## Non-Goals
- 不限制在允许目录内的正常重构与文件移动。
- 不禁止在用户明确授权下执行边界外修改。

## Exceptions
- 紧急修复且用户已明确授权时，可临时突破边界，但必须在变更说明中记录原因。

## Checks
- 检查改动文件路径是否落在允许目录内。
- 检查是否误改 `src/api/auto/**` 与 `types/auto/**`。
- 检查“阻断级 bug”判定是否满足定义标准。
- 检查 `src/shared/ui/**` 的改动是否满足“先生成后复用”或“阻断级 bug + 用户确认”。
