# P0-STYLING

Priority: P0
Scope: `src/**`

## Rule
- 样式优先使用 Tailwind CSS。
- 除非 Tailwind 无法表达，否则不要在 `.vue` 的 `<style>` 块中写样式。
- 尺寸相关样式默认优先使用 Tailwind 语义化写法（如 `p-4`、`text-sm`、`rounded-md`），避免手写固定单位值。
- 除非需求明确要求固定像素尺寸，否则禁止新增写死 `px`（含 Tailwind arbitrary value 的 `[*px]`）写法。
- 全局最低优先级样式放在 `src/assets/css/base.css`。
- 主题变量放在 `src/assets/css/theme.css`。
- 高复用样式工具类放在 `src/assets/css/utilities.css`。
- 优先复用已安装插件能力：`tw-animate-css`、`@iconify/tailwind4`。

## Non-Goals
- 不禁止必要的局部样式兜底。
- 不限制具体视觉设计风格。

## Exceptions
- 当 Tailwind 与现有组件机制无法满足需求时，可在局部样式中补充，但必须保持最小化。

## Checks
- 检查新增样式是否优先使用 Tailwind class。
- 检查新增尺寸写法是否遵循“默认语义化、仅明确需求时允许固定 `px`”。
- 检查新增全局样式是否落在正确 CSS 文件。
