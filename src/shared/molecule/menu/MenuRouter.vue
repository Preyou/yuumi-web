<script setup lang="ts">
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/sidebar'

const { fatherName, type } = defineProps<{
  /** 父路由名 */
  fatherName: VueRouter.RouteRecordName
  /** 按照类型过滤 */
  type: VueRouter.RouteMeta['type']
}>()

const menus = useRouter()
  .getRoutes()
  .find(({ name }) => name === fatherName)
  ?.children
  .filter(({ meta }) => meta?.type === type)
  .sort(({ meta: { order: order1 = 0 } = {} }, { meta: { order: order2 = 0 } = {} }) => order1 - order2) ?? []

const { open } = useSidebar()
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem v-for="menu in menus" :key="menu.name as string">
          <SidebarMenuButton
            as-child
            :is-active="$route.matched.some(({ name }) => name === menu.name,
            )"
          >
            <RouterLink :to="menu">
              <Icon :icon="menu.meta?.icon" />
              <Text v-if="open">
                {{ menu.meta?.title ?? menu.name }}
              </Text>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
