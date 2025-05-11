<script setup lang="ts">
import { useMotion } from "@vueuse/motion";
import { ref, Ref } from "vue";
import GameList from "../components/game/GameList.vue";

const heroRef: Ref<HTMLElement | null> = ref(null);

useMotion(heroRef, {
  initial: {
    opacity: 0,
    y: 40,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 600,
    },
  },
});
</script>

<template>
  <div class="w-full">
    <div ref="heroRef" class="mb-12 text-center" v-motion>
      <h1
        class="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 text-transparent bg-clip-text"
      >
        AVM Satoshi Dice
      </h1>
      <p class="text-xl text-gray-300 max-w-3xl mx-auto">
        Play proovable fair random onchain games for a chance to win big with your favorite tokens.
      </p>
    </div>

    <GameList />
  </div>
</template>
