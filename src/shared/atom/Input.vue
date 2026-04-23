<script setup lang="ts">
import { Input as UiInput } from '@/shared/ui/input'

type UiInputProps =ExtractPublicPropTypes<InstanceType<typeof UiInput>['$props']>

interface Props extends /* @vue-ignore */ UiInputProps {

}

defineProps<Props>()
</script>

<template>
  <UiInput />
</template>
