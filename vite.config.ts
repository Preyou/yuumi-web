import type { ComponentResolverObject } from 'unplugin-vue-components/types'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import * as UasComps from '@vueuse/components'
import { drop, lowerFirst, words } from 'es-toolkit'
import openapiToDts from 'openapi-to-dts/vite'
import RekaResolver from 'reka-ui/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { envParse } from 'vite-plugin-env-parse'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    openapiToDts({
      uri: 'http://localhost:3000/openapi/json',
      writeTo: new URL('./types/auto/openapi.d.ts', import.meta.url),
    }),
    vue(),
    tailwindcss(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/*.json'),
    }),
    VueRouter({
      beforeWriteFiles: function beforeWriteFiles(root) {
        root.children.forEach(beforeWriteFiles)
        if (root.children.some(({ fullPath }) => !fullPath.endsWith('/:path(.*)'))) {
          const route404 = root.insert(
            ':path(.*)',
            fileURLToPath(new URL('./src/components/page/404.vue', import.meta.url)).replaceAll(
              '\\',
              '/',
            ),
          )
          route404.meta = { type: '404' }
        }
      },
      dts: './types/auto/typed-router.d.ts',
      importMode: 'async',
      routesFolder: [
        {
          path: '',
          src: 'src/views',
        },
      ],
    }),
    vueJsx(),

    envParse({
      dtsPath: './types/auto/import-meta.d.ts',
    }),

    Components({
      dts: './types/auto/components.d.ts',
      resolvers: [
        RekaResolver({ prefix: 'Rk' }),
        (name) => {
          const paths = words(name)
          if (name.startsWith('Mol')) {
            return { from: `@/components/molecule`, name: name.slice(2) }
          }
          switch (drop(paths, 1)[0]) {
            case 'Mol':
              return { from: `@/components/molecule/${paths.map((p, i) => i === paths.length - 1 ? `${p}.vue` : lowerFirst(p)).join('/')}`, name: 'default', as: paths.at(-1) }
            case 'In':
              return { from: `@/components/inorganic/${paths.map((p, i) => i === paths.length - 1 ? `${p}.vue` : lowerFirst(p)).join('/')}`, name: 'default', as: paths.at(-1) }
            case 'Org':
              return { from: `@/components/organic/${paths.map((p, i) => i === paths.length - 1 ? `${p}.vue` : lowerFirst(p)).join('/')}`, name: 'default', as: paths.at(-1) }
          }
        },
        (name) => {
          if (
            Object.keys(UasComps)
              .filter(key => !key.startsWith('v'))
              .includes(name)
          ) {
            return { from: '@vueuse/components', name }
          }
        },
        {
          resolve: (name) => {
            if (
              Object.keys(UasComps)
                .filter(key => key.startsWith('v'))
                .includes(`v${name}`)
            ) {
              return { from: '@vueuse/components', name: `v${name}` }
            }
          },
          type: 'directive',
        },
        ...Object.entries({
          '@formkit/auto-animate': ['vAutoAnimate'],
        } as Record<string, string[] | [string, string][]>).map(
          ([from, items]) =>
            ({
              resolve(name) {
                const item = items.find((item) => {
                  return (typeof item === 'string' ? item : item[1]) === `v${name}`
                })
                if (item) {
                  return typeof item === 'string'
                    ? {
                        from,
                        name: item,
                      }
                    : {
                        as: item[1],
                        from,
                        name: item[0],
                      }
                }
              },
              type: 'directive',
            } as ComponentResolverObject),
        ),

        ...Object.entries({
          // 'motion-v': [['Motion', 'VueMotion']],
        } as Record<string, string[] | [string, string][]>).map(
          ([from, items]) =>
            ({
              resolve(name) {
                const item = items.find((item) => {
                  return (typeof item === 'string' ? item : item[1]) === name
                })
                if (item) {
                  return typeof item === 'string'
                    ? {
                        from,
                        name: item,
                      }
                    : {
                        as: item[1],
                        from,
                        name: item[0],
                      }
                }
              },
              type: 'component',
            } as ComponentResolverObject),
        ),
      ],
      globs: ['src/components/shadcn/**/*.vue', 'src/components/atom/*.vue'],
    }),
    AutoImport({
      dts: './types/auto/auto-imports.d.ts',
      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: 'readonly', // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
      imports: [
        '@vueuse/core',
        '@vueuse/math',
        '@vueuse/head',
        'vue',
        'pinia',
        {
          '@/locales/index.ts': [['global', '$i18n']],
          'vue-i18n': ['useI18n'],
          '@/lib/utils': ['cn'],
        },
        VueRouterAutoImports,
      ],
    }),
    Icons({
      autoInstall: true,
      compiler: 'vue3',
      customCollections: {
        // a helper to load icons from the file system
        // files under `./assets/icons` with `.svg` extension will be loaded as it's file name
        // you can also provide a transform callback to change each icon (optional)
        // 'app-icons': FileSystemIconLoader('./src/icons', svg =>
        //   svg.replace(/^<svg /, '<svg fill="currentColor" ')),
      },
      scale: 1,
    }),

    devtoolsJson(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), './src'),
    },
  },
})
