import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { i18n } from '@/locales'
import { router } from '@/router'
import App from './App.vue'
import '@/assets/css/index.css'

const app = createApp(App)
  .use(createPinia())
  .use(router)
  .use(i18n)

app.config.globalProperties.$api = $api
app.config.globalProperties.$cn = $cn
app.mount('#app')
