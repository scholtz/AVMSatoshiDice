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

const formattedWinUpToBalance = computed(() => {
  return (Number(props.game.game.balance / 2n) / 10 ** Number(props.game.token.decimals)).toLocaleString();
});

const formattedWinRatio = computed(() => {
  return `${Number(props.game.game.winRatio) / 1000000}%`;
});

const lastPlayedFormatted = computed(() => {
  if (!props.game.game.lastPlayTime) return "Never played";
  return new Date(Number(props.game.game.lastPlayTime * 1000n)).toLocaleString();
});

const viewGameDetails = () => {
  router.push(`/game/${props.game.chain}/${props.game.id}`);
};

const playGame = () => {
  router.push(`/game/${props.game.chain}/${props.game.id}/play`);
};
</script>

<template>
  <div ref="gameCardRef" class="card border border-gray-800 hover:border-primary-600 transition-all duration-300 group" v-motion>
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-white group-hover:text-primary-400 transition-colors">{{ game.token.name }}</h3>

        <div class="flex items-center space-x-2">
          <div class="px-2 py-1 bg-primary-900 text-primary-300 rounded-full text-xs font-medium">
            {{ formattedWinRatio }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-background-dark p-3 rounded-lg">
          <div class="text-gray-400 text-xs mb-1">Win Up To</div>
          <div class="font-semibold text-white">{{ formattedWinUpToBalance }} {{ game.token.unitName }}</div>
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
