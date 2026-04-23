<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'

interface BreadcrumbRouteItem {
  current: boolean
  key: string
  label: string
  to: string
}

const { basePath = '' } = defineProps<{
  basePath?: string
}>()

const route = useRoute()

const breadcrumbs = computed<BreadcrumbRouteItem[]>(() => {
  const matched = route.matched.filter(({ path }) => {
    if (path.includes(':path(.*)')) {
      return false
    }
    if (basePath.length > 0) {
      return path.startsWith(basePath)
    }
    return true
  })

  return matched.map((record, index) => {
    const metaTitle = typeof record.meta?.title === 'string' ? record.meta.title : null
    const segment = record.path.split('/').filter(Boolean).at(-1)
    return {
      current: index === matched.length - 1,
      key: `${record.path}-${index}`,
      label: metaTitle
        ?? (
          !segment
            ? 'Home'
            : segment
                .split(/[-_]/g)
                .filter(Boolean)
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ')
        ),
      to: record.path,
    }
  })
})
</script>

<template>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem
        v-for="item in breadcrumbs"
        :key="item.key"
      >
        <BreadcrumbLink
          v-if="!item.current"
          as-child
        >
          <RouterLink :to="item.to">
            {{ item.label }}
          </RouterLink>
        </BreadcrumbLink>
        <BreadcrumbPage v-else>
          {{ item.label }}
        </BreadcrumbPage>
        <BreadcrumbSeparator
          v-if="!item.current"
        />
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>
