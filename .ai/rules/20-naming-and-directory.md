# P0-NAMING-AND-DIRECTORY

Priority: P0
Scope: `src/**`

## Rule
- 文件夹使用小驼峰命名。
- `ts` 文件默认小驼峰；仅“默认导出 class”的文件使用大驼峰。
- Vue 组件文件使用大驼峰命名。
- 自定义指令命名必须以 `v` 开头（如 `vLoading.ts`）。
- `src/views` 文件遵循 `unplugin-vue-router` 文件路由约定。
- 目录语义：`src/features/*` 放项目强相关代码；`src/shared/atom/*` 放全局基础组件；`src/shared/molecule/<module>/*` 放跨项目复用模块；`src/shared/ui/*` 为 UI 组件库目录。
- 依赖方向只允许 `features -> shared`，禁止 `shared -> features`。

## Non-Goals
- 不限制 feature 内部的具体子目录组织方式。
- 不限制 shared 内部模块的命名风格细节。

## Exceptions
- 无。

## Checks
- 检查新增文件命名是否满足约定。
- 检查 import 依赖方向是否出现 `shared -> features` 反向依赖。
- 检查新增项目强相关逻辑是否放在 `src/features/*`。

