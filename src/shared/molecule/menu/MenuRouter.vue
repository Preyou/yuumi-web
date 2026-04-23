<script setup lang="ts">
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/shared/ui/sidebar'

const { fatherName, type } = defineProps<{
  /** 父路由名 */
  fatherName: VueRouter.RouteRecordName
  /** 按照类型过滤 */
  type: VueRouter.RouteMeta['type']
}>()

interface MenuGroup {
  children: VueRouter.RouteRecordRaw[]
  route: VueRouter.RouteRecordRaw
}

const route = useRoute()
const router = useRouter()

function getOrder(record: VueRouter.RouteRecordRaw): number {
  return typeof record.meta?.order === 'number' ? record.meta.order : 0
}

function compareByOrder(
  a: VueRouter.RouteRecordRaw,
  b: VueRouter.RouteRecordRaw,
): number {
  return getOrder(a) - getOrder(b)
}

function isCatchAllRoute(record: VueRouter.RouteRecordRaw): boolean {
  return record.path.includes(':path(.*)')
}

function isVisibleMenuRoute(record: VueRouter.RouteRecordRaw, requiredType?: VueRouter.RouteMeta['type']): boolean {
  if (isCatchAllRoute(record)) {
    return false
  }
  if (record.path.endsWith('/')) {
    return false
  }
  if (typeof requiredType === 'undefined') {
    return true
  }
  return record.meta?.type === requiredType
}

function getRouteTitle(record: VueRouter.RouteRecordRaw): string {
  if (typeof record.meta?.title === 'string' && record.meta.title.length > 0) {
    return record.meta.title
  }

  const segment = record.path.split('/').filter(Boolean).at(-1)
  if (!segment) {
    return 'Untitled'
  }

  return segment
    .split(/[-_]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const rootRoute = computed(() => {
  return router.getRoutes().find(({ name }) => name === fatherName)
})

const menus = computed<MenuGroup[]>(() => {
  return (rootRoute.value?.children ?? [])
    .filter(record => isVisibleMenuRoute(record, type))
    .sort(compareByOrder)
    .map((record) => {
      return {
        children: (record.children ?? [])
          .filter(child => isVisibleMenuRoute(child))
          .sort(compareByOrder),
        route: record,
      }
    })
})

function isParentActive(record: VueRouter.RouteRecordRaw): boolean {
  return route.matched.some(({ name }) => name === record.name)
}

function isChildActive(record: VueRouter.RouteRecordRaw): boolean {
  return route.matched.some(({ name }) => name === record.name)
}

function toRouteTarget(record: VueRouter.RouteRecordRaw): string {
  if (record.name) {
    return router.resolve({ name: record.name as any }).fullPath
  }

  if (record.path.startsWith('/')) {
    return record.path
  }

  return `/${record.path}`
}

const { open } = useSidebar()
</script>

<template>
  <SidebarMenu class="px-2">
    <SidebarMenuItem
      v-for="menu in menus"
      :key="String(menu.route.name ?? menu.route.path)"
    >
      <SidebarMenuButton as-child :is-active="isParentActive(menu.route)">
        <RouterLink :to="toRouteTarget(menu.route)">
          <Icon
            v-if="menu.route.meta?.icon"
            :icon="String(menu.route.meta?.icon)"
          />
          <Text v-if="open">
            {{ getRouteTitle(menu.route) }}
          </Text>
        </RouterLink>
      </SidebarMenuButton>

      <SidebarMenuSub v-if="menu.children.length > 0">
        <SidebarMenuSubItem
          v-for="child in menu.children"
          :key="String(child.name ?? child.path)"
        >
          <SidebarMenuSubButton as-child :is-active="isChildActive(child)">
            <RouterLink :to="toRouteTarget(child)">
              <Text>{{ getRouteTitle(child) }}</Text>
            </RouterLink>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      </SidebarMenuSub>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
