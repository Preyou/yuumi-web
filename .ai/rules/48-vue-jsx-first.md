# P0-VUE-JSX-FIRST

Priority: P0
Scope: `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.vue`

## Rule
- 在 Vue 代码中，只要出现脚本内渲染组件（如 `defineComponent`、函数式组件、`render` 回调），默认优先使用 JSX/TSX。
- 默认禁止使用 `h()` 作为渲染写法；新增与改动代码应直接采用 JSX/TSX。
- 不通过白名单或临时注释规避该规则；若存在无法使用 JSX 的阻塞，先处理阻塞，再落地代码。
- 新增涉及渲染的复杂逻辑文件时，优先落在 `.tsx` 或支持 JSX 的实现文件中，避免后续二次迁移。

## Non-Goals
- 不强制将历史全部 `h()` 实现一次性迁移为 JSX/TSX。
- 不限制纯模板（`<template>`）SFC 的常规开发方式。

## Exceptions
- 无。

## Checks
- 检查新增脚本渲染代码是否优先使用 JSX/TSX。
- 检查是否新增了 `h()` 导入或调用；若有，视为不符合规范。
- 检查 ESLint 的 `no-restricted-imports`、`no-restricted-syntax` 是否仍在生效。
