import type { ComponentResolverObject } from 'unplugin-vue-components/types'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import Shiki from '@shikijs/markdown-exit'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import * as UasComps from '@vueuse/components'
import RekaResolver from 'reka-ui/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import Components from 'unplugin-vue-components/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { envParse } from 'vite-plugin-env-parse'
import vueDevTools from 'vite-plugin-vue-devtools'

const shiki = await Shiki({
  themes: { dark: 'vitesse-dark', light: 'vitesse-light' },
})
export default defineConfig(({ mode }) => {
  const appName = loadEnv(mode, 'env', '').APP_NAME?.trim() || 'app'

  return {
    define: {
      'import.meta.env.APP_NAME': JSON.stringify(appName),
    },
    envDir: 'env',
    plugins: [
      Markdown({
        markdownItOptions: {
          html: true,
          linkify: true,
          typographer: true,
        },
        markdownItSetup(md) {
          md.use(shiki)
        },
      }),
      VueRouter({
        beforeWriteFiles: function beforeWriteFiles(root) {
          root.children.forEach(beforeWriteFiles)
          if (root.children.some(({ fullPath }) => !fullPath.endsWith('/:path(.*)'))) {
            const route404 = root.insert(
              ':path(.*)',
              fileURLToPath(new URL('./src/shared/molecule/http/Http404.vue', import.meta.url)).replaceAll(
                '\\',
                '/',
              ),
            )
            route404.meta = { type: '404' }
          }
        },
        dts: './types/auto/typed-router.d.ts',
        extensions: ['.vue', '.md'],
        importMode: 'async',
        routesFolder: [
          {
            path: '',
            src: 'src/views',
          },
        ],
      }),
      vue({
        include: [/\.vue$/, /\.md$/],
      }),
      tailwindcss(),
      VueI18nPlugin({
        include: resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/*.json'),
      }),
      vueJsx(),

      envParse({
        dtsPath: './types/auto/import-meta.d.ts',
      }),

      Components({
      // directoryAsNamespace: false,
      // dirs: [
      //   // 'src/features',
      //   'src/shared/atom',
      //   'src/shared/molecule',
      // ],
        dts: './types/auto/components.d.ts',
        globs: ['src/shared/atom/**/*.vue', 'src/shared/molecule/**/*.vue'],
        include: [/\.vue$/, /\.vue\?vue/, /\.tsx$/, /\.md$/, /\.md\?vue/],
        resolvers: [
          RekaResolver({ prefix: 'Rk' }),
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
          // {
          //   resolve: (name) => {
          //     const path = hasInPaths(name, ['ts', 'tsx'])
          //     if (path) {
          //       return { from: path, name: 'default' }
          //     }
          //   },
          //   type: 'directive',
          // },
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
      }),
      AutoImport({
        dirs: [
          'src/shared/hooks/**/use*.ts',
        ],
        dts: './types/auto/auto-imports.d.ts',
        eslintrc: {
          enabled: true, // Default `false`
          filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
          globalsPropValue: 'readonly', // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
        },
        imports: [
          'vue',
          'pinia',
          {
            '@/api/sysApi': [['sysApi', '$api']],
            '@/lib/utils': [['cn', '$cn']],
            '@/locales/index.ts': [['global', '$i18n']],
            '@/shared/hooks/useRequest': [['useRequest', '$req']],
            'vue-i18n': ['useI18n'],
            'vue-sonner': [['toast', '$toast']],
            'zod': [['*', 'z']],
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
    server: {
      proxy: {
        '/api': {
          changeOrigin: true,
          target: 'http://127.0.0.1:3000',
        },
      },
    },
  }
})
