<script setup lang="ts">
import type { AtomProps } from './Atom.vue'

export interface TextProps extends /* @vue-ignore */ AtomProps {

}

defineProps<TextProps>()
</script>

<template>
  <Atom as="span">
    <slot />
  </Atom>
</template>
