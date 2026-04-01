import type { StatesHook } from 'alova'
import type { AxiosError } from 'axios'
import type { PathMap } from './auto'
import type { InferAlovaGenerics } from './createApi'
// import { router } from '@/router'
import { axiosRequestAdapter } from '@alova/adapter-axios'
import { createAlova } from 'alova'
import { createClientTokenAuthentication } from 'alova/client'
import { createApi } from './createApi'

const accessToken = useLocalStorage('access_token', '')

const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<StatesHook<any>, typeof axiosRequestAdapter>({
  assignToken: (method) => {
    method.config.headers = {
      ...(method.config.headers ?? {}),
      Authorization: `Bearer ${accessToken.value}`,
    }
  },
  login({ data: _data }) {
    // accessToken.value = data
  },
  logout() {
    localStorage.clear()
  },
  // refreshToken: refreshTokenMethod && {
  //   // 当token过期时触发，在此函数中触发刷新token
  //   handler: async () => {
  //     // @ts-expect-error 由用户自行确保调用的一定是refreshTokenMethod
  //     const { access_token } = await $api[refreshTokenMethod]({
  //       headers: {
  //         'Refresh-Token': refreshToken.value,
  //       },
  //     })
  //     initToken(access_token)
  //   },

  //   // 在请求前触发，将接收到method参数，并返回boolean表示token是否过期
  //   isExpired: () => {
  //     return expireTime.value < Date.now()
  //   },
  // },
})

export const alovaInstance = createAlova({
  baseURL: import.meta.env.VITE_SysApiBaseURL,
  beforeRequest: onAuthRequired((method) => {
    method.config.headers = {
      ...(method.config.headers ?? {}),
      Accept: 'application/json',
    }
  }),
  // cacheFor: null,
  requestAdapter: axiosRequestAdapter(),
  responded: onResponseRefreshToken({
    onError: async (err: AxiosError, _method) => {
      if (err.status === 401) {
        // router.push({
        //   name:
        // })
      }
      return Promise.reject(err)
    },
    onSuccess: async ({ data }, _method) => {
      // $message.success(data.message)
      return data
    },
  }),
  timeout: import.meta.env.VITE_API_Timeout,
})

/**
 * 系统接口 API 客户端。
 *
 * @remarks
 * 由 `createApi<PathMap, InferAlovaGenerics<typeof alovaInstance>>(alovaInstance)` 创建，调用形态：
 * `sysApi('/path').get({...})` / `sysApi('/path').post({...})`。
 * `PathMap` 仍由调用方显式指定；
 * 第二个泛型通过 `InferAlovaGenerics<typeof alovaInstance>` 提取，
 * 避免手写一整段 `AlovaGenerics<...>`。
 */
export const sysApi = createApi<PathMap, InferAlovaGenerics<typeof alovaInstance>>(alovaInstance)
