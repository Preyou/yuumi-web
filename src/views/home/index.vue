<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'

const defaultPlaceholder = today(getLocalTimeZone())
const date = ref() as Ref<DateValue>
const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})
</script>

<template>
  <div>
    <Popover v-slot="{ close }">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="cn('w-60 justify-start text-left font-normal', !date && 'text-muted-foreground')"
        >
          <CalendarIcon />
          {{ date ? df.format(date.toDate(getLocalTimeZone())) : "Pick a date" }}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="start">
        <Calendar
          v-model="date"
          :default-placeholder="defaultPlaceholder"
          layout="month-and-year"
          initial-focus
          @update:model-value="close"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>
