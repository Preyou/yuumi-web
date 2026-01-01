/// <reference types="vite/client" />
/* eslint-disable perfectionist/sort-exports */
import 'vue-router/auto-routes'
import 'vue-router'
import 'vue'
import 'type-fest'
// import '@vueuse/components'
import '@vueuse/core'
import '@vueuse/head'
import '@vueuse/math'
import '@vueuse/components'
import 'reka-ui'
import 'vue-component-type-helpers'

declare global {
  declare namespace VueUse {
    // export type * from '@vueuse/components'
    export type * from '@vueuse/core'
    export type * from '@vueuse/head'
    export type * from '@vueuse/math'
    export type * from '@vueuse/components'
  }

  declare namespace Vue {
    export type * from 'vue'
    export type * from 'vue-component-type-helpers'
  }

  declare namespace Reka {
    export * from 'reka-ui'
  }

  declare namespace VueRouter {
    export type * from 'vue-router'
    export type * from 'vue-router/auto-routes'
  }
  declare namespace TypeFest {
    export type * from 'type-fest'
  }
  declare namespace Sys {

  }

}

declare module 'vue-router' {
  interface RouteMeta {
    icon?: string
    order?: number
    title?: string
    type?: '404'
  }
}

type Directives = {
  [P in keyof Vue.GlobalDirectives]?: Vue.GlobalDirectives[P] extends Vue.ObjectDirective<infer _, infer V> ? V : never;
}

declare module 'vue' {

  interface ComponentCustomProperties {
    cn: typeof import('@/lib/utils')['cn']
  }

  interface HTMLAttributes extends Directives, AttributifyAttributes {
  }

}
