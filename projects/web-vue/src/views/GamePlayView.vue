<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AvmSatoshiDiceClient } from "../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";
import AuthScreen from "../components/AuthScreen.vue";
import AppButton from "../components/common/AppButton.vue";
import AppLoader from "../components/common/AppLoader.vue";
import GamePlay from "../components/game/GamePlay.vue";
import { useAppStore } from "../stores/app";
import { useGameStore } from "../stores/game";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const gameStore = useGameStore();

const isLoading = ref(true);
const gameId = route.params.id as string;
const { activeAddress, transactionSigner } = useWallet();

onMounted(async () => {
  console.log("gamelist onmounted");
  if (!activeAddress.value) return;
  const client = new AvmSatoshiDiceClient({
    algorand: appStore.getAlgorandClient(),
    appId: appStore.state.appId,
    defaultSender: algosdk.decodeAddress(activeAddress.value),
    defaultSigner: transactionSigner,
  });
  await gameStore.loadGames(client);

  gameStore.setCurrentGame(gameId);
  console.log("gamelist onmounted done");
  isLoading.value = false;
});

const handlePlayComplete = () => {
  router.push(`/game/${gameId}`);
};
</script>

<template>
  <AuthScreen>
    <div v-if="isLoading" class="flex justify-center py-12">
      <AppLoader size="lg" color="primary" />
    </div>

    <div v-else-if="!gameStore.currentGame" class="card p-6 text-center">
      <div class="text-xl font-medium text-white mb-2">Game Not Found</div>
      <p class="text-gray-400 mb-6">The game you're looking for doesn't exist or has been removed.</p>
      <AppButton @click="router.push('/')" variant="primary"> Back to Games </AppButton>
    </div>

    <GamePlay v-else :game="gameStore.currentGame" @play-complete="handlePlayComplete" class="w-full" />
  </AuthScreen>
</template>
