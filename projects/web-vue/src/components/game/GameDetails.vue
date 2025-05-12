<script setup lang="ts">
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { AvmSatoshiDiceClient } from "avm-satoshi-dice";
import { useToast } from "primevue";
import { computed, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../../stores/app";
import { IGameStruct, useGameStore } from "../../stores/game";
import AppButton from "../common/AppButton.vue";
const props = defineProps<{
  game: IGameStruct;
}>();

const toast = useToast();
const router = useRouter();
const appStore = useAppStore();
const gameStore = useGameStore();
const state = reactive({
  amount: 0,
  toSign: false,
  transfering: false,
});
onMounted(async () => {
  await checkCurrentGameState();
});
const { activeAddress, transactionSigner } = useWallet();
const checkCurrentGameState = async () => {
  try {
    if (!activeAddress.value) return;
    const client = new AvmSatoshiDiceClient({
      algorand: appStore.getAlgorandClient(props.game.chain),
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });

    const play = await client.myGame({ args: {} });
    if (play) {
      gameStore.setLastGamePlay(play);
    }
  } catch (e: any) {
    console.error("error in checkCurrentGameState", props.game.chain, e);
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

const formattedLastPlayAmount = computed(() => {
  if (!props.game.game.lastWinAmount) return "0";
  return (Number(props.game.game.lastPlayAmount) / 10 ** Number(props.game.token.decimals)).toLocaleString();
});

const formattedLastPlayTime = computed(() => {
  if (!props.game.game.lastPlayTime) return "Never played";
  return new Date(Number(props.game.game.lastPlayTime * 1000n)).toLocaleString();
});
const formattedLastWinAmount = computed(() => {
  if (!props.game.game.lastWinAmount) return "0";
  return (Number(props.game.game.lastWinAmount) / 10 ** Number(props.game.token.decimals)).toLocaleString();
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
  router.push(`/game/${props.game.chain}/${props.game.id}/play`);
};

const goToLastGameOverviewClick = () => {
  router.push(`/game/${props.game.chain}/${props.game.id}/overview`);
};

const handleWithdraw = async () => {
  try {
    if (!activeAddress.value) throw Error("Address not selected");
    state.toSign = true;
    const algorandClient = appStore.getAlgorandClient(props.game.chain);
    const client = new AvmSatoshiDiceClient({
      algorand: algorandClient,
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });
    console.log("client", client, client.appId, algosdk.encodeAddress(client.appAddress.publicKey), activeAddress.value);
    const amountUint = BigInt(state.amount * 10 ** appStore.state.assetDecimals);
    console.log("executing native withdrawal");
    await client.send.withdraw({
      args: {
        amount: amountUint,
        assetId: props.game.token.id,
        isArc200Token: props.game.token.type == "arc200",
        receiver: activeAddress.value,
      },
      staticFee: AlgoAmount.MicroAlgo(2000),
    });
    console.log("executing native withdrawal done");

    toast.add({
      severity: "info",
      detail: "Withdraw successful",
      life: 10000,
    });

    const updatedGame = await client.game({
      args: {
        assetId: props.game.idObj.assetId,
        creator: props.game.idObj.owner,
      },
    });
    props.game.game = updatedGame;
    await gameStore.updateGame({
      id: props.game.id,
      game: updatedGame,
      idObj: props.game.idObj,
      token: props.game.token,
      chain: props.game.chain,
    });

    state.toSign = false;
  } catch (e: any) {
    state.toSign = false;
    console.error(e);

    toast.add({
      severity: "error",
      detail: e.message ?? e,
      life: 10000,
    });
  }
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
              <span class="text-gray-400">Blockchain:</span>
              <span class="font-semibold text-white">{{ game.chain }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Token type:</span>
              <span class="font-semibold text-white">{{ appStore.tokenTypeToText(game.token.type) }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Created By:</span>
              <span class="font-semibold text-white"><AbbrText :text="game.idObj.owner"></AbbrText> </span>
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
              <span class="text-gray-400">Last Play Deposit:</span>
              <span class="font-semibold text-white">{{ formattedLastPlayAmount }} {{ game.token.unitName }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Last Win Time:</span>
              <span class="font-semibold text-white">{{ formattedLastWinTime }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Last Net Win:</span>
              <span class="font-semibold text-white">{{ formattedLastWinAmount }} {{ game.token.unitName }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Biggest Net Win Time:</span>
              <span class="font-semibold text-white">{{ formattedBiggestWinTime }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Biggest Net Win:</span>
              <span class="font-semibold text-white">{{ formattedBiggestWinAmount }} {{ game.token.unitName }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1gap-6 mb-8" v-if="isGameCreator">
        <div>
          <h3 class="text-lg font-semibold text-white mb-4">Manage Game</h3>
          <p class="my-2">
            As game creator you can deposit or withdraw funds from this game. When withdrawing when you set the amount to 0, it will
            withdraw all available funds. The protocol withdrawl fee 2.5% applies. To deposit more funds please go to create game where you
            select the same token and you have option to change also the win ratio.
          </p>
          <div class="bg-background-dark rounded-lg p-4 space-y-4">
            <form @submit.prevent="handleWithdraw" class="space-y-6">
              <div>
                <label class="label" for="amount">Amount</label>
                <input
                  id="amount"
                  v-model="state.amount"
                  type="number"
                  class="input w-full"
                  placeholder="Enter a asset id for your game"
                  required
                />
              </div>
              <AppButton type="submit" variant="primary" :disabled="state.transfering || state.toSign">
                <AppLoader v-if="state.transfering || state.toSign" size="sm" color="white" class="mr-2" />
                Withdraw
              </AppButton>
            </form>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-4">
        <AppButton v-if="isLatestGame" variant="outline" @click="goToLastGameOverviewClick"> Your last game overview </AppButton>

        <AppButton @click="playGame" variant="primary"> Play Game </AppButton>
      </div>
    </div>
  </MainPanel>
</template>
