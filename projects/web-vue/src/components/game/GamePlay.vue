<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk, { makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { useToast } from "primevue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { AvmSatoshiDiceClient } from "../../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";
import { useAppStore } from "../../stores/app";
import { IGameStruct, useGameStore } from "../../stores/game";
import AppButton from "../common/AppButton.vue";
import AppLoader from "../common/AppLoader.vue";
import Fireworks from "../effects/Fireworks.vue";
const toast = useToast();

const props = defineProps<{
  game: IGameStruct;
}>();

const appStore = useAppStore();
const emit = defineEmits(["play-complete"]);

const { activeAddress, transactionSigner } = useWallet();
onMounted(async () => {
  await appStore.updateBalance(props.game.token.id, props.game.token.type, activeAddress, transactionSigner);
});

const gameStore = useGameStore();
const state = reactive({
  depositAmount: 1000,
  winProbability: 50,
  isDepositing: false,
  isClaiming: false,
  gamePlayStep: 1, // 1: Setup, 2: Deposit, 3: Claim, 4: Result
  errorMessage: "",
});

const showFireworks = ref(false);

const tokenBalance = computed(() => {
  return appStore.getBalanceForToken(props.game.token.id);
});

const potentialWinAmount = computed(() => {
  const probabilityDecimal = state.winProbability / 100;
  return Math.floor(state.depositAmount / probabilityDecimal);
});
const potentialNetWinAmount = computed(() => {
  const probabilityDecimal = state.winProbability / 100;
  return Math.floor(state.depositAmount / probabilityDecimal) - state.depositAmount;
});

const probabilityPercentage = computed(() => {
  return state.winProbability.toFixed(4);
});
const probabilityIncludingWinRatioPercentage = computed(() => {
  return ((state.winProbability * Number(props.game.game.winRatio)) / 1000000).toFixed(4);
});

const maxPossibleWin = computed(() => {
  return Number(props.game.game.balance) / 10 ** props.game.token.decimals;
});

const canAffordBet = computed(() => {
  return state.depositAmount <= tokenBalance.value;
});

const canWinAmount = computed(() => {
  return potentialWinAmount.value <= maxPossibleWin.value;
});

const canPlay = computed(() => {
  return state.depositAmount > 0 && state.winProbability > 0 && state.winProbability <= 100 && canAffordBet.value && canWinAmount.value;
});

watch(
  () => state.winProbability,
  () => {
    state.errorMessage = "";
  },
);

watch(
  () => state.depositAmount,
  () => {
    state.errorMessage = "";
  },
);

const validatePlayability = () => {
  if (!canAffordBet.value) {
    state.errorMessage = "Insufficient token balance for this bet";
    return false;
  }

  if (!canWinAmount.value) {
    state.errorMessage = "Potential win amount exceeds game balance";
    return false;
  }

  if (state.depositAmount <= 0) {
    state.errorMessage = "Deposit amount must be greater than 0";
    return false;
  }

  if (state.winProbability <= 0 || state.winProbability > 100) {
    state.errorMessage = "Win probability must be between 0 and 100";
    return false;
  }

  return true;
};

const startPlay = async () => {
  try {
    if (!validatePlayability()) return;
    state.errorMessage = "";
    state.gamePlayStep = 2;

    // Create game play record
    if (!activeAddress.value) throw Error("Active Address is missing");
    state.isDepositing = true;

    const client = new AvmSatoshiDiceClient({
      algorand: appStore.getAlgorandClient(),
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });
    if (props.game.token.type == "native") {
      await client.send.startGameWithNativeToken({
        args: {
          game: props.game.idObj,
          txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
            amount: BigInt(state.depositAmount * 10 ** props.game.token.decimals),
            receiver: algosdk.encodeAddress(client.appAddress.publicKey),
            sender: activeAddress.value,
            suggestedParams: await client.algorand.client.algod.getTransactionParams().do(),
          }),
          winProbability: BigInt(state.winProbability * 10000),
        },
      });
    }

    // do the deposit
    state.isDepositing = false;
    state.gamePlayStep = 3;
  } catch (e: any) {
    state.isDepositing = false;
    state.gamePlayStep = 3;
    console.error(e);
    state.errorMessage = e.message;
    toast.add({
      severity: "error",
      detail: e.message ?? e,
      life: 10000,
    });
  }
};

const handleDeposit = () => {
  if (!gameStore.currentGamePlay) return;

  state.isDepositing = true;
  // do the deposit
  state.isDepositing = false;
};

const handleClaim = () => {
  if (!gameStore.currentGamePlay) return;

  state.isClaiming = true;

  state.isClaiming = false;
};

const resetGame = () => {
  state.depositAmount = 1000;
  state.winProbability = 50;
  state.gamePlayStep = 1;
  showFireworks.value = false;
  state.errorMessage = "";
  emit("play-complete");
};
</script>

<template>
  <div>
    <Fireworks :active="showFireworks" intensity="high" :duration="6000" />

    <MainPanel>
      <div class="bg-gradient-to-r from-primary-900 to-background-dark p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">Play: {{ game.token.name }} game</h3>

        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <span v-if="game.token.name" class="w-5 h-5 rounded-full bg-gray-700 mr-1 flex items-center justify-center text-xs font-bold">
              {{ game.token.name.substring(0, 1) }}
            </span>
            <span class="text-sm font-medium text-gray-300">{{ game.token.unitName }}</span>
          </div>

          <div class="px-2 py-0.5 bg-primary-800 text-primary-300 rounded-full text-xs font-medium">
            {{ (Number(game.game.winRatio) / 10000).toLocaleString() }}% Win Ratio
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Step 1: Setup -->
        <div v-if="state.gamePlayStep === 1" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label" for="state.depositAmount">Deposit Amount ({{ game.token.unitName }})</label>
              <div class="flex items-center">
                <input
                  id="state.depositAmount"
                  v-model.number="state.depositAmount"
                  type="number"
                  min="0"
                  step="1"
                  class="input flex-1"
                  :class="{ 'border-error-500': !canAffordBet }"
                />
              </div>
              <div class="mt-1 text-sm text-gray-400">
                Your balance: {{ (Number(tokenBalance) / 10 ** game.token.decimals).toLocaleString() }} {{ appStore.state.tokenName }}
              </div>
              <div v-if="!canAffordBet" class="mt-1 text-sm text-error-500">Insufficient balance</div>
            </div>
            <div>
              <label class="label" for="winProbability">Win probability (%)</label>
              <div class="flex items-center">
                <input
                  id="winProbability"
                  v-model.number="state.winProbability"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  max="100"
                  class="input flex-1"
                  :class="{ 'border-error-500': !canWinAmount }"
                />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label class="label" for="winProbability">Game win Probability ({{ probabilityIncludingWinRatioPercentage }}%)</label>
              <input
                id="winProbability"
                v-model.number="state.winProbability"
                type="range"
                min="0.0001"
                step="0.0001"
                max="100"
                class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
              />
              <div class="flex justify-between text-gray-400 text-xs mt-1">
                <span>0.0001%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div class="bg-background-dark rounded-lg p-4 space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Win:</span>
              <span :class="['font-semibold text-lg', canWinAmount ? 'text-success-400' : 'text-error-500']">
                {{ potentialWinAmount.toLocaleString() }} {{ game.token.unitName }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Net Win:</span>
              <span> {{ potentialNetWinAmount.toLocaleString() }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Game Balance:</span>
              <span class="font-semibold text-white">
                {{ (Number(game.game.balance) / 10 ** game.token.decimals).toLocaleString() }} {{ game.token.unitName }}
              </span>
            </div>

            <div v-if="!canWinAmount" class="text-sm text-error-500">
              Potential win amount exceeds game balance. Adjust your bet or probability.
            </div>
          </div>

          <div v-if="state.errorMessage" class="bg-error-900 border border-error-600 text-error-200 p-3 rounded-lg">
            {{ state.errorMessage }}
          </div>

          <div class="flex justify-end">
            <AppButton @click="startPlay" variant="primary" :disabled="!canPlay"> Start game </AppButton>
          </div>
        </div>

        <!-- Step 2: Deposit -->
        <div v-else-if="state.gamePlayStep === 2" class="text-center py-6 space-y-6">
          <div class="mb-6">
            <div class="text-xl font-medium text-white mb-2">Deposit Tokens</div>
            <p class="text-gray-400">Deposit {{ state.depositAmount }} {{ game.token.unitName }} tokens to start the game.</p>
            <p class="text-red-400">Check your wallet to sign the transaction.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white"> {{ state.depositAmount }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ probabilityIncludingWinRatioPercentage }}% </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Potential Win:</span>
              <span class="font-semibold text-success-400"> {{ potentialWinAmount.toLocaleString() }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Net Win:</span>
              <span class="font-semibold text-white"> {{ potentialNetWinAmount.toLocaleString() }} {{ game.token.unitName }} </span>
            </div>
          </div>

          <div>
            <AppButton @click="state.gamePlayStep = 1" variant="primary" :disabled="state.isDepositing" class="px-8"> Cancel </AppButton>
          </div>
        </div>

        <!-- Step 3: Claim -->
        <div v-else-if="state.gamePlayStep === 3" class="text-center py-6 space-y-6">
          <div class="mb-6">
            <div class="text-xl font-medium text-white mb-2">Claim Winnings</div>
            <p class="text-gray-400">Try your luck! Click the button below to see if you've won.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white"> {{ state.depositAmount }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ probabilityPercentage }}% </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Win:</span>
              <span class="font-semibold text-success-400"> {{ potentialWinAmount.toLocaleString() }} {{ game.token.unitName }} </span>
            </div>
          </div>

          <div>
            <AppButton @click="handleClaim" variant="accent" :disabled="state.isClaiming" class="px-8">
              <AppLoader v-if="state.isClaiming" size="sm" color="white" class="mr-2" />
              {{ state.isClaiming ? "Processing..." : "Claim Now" }}
            </AppButton>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-else-if="state.gamePlayStep === 4" class="text-center py-6 space-y-6">
          <div
            v-if="gameStore.currentGamePlay?.isWin"
            class="mb-6 bg-success-900 rounded-xl p-6 border border-success-700 neon-border-success"
          >
            <div class="text-2xl font-bold text-white mb-2">🎉 Congratulations! 🎉</div>
            <p class="text-success-300 text-lg">
              You won {{ gameStore.currentGamePlay?.winAmount?.toLocaleString() }} {{ game.token.unitName }}!
            </p>
          </div>

          <div v-else class="mb-6 bg-background-dark rounded-xl p-6 border border-gray-700">
            <div class="text-xl font-medium text-white mb-2">Better luck next time!</div>
            <p class="text-gray-400">You didn't win this round. Try again with a different bet or probability.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white"> {{ state.depositAmount }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ probabilityPercentage }}% </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Outcome:</span>
              <span :class="['font-semibold', gameStore.currentGamePlay?.isWin ? 'text-success-400' : 'text-error-400']">
                {{ gameStore.currentGamePlay?.isWin ? "Win" : "Loss" }}
              </span>
            </div>
          </div>

          <div class="flex justify-center space-x-4">
            <AppButton @click="resetGame" variant="outline"> Back to Game </AppButton>

            <AppButton @click="state.gamePlayStep = 1" variant="primary"> Play Again </AppButton>
          </div>
        </div>
      </div>
    </MainPanel>
  </div>
</template>
