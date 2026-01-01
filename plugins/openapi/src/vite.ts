import type { Config } from './config'
import { generaDts } from './utils'

export default function openapiToDts(options: Config) {
  return {
    // Build 开始时执行（对应 vite build）
    buildStart() {
      generaDts(options)
    },

    // Vite 开发服务器启动后执行（对应 vite dev 或 vite serve）
    configureServer() {
      generaDts(options)
    },

    name: 'openapiToDts',
  }
}
