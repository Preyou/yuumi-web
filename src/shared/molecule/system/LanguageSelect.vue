<script setup lang="ts">
import { useLocalStorage, useNavigatorLanguage } from '@vueuse/core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { getAppStorageKey } from '@/lib/appName'

const { language } = useNavigatorLanguage()

function getAvailableLocales(): string[] {
  return $i18n.availableLocales.length > 0 ? [...$i18n.availableLocales] : [String($i18n.locale.value)]
}

function resolveLocale(candidate: string | null | undefined): string | null {
  if (!candidate) {
    return null
  }

  const availableLocales = getAvailableLocales()
  const normalizedCandidate = candidate.toLowerCase()
  const exactMatch = availableLocales.find(locale => locale.toLowerCase() === normalizedCandidate)
  if (exactMatch) {
    return exactMatch
  }

  const prefix = normalizedCandidate.split('-')[0]
  if (!prefix) {
    return null
  }

  return availableLocales.find(locale => locale.toLowerCase().startsWith(`${prefix}-`)) ?? null
}

const initialLocale = resolveLocale(language.value)
  ?? resolveLocale(String($i18n.locale.value))
  ?? 'en-US'

const locale = useLocalStorage<string>(getAppStorageKey('locale'), initialLocale)

watchEffect(() => {
  const resolvedLocale = resolveLocale(locale.value) ?? initialLocale
  if ($i18n.locale.value !== resolvedLocale) {
    $i18n.locale.value = resolvedLocale
  }
  if (locale.value !== resolvedLocale) {
    locale.value = resolvedLocale
  }
})

const localeOptions = computed(() => {
  return getAvailableLocales().map((value) => {
    const lower = value.toLowerCase()
    let labelKey = ''
    if (lower === 'en-us') {
      labelKey = 'common.locale.enUS'
    }
    else if (lower === 'zh-cn') {
      labelKey = 'common.locale.zhCN'
    }

    return {
      label: labelKey ? $i18n.t(labelKey) : value,
      value,
    }
  })
})
</script>

<template>
  <div class="flex items-center gap-2">
    <span class="text-muted-foreground text-xs">{{ $t('common.language') }}</span>
    <Select v-model="locale">
      <SelectTrigger class="h-8 w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in localeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
