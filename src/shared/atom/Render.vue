<script setup lang="ts">
import { isVNode } from 'vue'

export interface RenderProps {
  render: Vue.RenderFunction | Vue.Component | Vue.VNode | string
}

const { render } = defineProps<RenderProps>()

const componentToRender = computed(() => {
  if (isVNode(render) || typeof render === 'string') {
    return () => render
  }
  return render
})
</script>

<template>
  <component :is="componentToRender" />
</template>
