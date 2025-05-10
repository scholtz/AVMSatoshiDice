<script setup lang="ts">
import Toast from "primevue/toast";
import { RouterView } from "vue-router";
import { Gradient } from "whatamesh";
import NavBar from "./components/common/NavBar.vue";

import { onMounted } from "vue";

let gradient = new Gradient();
onMounted(() => {
  console.log("gradient init");
  gradient.initGradient("#gradient-canvas");
  console.log("gradient done");
});
</script>

<template>
  <canvas id="gradient-canvas" data-transition-in />
  <Toast />
  <div class="min-h-full flex flex-col items-center justify-center w-full">
    <NavBar />
    <main class="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-grow-1 grow w-full">
      <RouterView />
    </main>
  </div>
</template>
<style>
#gradient-canvas {
  width: 100%;
  height: 100%;
  --gradient-color-1: #6a77e8;
  --gradient-color-2: #032e46;
  --gradient-color-3: #222;
  --gradient-color-4: #0f595e;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -10000;
}
</style>
