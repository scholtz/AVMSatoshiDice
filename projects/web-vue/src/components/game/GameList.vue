<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import { computed, onMounted, reactive } from "vue";
import { useAppStore } from "../../stores/app";
import { useGameStore } from "../../stores/game";
import AppLoader from "../common/AppLoader.vue";
import GameCard from "./GameCard.vue";

const appStore = useAppStore();
const gameStore = useGameStore();
const state = reactive({
  isLoading: false,
});

const { activeAddress, transactionSigner } = useWallet();
onMounted(async () => {
  console.log("gamelist onmounted");
  if (!activeAddress.value) return;
});
const tokens = computed(() => {
  return gameStore.tokens;
});

const filteredGames = computed(() => {
  return gameStore.filteredGames;
});

const handleTokenFilter = (tokenId: bigint | null) => {
  gameStore.setTokenFilter(tokenId);
};

// Simulate loading
state.isLoading = true;
setTimeout(() => {
  state.isLoading = false;
}, 1000);
</script>

<template>
  <div class="w-full">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-white">Available Games</h2>

      <div class="flex items-center space-x-2">
        <button
          @click="handleTokenFilter(null)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            gameStore.selectedTokenFilter === null ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
          ]"
        >
          All Tokens
        </button>

        <button
          v-for="token in tokens"
          :key="token.id.toString()"
          @click="handleTokenFilter(token.id)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center',
            gameStore.selectedTokenFilter === token.id ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
          ]"
        >
          <span v-if="token.name" class="w-4 h-4 rounded-full bg-gray-700 mr-1 flex items-center justify-center text-xs font-bold">
            {{ token.name.substring(0, 1) }}
          </span>
          {{ token.unitName }}
        </button>
      </div>
    </div>

    <div v-if="state.isLoading" class="flex justify-center py-12">
      <AppLoader size="lg" color="primary" />
    </div>

    <MainPanel v-else-if="filteredGames.length === 0" class="p-8 text-center">
      <div class="text-gray-400 mb-2">No games found</div>
      <p class="text-gray-500">Try selecting a different token filter or check back later.</p>
    </MainPanel>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <GameCard v-for="game in filteredGames" :key="game.id" :game="game" />
    </div>
  </div>
</template>
