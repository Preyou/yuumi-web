<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AtomSelect from '@/shared/atom/Select.vue'
import LanguageSelect from '@/shared/molecule/system/LanguageSelect.vue'
import { useTheme } from '@/shared/molecule/theme/useTheme'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/shared/ui/sidebar'

const { t, te } = useI18n()
const { preset, presets, setPreset } = useTheme()

const themeOptions = computed(() => {
  return presets.value.map(({ key, mode, themeName }) => {
    const labelKey = `common.themePreset.${themeName}`
    const modeKey = mode === 'dark' ? 'common.colorMode.dark' : 'common.colorMode.light'
    const label = te(labelKey) ? t(labelKey) : themeName
    return {
      label: `${label} (${t(modeKey)})`,
      value: key,
    }
  })
})
</script>

<template>
  <SidebarProvider>
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader class="border-sidebar-border h-14 gap-0 border-b px-2 py-0">
        <div class="flex items-center gap-2 px-2 py-1">
          <Icon icon="icon-[lucide--layout-grid]" class="size-4" />
          <Text class="text-sm font-semibold">
            Example
          </Text>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <MenuRouter father-name="/home" type="sys-menu" />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="flex h-14 items-center justify-between gap-3 border-b px-4">
        <div class="flex min-w-0 items-center gap-2">
          <SidebarTrigger />
          <BreadcrumbRouter base-path="/example" />
        </div>

        <div class="flex items-center gap-3">
          <LanguageSelect />

          <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-xs">
              {{ $t('common.theme') }}
            </span>
            <div class="w-[150px]">
              <AtomSelect
                :model-value="preset"
                :options="themeOptions"
                @update:model-value="(value) => { setPreset(String(value)) }"
              />
            </div>
          </div>

        </div>
      </header>
      <section class="flex-1 overflow-auto p-4">
        <RouterView />
      </section>
    </SidebarInset>
  </SidebarProvider>
</template>
