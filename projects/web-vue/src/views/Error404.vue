<script setup lang="ts">
import H1 from "../components/H1.vue";
import MainButton from "../components/MainButton.vue";
import MainPanel from "../components/MainPanel.vue";
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <MainPanel class="w-200 text-white">
      <H1>404 Error</H1>
      <p class="my-4">We are trying to provide you with the page, however some error has occured and we could not find it.</p>
      <RouterLink to="/">
        <MainButton>Go home</MainButton>
      </RouterLink>
    </MainPanel>
  </div>
</template>
