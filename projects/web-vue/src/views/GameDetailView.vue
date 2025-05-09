<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppButton from "../components/common/AppButton.vue";
import AppLoader from "../components/common/AppLoader.vue";
import GameDetails from "../components/game/GameDetails.vue";
import { useGameStore } from "../stores/game";

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const isLoading = ref(true);
const gameId = route.params.id as string;

onMounted(() => {
  // Simulate API loading
  setTimeout(() => {
    gameStore.setCurrentGame(gameId);
    isLoading.value = false;

    // If game not found, redirect to home
    if (!gameStore.currentGame) {
      router.push("/");
    }
  }, 1000);
});

const playGame = () => {
  router.push(`/game/${gameId}/play`);
};
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <AppButton @click="router.push('/')" variant="outline" class="px-3 py-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path
              fill-rule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clip-rule="evenodd"
            />
          </svg>
        </AppButton>
        <h1 class="text-2xl font-bold text-white">Game Details</h1>
      </div>

      <AppButton v-if="gameStore.currentGame" @click="playGame" variant="primary"> Play Now </AppButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <AppLoader size="lg" color="primary" />
    </div>

    <div v-else-if="!gameStore.currentGame" class="card p-6 text-center">
      <div class="text-xl font-medium text-white mb-2">Game Not Found</div>
      <p class="text-gray-400 mb-6">The game you're looking for doesn't exist or has been removed.</p>
      <AppButton @click="router.push('/')" variant="primary"> Back to Games </AppButton>
    </div>

    <GameDetails v-else :game="gameStore.currentGame" />
  </div>
</template>
