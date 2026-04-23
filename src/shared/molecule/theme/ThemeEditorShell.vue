<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { createThemeEditorInitialValues, themeEditorSchema } from './themeEditorSchema'
import { themeProviderPortalTargetKey } from './themeProviderPortal'
import { useThemeState } from './useTheme'

const portalTarget = inject(themeProviderPortalTargetKey, null)

if (!portalTarget) {
  throw new Error('[ThemeEditorShell] This component must be used under ThemeProvider.')
}

const [opened, toggleOpened] = useToggle(false)
const teleportTarget = computed(() => portalTarget.value ?? null)
const { currentTheme } = useThemeState()
const formInitialValues = computed(() => createThemeEditorInitialValues(currentTheme.value))
</script>

<template>
  <Teleport v-if="teleportTarget" :to="teleportTarget">
    <section
      class="relative z-50 h-full shrink-0 transition-[width] duration-300"
      :class="opened ? 'w-80' : 'w-0'"
    >
      <div
        class="h-full w-full overflow-hidden border-l bg-card text-card-foreground transition-opacity duration-300"
        :class="opened ? 'opacity-100' : 'opacity-0'"
      >
        <div class="h-full w-80 overflow-auto p-4">
          <h3 class="text-sm font-semibold">
            Theme Editor
          </h3>
          <p class="text-muted-foreground mt-2 text-xs leading-5">
            通过 `theme.schema.json` 生成 zod schema 并自动渲染表单。
          </p>
          <SchemaForm
            :schema="themeEditorSchema"
            :initial-values="formInitialValues"
            class="mt-4 space-y-3"
            name="theme-editor-form"
          >
            <template #actions>
              <div class="pt-1">
                <Button type="submit" size="sm">
                  Apply (WIP)
                </Button>
              </div>
            </template>
          </SchemaForm>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        class="absolute top-1/2 -left-8 z-10 -translate-y-1/2 rounded-l-3xl rounded-r-none"
        :aria-expanded="opened"
        aria-label="Toggle theme editor"
        @click="toggleOpened()"
      >
        <Icon icon="icon-[lucide--palette]" class="size-4" />
      </Button>
    </section>
  </Teleport>
</template>
