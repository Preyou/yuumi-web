<script setup lang="ts">
import type { TeleportProps } from 'vue'
import type { AtomProps } from '@/shared/atom/Atom.vue'
import { Spinner } from '@/shared/ui/spinner'

interface LoadingProps extends AtomProps, Omit<TeleportProps, 'to'> {
  to?: TeleportProps['to']
  loading?: boolean | Promise<unknown>
}

const {
  defer,
  disabled,
  loading = false,
  to,
} = defineProps<LoadingProps>()

const promiseLoading = ref(false)
let loadingToken = 0

watch(
  () => loading,
  (loadingValue) => {
    loadingToken += 1
    const currentToken = loadingToken

    if (loadingValue instanceof Promise) {
      promiseLoading.value = true
      void loadingValue.finally(() => {
        if (currentToken === loadingToken) {
          promiseLoading.value = false
        }
      }).catch(() => {})
      return
    }

    promiseLoading.value = false
  },
  { immediate: true },
)

const isLoading = computed(() => loading === true || promiseLoading.value)
const teleportProps = computed<TeleportProps>(() => ({
  defer,
  disabled,
  to,
}))

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()
</script>

<template>
  <DefineTemplate>
    <Atom
      v-if="isLoading"
      v-bind="{ ...$attrs, ...$props, baseClass: $cn('absolute inset-0 flex items-center justify-center bg-muted backdrop-blur-[1px]', $props.baseClass) }"
    >
      <div class="flex flex-col items-center justify-center gap-2 text-foreground">
        <slot name="icon">
          <Spinner class="size-8 text-primary" />
        </slot>
        <slot />
      </div>
    </Atom>
  </DefineTemplate>
  <Teleport v-if="to" v-bind="teleportProps">
    <ReuseTemplate />
  </Teleport>
  <ReuseTemplate v-else />
</template>
