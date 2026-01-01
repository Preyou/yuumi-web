import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  // pass the generated routes written by the plugin 🤖
  routes,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
