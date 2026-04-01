# P0-TYPESCRIPT-CORE

Priority: P0
Scope: `packages/web/src/**`, `packages/web/types/**`

## Rule
- 仅使用 TypeScript，不使用 JavaScript。
- `types/env.d.ts` 与 `types/auto/*` 为类型基线，其中 `types/auto/*` 仅可读取，不可手改。
- 优先函数式风格，避免无收益的面向对象泛化。
- 禁止 `any`，允许 `unknown`。
- 不可变结构优先使用 `as const`。
- 类型收敛优先级：`satisfies SomeType` 高于 `as SomeType`。
- 可在明确安全时使用 `as SomeType`、`as unknown as SomeType`、`// @ts-expect-error <reason>`。
- 禁止使用 `enum`。
- 逻辑落点：项目相关 Vue 逻辑放 `src/features/<feature>`；跨项目复用逻辑放 `src/shared/molecule/<module>`；非 Vue 通用函数放 `src/lib`；组件私有逻辑放组件同目录模块文件。

## Non-Goals
- 不禁止在必要场景下进行显式类型断言。
- 不强制历史代码一次性完成结构迁移。

## Exceptions
- 无。

## Checks
- 检查新增代码是否出现 `any` 与 `enum`。
- 检查复杂逻辑落点是否符合目录语义。
- 检查对自动生成类型目录是否存在手动编辑。

