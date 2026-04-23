import * as z from 'zod'
import messages from '@intlify/unplugin-vue-i18n/messages'
import { watch } from 'vue'
import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages,
})

export const global = i18n.global

watch(
  global.locale,
  (locale) => {
    const normalizedLocale = String(locale).toLowerCase()
    z.config(
      normalizedLocale.startsWith('zh-cn')
        ? z.locales.zhCN()
        : normalizedLocale.startsWith('zh-tw')
          ? z.locales.zhTW()
          : z.locales.en(),
    )
  },
  {
    immediate: true,
  },
)
