import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'
import tailwind from 'eslint-plugin-tailwindcss'

const compat = new FlatCompat()
export default antfu(
  {
    formatters: true,
    vue: {
      a11y: false,
      overrides: {
        'vue/attributes-order': [
          'error',
          {
            alphabetical: false,
            order: [
              'DEFINITION',
              'LIST_RENDERING',
              'CONDITIONALS',
              'RENDER_MODIFIERS',
              'GLOBAL',
              ['UNIQUE', 'SLOT'],
              'TWO_WAY_BINDING',
              'OTHER_DIRECTIVES',
              'OTHER_ATTR',
              'EVENTS',
              'CONTENT',
            ],
          },
        ],
        'vue/component-name-in-template-casing': [
          'error',
          'PascalCase',
          {
            registeredComponentsOnly: false,
          },
        ],
        // 'vue/component-tags-order': ['error', {
        //   order: [['script', 'template'], 'style'],
        // }],
        'vue/define-macros-order': [
          'error',
          {
            defineExposeLast: true,
            order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
          },
        ],
        'vue/max-attributes-per-line': [
          'error',
          {
            multiline: {
              max: 1,
            },
            singleline: {
              max: 3,
            },
          },
        ],
        'vue/multiline-html-element-content-newline': [
          'error',
          {
            allowEmptyLines: false,
            // ignores: ['pre', 'textarea', ...INLINE_ELEMENTS],
            ignoreWhenEmpty: true,
          },
        ],
      },
    },
    ...compat.config({
      rules: {
        'tailwindcss/no-custom-classname': 0,

        'antfu/no-top-level-await': 'off',
        'antfu/top-level-function': 'error',

        'arrow-body-style': 'off',
        'curly': ['error', 'multi-line'],
        'eslint-comments/no-unlimited-disable': 'off',
        'func-style': 'off',
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-param-reassign': 'error',
        'no-template-curly-in-string': 'off',
        'no-unlimited-disable': 'off',
        'object-shorthand': ['error', 'always'],

        'perfectionist/sort-classes': [
          'warn',
          {
            order: 'asc',
            type: 'natural',
          },
        ],
        'perfectionist/sort-objects': [
          'warn',
          {
            order: 'asc',
            type: 'natural',
          },
        ],
        'prefer-arrow-callback': 'error',
      },
      settings: {
        tailwindcss: {},
      },
      extends: ['.eslintrc-auto-import.json'],
    }),
    ignores: ['src/components/ui/**/*'],
  },
  tailwind.configs['flat/recommended'][0],
)
