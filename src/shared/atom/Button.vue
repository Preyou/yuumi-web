<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { IconProps } from './Icon.vue'
import type { ButtonVariants } from '@/shared/ui/button'
import { cva } from 'class-variance-authority'
import { Button as UiButton } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import AtomIcon from './Icon.vue'

type ButtonVariant = Exclude<NonNullable<ButtonVariants['variant']>, 'destructive'>
type ButtonIntent = 'default' | 'destructive' | 'warning' | 'success' | 'info' | 'brand'
type ButtonSize = ButtonVariants['size']

interface ButtonProps extends PrimitiveProps {
  variant?: ButtonVariant
  intent?: ButtonIntent
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean | IconProps['icon']
  block?: boolean
  disabled?: boolean
}

const {
  block = false,
  disabled = false,
  intent = 'default',
  loading = false,
  size = 'default',
  type = 'button',
  variant = 'default',
} = defineProps<ButtonProps>()

const intentClassMap = cva('disabled:pointer-events-auto', {
  compoundVariants: [
    {
      class: 'bg-brand text-brand-foreground hover:bg-brand/90',
      intent: 'brand',
      variant: 'default',
    },
    {
      class: 'text-brand hover:bg-brand/12',
      intent: 'brand',
      variant: 'ghost',
    },
    {
      class: 'text-brand hover:bg-transparent',
      intent: 'brand',
      variant: 'link',
    },
    {
      class: 'bg-transparent text-brand hover:bg-brand/12 dark:hover:bg-brand/15',
      intent: 'brand',
      variant: 'outline',
    },
    {
      class: 'bg-brand/15 text-brand hover:bg-brand/25',
      intent: 'brand',
      variant: 'secondary',
    },
    {
      class: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      intent: 'destructive',
      variant: 'default',
    },
    {
      class: 'text-destructive hover:bg-destructive/10',
      intent: 'destructive',
      variant: 'ghost',
    },
    {
      class: 'text-destructive hover:bg-transparent',
      intent: 'destructive',
      variant: 'link',
    },
    {
      class: 'bg-transparent text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/15',
      intent: 'destructive',
      variant: 'outline',
    },
    {
      class: 'bg-destructive/15 text-destructive hover:bg-destructive/25',
      intent: 'destructive',
      variant: 'secondary',
    },
    {
      class: 'bg-info text-info-foreground hover:bg-info/90',
      intent: 'info',
      variant: 'default',
    },
    {
      class: 'text-info hover:bg-info/12',
      intent: 'info',
      variant: 'ghost',
    },
    {
      class: 'text-info hover:bg-transparent',
      intent: 'info',
      variant: 'link',
    },
    {
      class: 'bg-transparent text-info hover:bg-info/12 dark:hover:bg-info/15',
      intent: 'info',
      variant: 'outline',
    },
    {
      class: 'bg-info/15 text-info hover:bg-info/25',
      intent: 'info',
      variant: 'secondary',
    },
    {
      class: 'bg-success text-success-foreground hover:bg-success/90',
      intent: 'success',
      variant: 'default',
    },
    {
      class: 'text-success hover:bg-success/12',
      intent: 'success',
      variant: 'ghost',
    },
    {
      class: 'text-success hover:bg-transparent',
      intent: 'success',
      variant: 'link',
    },
    {
      class: 'bg-transparent text-success hover:bg-success/12 dark:hover:bg-success/15',
      intent: 'success',
      variant: 'outline',
    },
    {
      class: 'bg-success/15 text-success hover:bg-success/25',
      intent: 'success',
      variant: 'secondary',
    },
    {
      class: 'bg-warning text-warning-foreground hover:bg-warning/90',
      intent: 'warning',
      variant: 'default',
    },
    {
      class: 'text-warning hover:bg-warning/12',
      intent: 'warning',
      variant: 'ghost',
    },
    {
      class: 'text-warning hover:bg-transparent',
      intent: 'warning',
      variant: 'link',
    },
    {
      class: 'bg-transparent text-warning hover:bg-warning/12 dark:hover:bg-warning/15',
      intent: 'warning',
      variant: 'outline',
    },
    {
      class: 'bg-warning/15 text-warning hover:bg-warning/25',
      intent: 'warning',
      variant: 'secondary',
    },
  ] satisfies Array<{
    intent: Exclude<ButtonIntent, 'default'>
    variant: ButtonVariant
    class: string
  }>,
  variants: {
    intent: {
      brand: 'bg-brand/15 text-brand border-brand focus-visible:ring-brand/30 hover:bg-brand/25',
      default: '',
      destructive: 'bg-destructive/15 text-destructive border-destructive focus-visible:ring-destructive/30 hover:bg-destructive/25',
      info: 'bg-info/15 text-info border-info focus-visible:ring-info/30 hover:bg-info/25',
      success: 'bg-success/15 text-success border-success focus-visible:ring-success/30 hover:bg-success/25',
      warning: 'bg-warning/15 text-warning border-warning focus-visible:ring-warning/30 hover:bg-warning/25',
    } satisfies Record<ButtonIntent, string>,
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
      link: 'bg-transparent text-primary underline underline-offset-4 hover:underline',
      outline: 'border bg-background text-foreground hover:bg-accent dark:hover:bg-input/50',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    } satisfies Record<ButtonVariant, string>,
  },
})
</script>

<template>
  <UiButton
    :variant="variant"
    :size="size"
    :type="type"
    :disabled="disabled || !!loading"
    :aria-busy="loading"
    :class="$cn(
      intentClassMap({ intent, variant }),
      block && 'w-full',
    )"
  >
    <template v-if="loading">
      <Spinner
        v-if="loading === true"
        class="inline-flex size-4 shrink-0"
        aria-hidden="true"
      />
      <AtomIcon
        v-else
        :icon="loading"
        class="inline-flex size-4 shrink-0"
        aria-hidden="true"
      />
    </template>

    <slot />
  </UiButton>
</template>
