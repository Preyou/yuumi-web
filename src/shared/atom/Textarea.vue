<script setup lang="ts">
import { Textarea as UiTextarea } from '@/shared/ui/textarea'

type UiTextareaProps = InstanceType<typeof UiTextarea>['$props']

interface Props extends /* @vue-ignore */ UiTextareaProps {

}

defineProps<Props>()
</script>

<template>
  <UiTextarea v-bind="$attrs" />
</template>
