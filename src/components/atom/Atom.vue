<script setup lang="ts">
interface Props extends /* @vue-ignore */ Reka.PrimitiveProps {
  class?: Vue.HTMLAttributes['class']
  baseClass?: Vue.HTMLAttributes['class']
}

defineProps<Props>()
</script>

<template>
  <RkPrimitive
    :class="$cn(baseClass, $props.class)"
  >
    <slot />
  </RkPrimitive>
</template>
