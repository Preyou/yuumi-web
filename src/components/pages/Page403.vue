<script setup lang="ts">
const { description = '烟一重，雾一重，蓬山分明在望中，偏教弱水封', home = '/home', homeText = '回家', previousText = '来时路' } = defineProps<{
  homeText?: string
  previousText?: string
  description?: string
  home?: VueRouter.RouteLocationRaw
}>()

defineEmits<{
  goHome: []
}>()
</script>

<template>
  <n-empty :description="description" class="flex items-center justify-center size-full" style="--n-icon-size: auto;">
    <template #icon>
      <i-ooui-link-secure class="text-64" />
    </template>
    <template #extra>
      <div class="flex gap-4">
        <router-link :to="home">
          <n-button size="large" type="primary">
            {{ homeText }}
          </n-button>
        </router-link>
        <n-button size="large" type="info" @click="$router.back()">
          {{ previousText }}
        </n-button>
      </div>
    </template>
  </n-empty>
</template>
