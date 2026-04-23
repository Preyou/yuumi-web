# VueUse First

## Purpose
- 在需要新增通用前端能力时，提供“优先复用 VueUse”的执行手册。
- 降低重复造轮子风险，统一 composable/组件选型。

## Use When
- 需求涉及状态监听、浏览器 API、事件、计时器、存储、异步状态、滚动/可见性、响应式工具等通用能力。
- 你在“自己写一个 composable”与“使用 VueUse”之间做选择。

## Workflow
1. 先确认项目已有封装是否已满足（`shared/molecule`、`shared/atom`、`shared/ui`）。
2. 若无现成封装，检索 VueUse：
   - 函数：`@vueuse/core`、`@vueuse/math`、`@vueuse/head`
   - 组件：`@vueuse/components`
3. 若 VueUse 可满足，直接使用 VueUse，不新增等价实现。
4. 优先使用自动导入（以 `types/auto/auto-imports.d.ts`、`types/auto/components.d.ts` 为准）。
5. 若 VueUse 不满足，再自实现，并在交付说明中记录“不采用 VueUse”的原因。

## Quick Mapping
- 防抖/节流：`useDebounceFn`、`useThrottleFn`、`debouncedWatch`、`throttledWatch`
- 本地持久化：`useLocalStorage`、`useSessionStorage`
- 事件监听：`useEventListener`、`onClickOutside`
- 元素与窗口：`useElementSize`、`useElementVisibility`、`useWindowSize`
- 媒体与主题：`useMediaQuery`、`useColorMode`、`useDark`
- 异步状态：`useAsyncState`
- 滚动与可见性：`useIntersectionObserver`、`useInfiniteScroll`
- 表单辅助：`useVModel`

## Guardrails
- 后端请求仍优先 `$req`/`$api`，不以 VueUse `useFetch` 替代项目请求体系。
- 不为“VueUse 已有能力”新建同构 composable。
- 发现文档可用但项目不可用时，先暂停并询问用户是否排查根因。
