<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppButton from "../components/common/AppButton.vue";
import AppLoader from "../components/common/AppLoader.vue";
import GameDetails from "../components/game/GameDetails.vue";
import { useAppStore } from "../stores/app";
import { useGameStore } from "../stores/game";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const gameStore = useGameStore();

const isLoading = ref(true);
const gameId = route.params.id as string;
const chainId = route.params.chain as
  | "mainnet-v1.0"
  | "aramidmain-v1.0"
  | "testnet-v1.0"
  | "betanet-v1.0"
  | "voimain-v1.0"
  | "fnet-v1"
  | "dockernet-v1";

const { activeAddress, transactionSigner } = useWallet();
onMounted(async () => {
  console.log("gamelist onmounted");
  if (activeAddress.value) {
    const clients = appStore.getAppClients(activeAddress.value, transactionSigner);
    await gameStore.loadGames(clients);
  } else {
    const account = algosdk.generateAccount();
    const address = algosdk.encodeAddress(account.addr.publicKey);
    const clients = appStore.getAppClients(address, transactionSigner);
    await gameStore.loadGames(clients);
  }
  gameStore.setCurrentGame(gameId, chainId);
  console.log("gamelist onmounted done");
  isLoading.value = false;
});
</script>

<template>
  <div class="w-full">
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
