<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'

export interface AtomProps extends PrimitiveProps {
  class?: Vue.HTMLAttributes['class']
  baseClass?: Vue.HTMLAttributes['class']
}

defineProps<AtomProps>()
</script>

<template>
  <RkPrimitive
    :class="$cn(baseClass, $props.class)"
  >
    <slot />
  </RkPrimitive>
</template>
