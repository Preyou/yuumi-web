<script setup lang="ts">
import type { output as ZodOutput } from 'zod'
import { zPet } from '@/api/auto/zod.gen'
import { createForm } from '@/shared/molecule/form'

const VeeForm = createForm(zPet)

function onSubmit(values: ZodOutput<typeof zPet>) {
  void values
}
</script>

<template>
  <VeeForm @submit="onSubmit" class="p-8" />
</template>
