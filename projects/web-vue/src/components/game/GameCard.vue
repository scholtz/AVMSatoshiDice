<script setup lang="ts">
import { useMotion } from "@vueuse/motion";
import { computed, ref, Ref } from "vue";
import { useRouter } from "vue-router";
import { IGameStruct } from "../../stores/game";
import AppButton from "../common/AppButton.vue";

const props = defineProps<{
  game: IGameStruct;
}>();

const router = useRouter();

const gameCardRef: Ref<HTMLElement | null> = ref(null);
useMotion(gameCardRef, {
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 400,
      delay: 100,
    },
  },
});

const formattedBalance = computed(() => {
  return props.game.game.balance.toLocaleString();
});

const formattedWinRatio = computed(() => {
  return `${props.game.game.winRatio}%`;
});

const lastPlayedFormatted = computed(() => {
  if (!props.game.game.lastPlayedTime) return "Never played";
  return new Date(Number(props.game.game.lastPlayedTime)).toLocaleString();
});

const viewGameDetails = () => {
  router.push(`/game/${props.game.id}`);
};

const playGame = () => {
  router.push(`/game/${props.game.id}/play`);
};
</script>

<template>
  <div ref="gameCardRef" class="card border border-gray-800 hover:border-primary-600 transition-all duration-300 group" v-motion>
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors">Game</h3>

        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <img v-if="game.token.logoUrl" :src="game.token.logoUrl" :alt="game.token.name" class="w-6 h-6 rounded-full mr-1" />
            <span v-else class="w-6 h-6 rounded-full bg-gray-700 mr-1 flex items-center justify-center text-xs font-bold">
              {{ game.token.symbol.substring(0, 1) }}
            </span>
            <span class="text-sm font-medium text-gray-300">{{ game.token.symbol }}</span>
          </div>

          <div class="px-2 py-1 bg-primary-900 text-primary-300 rounded-full text-xs font-medium">
            {{ formattedWinRatio }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-background-dark p-3 rounded-lg">
          <div class="text-gray-400 text-xs mb-1">Balance</div>
          <div class="font-semibold text-white">{{ formattedBalance }} {{ game.token.symbol }}</div>
        </div>

        <div class="bg-background-dark p-3 rounded-lg">
          <div class="text-gray-400 text-xs mb-1">Last Played</div>
          <div class="font-semibold text-white text-sm">{{ lastPlayedFormatted }}</div>
        </div>
      </div>

      <div class="flex space-x-3">
        <AppButton @click="viewGameDetails" variant="outline" class="flex-1"> Details </AppButton>

        <AppButton @click="playGame" variant="primary" class="flex-1"> Play </AppButton>
      </div>
    </div>
  </div>
</template>
