<script setup lang="ts">
import { Switch as UiSwitch } from '@/shared/ui/switch'

type UiSwitchProps = InstanceType<typeof UiSwitch>['$props']

interface Props extends /* @vue-ignore */ UiSwitchProps {

}

defineProps<Props>()
</script>

<template>
  <UiSwitch v-bind="$attrs">
    <template #thumb="slotProps">
      <slot name="thumb" v-bind="slotProps" />
    </template>
  </UiSwitch>
</template>
