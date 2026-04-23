<script setup lang="ts">
import { Label as UiLabel } from '@/shared/ui/label'

type UiLabelProps = InstanceType<typeof UiLabel>['$props']

interface Props extends /* @vue-ignore */ UiLabelProps{

}


defineProps<Props>()
</script>

<template>
  <UiLabel v-bind="$attrs">
    <slot />
  </UiLabel>
</template>
