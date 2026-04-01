<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AtomProps } from './Atom.vue'

export interface IconProps extends /* @vue-ignore */ AtomProps {
  asBg?: boolean
  icon: HTMLAttributes['class']
}

defineProps<IconProps>()
</script>

<template>
  <Atom :class="icon" :base-class="asBg ? 'iconify-color' : 'iconify'" as="i">
    <slot />
  </Atom>
</template>
