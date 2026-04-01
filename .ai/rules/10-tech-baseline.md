# P0-TECH-BASELINE

Priority: P0
Scope: `packages/web/**`

## Rule
- 技术基线为 TypeScript、Bun、Vue 3、Vite、shadcn-vue、reka-ui、VueUse、Tailwind CSS。
- `packages/web` 的包管理与运行时统一使用 `bun`。
- 默认保持模板工程定位，优先保证结构清晰与可复用性。

## Non-Goals
- 不禁止使用与上述栈兼容的生态依赖。
- 不限定具体业务实现方案。

## Exceptions
- 无。

## Checks
- 检查新增脚本是否使用 `bun` 执行路径。
- 检查新增实现是否破坏既有技术栈一致性。

