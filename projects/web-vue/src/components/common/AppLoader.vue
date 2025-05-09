<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'accent' | 'white'
}>();
</script>

<template>
  <div class="flex justify-center items-center">
    <div
      :class="[
        'animate-spin rounded-full border-t-2 border-b-2 border-transparent',
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6',
        color === 'secondary' ? 'border-t-secondary-500 border-r-secondary-500' :
        color === 'accent' ? 'border-t-accent-500 border-r-accent-500' :
        color === 'white' ? 'border-t-white border-r-white' : 'border-t-primary-500 border-r-primary-500'
      ]"
    ></div>
  </div>
</template>