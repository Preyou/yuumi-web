import { createRequest } from '@/api/createRequest'
import { sysApi } from '@/api/sysApi'

/**
 * 默认请求 Hook 工厂实例。
 *
 * @remarks
 * 使用 `sysApi` 作为底层 API 客户端，返回值类型由 OpenAPI `PathMap` 自动推导。
 */
export const useRequest = createRequest(sysApi, {
  pagination: {
    firstPage: 1,
  },
})
