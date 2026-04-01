# P1-VUE-IGNORE

Priority: P1
Scope: `packages/web/src/**/*.vue`

## Rule
- 仅当 Vue SFC 在 `defineProps` 阶段无法解析复杂类型时，才使用 `/* @vue-ignore */`。
- `/* @vue-ignore */` 只用于绕过编译器推导限制，不代表该字段已成为运行时 props。
- 使用 `/* @vue-ignore */` 后，必须明确运行时处理路径：
  - 依赖根节点透传时，确认 attribute 透传语义成立。
  - 需要子组件显式接收时，通过 `v-bind="$attrs"`、`useForwardProps*` 或等效方式转发。
  - 需要默认值、布尔语义、运行时校验或稳定 API 时，改为显式 props 声明。
- 优先方案始终是可解析的显式类型声明，`/* @vue-ignore */` 仅作兜底。

## Non-Goals
- 不禁止在编译器确实无法推导时使用该能力。
- 不限制具体转发实现手段。

## Exceptions
- 无。

## Checks
- 检查每处 `/* @vue-ignore */` 是否附带必要的运行时处理方案。
- 检查是否存在可用显式类型却仍滥用 `/* @vue-ignore */` 的情况。

