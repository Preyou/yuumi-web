<script setup lang="ts">
import { useTheme } from '@/shared/molecule/theme/useTheme'
import { ScrollArea } from '@/shared/ui/scroll-area'

const { theme } = useTheme()
</script>

<template>
  <ScrollArea class="size-full p-4">
    <SchemaForm
      :initial-values="theme.variables"
      :schema="theme.schema"
      class="mt-4 space-y-3"
      name="theme-editor-form"
    >
      <template #actions>
        <div class="pt-1">
          <Button type="submit" size="sm">
            Apply (WIP)
          </Button>
        </div>
      </template>
    </SchemaForm>
  </ScrollArea>
</template>
