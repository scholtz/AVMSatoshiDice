<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
}>();
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled"
    :class="[
      'btn',
      variant ? `btn-${variant}` : 'btn-primary',
      size === 'sm' ? 'px-2 py-1 text-sm' : size === 'lg' ? 'px-6 py-3 text-lg' : '',
      block ? 'w-full' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    ]"
  >
    <slot></slot>
  </button>
</template>