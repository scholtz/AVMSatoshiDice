<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { AvmSatoshiDiceClient } from "../../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";
import { useAppStore } from "../../stores/app";
import { IGameStruct, useGameStore } from "../../stores/game";
import AppButton from "../common/AppButton.vue";
const props = defineProps<{
  game: IGameStruct;
}>();

const router = useRouter();
const appStore = useAppStore();
const gameStore = useGameStore();

onMounted(async () => {
  await checkCurrentGameState();
});
const { activeAddress, transactionSigner } = useWallet();
const checkCurrentGameState = async () => {
  try {
    if (!activeAddress.value) return;
    const client = new AvmSatoshiDiceClient({
      algorand: appStore.getAlgorandClient(),
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });

    const play = await client.myGame({ args: {} });
    if (play) {
      gameStore.setLastGamePlay(play);
    }
  } catch (e: any) {
    console.error(e);
  }
};
const isGameCreator = computed(() => {
  return activeAddress.value === props.game.idObj.owner;
});
const isLatestGame = computed(() => {
  if (!gameStore.currentGamePlay) return false;
  return gameStore.currentGamePlay.owner == props.game.idObj.owner && gameStore.currentGamePlay.assetId == props.game.idObj.assetId;
});

const formattedWinRatio = computed(() => {
  return `${Number(props.game.game.winRatio) / 10_000}%`;
});

const formattedBalance = computed(() => {
  return (Number(props.game.game.balance) / 10 ** Number(props.game.token.decimals)).toLocaleString();
});

const formattedLastPlayTime = computed(() => {
  if (!props.game.game.lastPlayedTime) return "Never played";
  return new Date(Number(props.game.game.lastPlayedTime * 1000n)).toLocaleString();
});

const formattedLastWinTime = computed(() => {
  if (!props.game.game.lastWinTime) return "No wins yet";
  return new Date(Number(props.game.game.lastWinTime * 1000n)).toLocaleString();
});

const formattedBiggestWinTime = computed(() => {
  if (!props.game.game.biggestWinTime) return "No wins yet";
  return new Date(Number(props.game.game.biggestWinTime * 1000n)).toLocaleString();
});

const formattedBiggestWinAmount = computed(() => {
  if (!props.game.game.biggestWinAmount) return "0";
  return (Number(props.game.game.biggestWinAmount) / 10 ** Number(props.game.token.decimals)).toLocaleString();
});

const playGame = () => {
  router.push(`/game/${props.game.id}/play`);
};

const goToLastGameOverviewClick = () => {
  router.push(`/game/${props.game.id}/overview`);
};
</script>

<template>
  <MainPanel>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white">{{ game.token.name }} game</h2>

        <div class="flex items-center space-x-3">
          <div class="px-3 py-1 bg-primary-900 text-primary-300 rounded-full text-sm font-medium">Win Ratio: {{ formattedWinRatio }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Game Statistics</h3>

          <div class="bg-background-dark rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Balance:</span>
              <span class="font-semibold text-white">{{ formattedBalance }} {{ game.token.unitName }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Created By:</span>
              <span class="font-semibold text-white"><Abbr :text="game.idObj.owner"></Abbr> </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Created At:</span>
              <span class="font-semibold text-white">{{ new Date(Number(game.game.createdAtTime * 1000n)).toLocaleDateString() }}</span>
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
              <span class="font-semibold text-white">{{ formattedBiggestWinAmount }} {{ game.token.unitName }}</span>
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
        <AppButton v-if="isLatestGame" variant="outline" @click="goToLastGameOverviewClick"> Last game overview </AppButton>

        <AppButton @click="playGame" variant="primary"> Play Game </AppButton>
      </div>
    </div>
  </MainPanel>
</template>
