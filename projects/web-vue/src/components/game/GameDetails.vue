<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../../stores/app";
import type { Game } from "../../types";
import AppButton from "../common/AppButton.vue";
const { activeAddress } = useWallet();
const props = defineProps<{
  game: Game;
}>();

const router = useRouter();
const appStore = useAppStore();

const isGameCreator = computed(() => {
  return activeAddress.value === props.game.creator;
});

const formattedWinRatio = computed(() => {
  return `${props.game.winRatio}%`;
});

const formattedBalance = computed(() => {
  return props.game.balance.toLocaleString();
});

const formattedLastPlayTime = computed(() => {
  if (!props.game.lastPlayTime) return "Never played";
  return new Date(props.game.lastPlayTime).toLocaleString();
});

const formattedLastWinTime = computed(() => {
  if (!props.game.lastWinTime) return "No wins yet";
  return new Date(props.game.lastWinTime).toLocaleString();
});

const formattedBiggestWinTime = computed(() => {
  if (!props.game.biggestWin) return "No wins yet";
  return new Date(props.game.biggestWin.time).toLocaleString();
});

const formattedBiggestWinAmount = computed(() => {
  if (!props.game.biggestWin) return "0";
  return props.game.biggestWin.amount.toLocaleString();
});

const playGame = () => {
  router.push(`/game/${props.game.id}/play`);
};
</script>

<template>
  <div class="card border border-gray-800">
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">{{ game.name }}</h2>

        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <img v-if="game.token.logoUrl" :src="game.token.logoUrl" :alt="game.token.name" class="w-6 h-6 rounded-full" />
            <span v-else class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
              {{ game.token.symbol.substring(0, 1) }}
            </span>
            <span class="font-medium text-gray-300">{{ game.token.symbol }}</span>
          </div>

          <div class="px-3 py-1 bg-primary-900 text-primary-300 rounded-full text-sm font-medium">Win Ratio: {{ formattedWinRatio }}</div>
        </div>
      </div>

      <p v-if="game.description" class="text-gray-400 mb-6">{{ game.description }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Game Statistics</h3>

          <div class="bg-background-dark rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Balance:</span>
              <span class="font-semibold text-white">{{ formattedBalance }} {{ game.token.symbol }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Bet Range:</span>
              <span class="font-semibold text-white">
                {{ game.minBet?.toLocaleString() || "0" }} - {{ game.maxBet?.toLocaleString() || "∞" }} {{ game.token.symbol }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Created By:</span>
              <span class="font-semibold text-white">
                {{ game.creator.substring(0, 6) + "..." + game.creator.substring(game.creator.length - 4) }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Created At:</span>
              <span class="font-semibold text-white">{{ new Date(game.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Activity</h3>

          <div class="bg-background-dark rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Last Played:</span>
              <span class="font-semibold text-white">{{ formattedLastPlayTime }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Last Win:</span>
              <span class="font-semibold text-white">{{ formattedLastWinTime }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Biggest Win:</span>
              <span class="font-semibold text-white">{{ formattedBiggestWinAmount }} {{ game.token.symbol }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Biggest Win Time:</span>
              <span class="font-semibold text-white">{{ formattedBiggestWinTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-4">
        <AppButton v-if="isGameCreator" variant="outline"> Manage Game </AppButton>

        <AppButton @click="playGame" variant="primary"> Play Game </AppButton>
      </div>
    </div>
  </div>
</template>
