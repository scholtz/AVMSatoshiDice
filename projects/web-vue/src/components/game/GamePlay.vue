<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAppStore } from "../../stores/app";
import { useGameStore } from "../../stores/game";
import type { Game } from "../../types";
import AppButton from "../common/AppButton.vue";
import AppLoader from "../common/AppLoader.vue";
import Fireworks from "../effects/Fireworks.vue";

const props = defineProps<{
  game: Game;
  maxWinAmount?: number;
}>();

const appStore = useAppStore();
const emit = defineEmits(["play-complete"]);

const gameStore = useGameStore();

const betAmount = ref(props.game.minBet || 1);
const winProbability = ref(500000); // Default 50%
const showFireworks = ref(false);
const isDepositing = ref(false);
const isClaiming = ref(false);
const gamePlayStep = ref(1); // 1: Setup, 2: Deposit, 3: Claim, 4: Result
const errorMessage = ref("");
const maxBetAmount = computed(() => props.game.maxBet || Infinity);

const tokenBalance = computed(() => {
  return appStore.getBalanceForToken(props.game.token.id);
});

const potentialWinAmount = computed(() => {
  const probabilityDecimal = winProbability.value / 1000000;
  return Math.floor(betAmount.value / probabilityDecimal);
});

const probabilityPercentage = computed(() => {
  return (winProbability.value / 10000).toFixed(2);
});

const maxPossibleWin = computed(() => {
  return props.maxWinAmount || props.game.balance;
});

const canAffordBet = computed(() => {
  return betAmount.value <= tokenBalance.value;
});

const canWinAmount = computed(() => {
  return potentialWinAmount.value <= maxPossibleWin.value;
});

const canPlay = computed(() => {
  return (
    betAmount.value > 0 &&
    betAmount.value <= maxBetAmount.value &&
    winProbability.value > 0 &&
    winProbability.value <= 1000000 &&
    canAffordBet.value &&
    canWinAmount.value
  );
});

watch(winProbability, () => {
  errorMessage.value = "";
});

watch(betAmount, () => {
  errorMessage.value = "";
});

const validatePlayability = () => {
  if (!canAffordBet.value) {
    errorMessage.value = "Insufficient token balance for this bet";
    return false;
  }

  if (!canWinAmount.value) {
    errorMessage.value = "Potential win amount exceeds game balance";
    return false;
  }

  if (betAmount.value <= 0) {
    errorMessage.value = "Bet amount must be greater than 0";
    return false;
  }

  if (betAmount.value > maxBetAmount.value) {
    errorMessage.value = `Bet amount cannot exceed ${maxBetAmount.value}`;
    return false;
  }

  if (winProbability.value <= 0 || winProbability.value > 1000000) {
    errorMessage.value = "Win probability must be between 1 and 1,000,000";
    return false;
  }

  return true;
};

const startPlay = () => {
  if (!validatePlayability()) return;
  errorMessage.value = "";
  gamePlayStep.value = 2;

  // Create game play record
  gameStore.createGamePlay(props.game.id, betAmount.value, winProbability.value);
};

const handleDeposit = () => {
  if (!gameStore.currentGamePlay) return;

  isDepositing.value = true;

  // Simulate blockchain transaction
  setTimeout(() => {
    gameStore.depositToGamePlay();
    isDepositing.value = false;
    gamePlayStep.value = 3;
  }, 2000);
};

const handleClaim = () => {
  if (!gameStore.currentGamePlay) return;

  isClaiming.value = true;

  // Simulate blockchain transaction and random win/loss
  setTimeout(() => {
    const result = gameStore.claimGamePlayWinnings();
    isClaiming.value = false;
    gamePlayStep.value = 4;

    if (result?.isWin) {
      showFireworks.value = true;

      // Update user balance if won
      const currentBalance = getBalanceForToken(props.game.token.id);
      updateBalance(props.game.token.id);
    }
  }, 3000);
};

const resetGame = () => {
  betAmount.value = props.game.minBet || 1;
  winProbability.value = 500000;
  gamePlayStep.value = 1;
  showFireworks.value = false;
  errorMessage.value = "";
  emit("play-complete");
};

const getBalanceForToken = (tokenId: any) => {};
const updateBalance = (tokenId: any) => {};
</script>

<template>
  <div>
    <Fireworks :active="showFireworks" intensity="high" :duration="6000" />

    <div class="card border border-gray-800 overflow-hidden">
      <div class="bg-gradient-to-r from-primary-900 to-background-dark p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">Play: {{ game.name }}</h3>

        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <img v-if="game.token.logoUrl" :src="game.token.logoUrl" :alt="game.token.name" class="w-5 h-5 rounded-full mr-1" />
            <span v-else class="w-5 h-5 rounded-full bg-gray-700 mr-1 flex items-center justify-center text-xs font-bold">
              {{ game.token.symbol.substring(0, 1) }}
            </span>
            <span class="text-sm font-medium text-gray-300">{{ game.token.symbol }}</span>
          </div>

          <div class="px-2 py-0.5 bg-primary-800 text-primary-300 rounded-full text-xs font-medium">{{ game.winRatio }}% Win Ratio</div>
        </div>
      </div>

      <div class="p-6">
        <!-- Step 1: Setup -->
        <div v-if="gamePlayStep === 1" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label" for="betAmount">Bet Amount ({{ game.token.symbol }})</label>
              <div class="flex items-center">
                <input
                  id="betAmount"
                  v-model.number="betAmount"
                  type="number"
                  min="1"
                  :max="maxBetAmount"
                  step="1"
                  class="input flex-1"
                  :class="{ 'border-error-500': !canAffordBet || betAmount > maxBetAmount }"
                />
                <div class="ml-2 text-sm text-gray-400">Balance: {{ tokenBalance }} {{ game.token.symbol }}</div>
              </div>
              <div v-if="!canAffordBet" class="mt-1 text-sm text-error-500">Insufficient balance</div>
              <div v-if="betAmount > maxBetAmount" class="mt-1 text-sm text-error-500">
                Exceeds max bet of {{ maxBetAmount }} {{ game.token.symbol }}
              </div>
            </div>

            <div>
              <label class="label" for="winProbability">Win Probability ({{ probabilityPercentage }}%)</label>
              <input
                id="winProbability"
                v-model.number="winProbability"
                type="range"
                min="1"
                max="1000000"
                step="1000"
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
                {{ potentialWinAmount.toLocaleString() }} {{ game.token.symbol }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Game Balance:</span>
              <span class="font-semibold text-white"> {{ game.balance.toLocaleString() }} {{ game.token.symbol }} </span>
            </div>

            <div v-if="!canWinAmount" class="text-sm text-error-500">
              Potential win amount exceeds game balance. Adjust your bet or probability.
            </div>
          </div>

          <div v-if="errorMessage" class="bg-error-900 border border-error-600 text-error-200 p-3 rounded-lg">
            {{ errorMessage }}
          </div>

          <div class="flex justify-end">
            <AppButton @click="startPlay" variant="primary" :disabled="!canPlay"> Place Bet </AppButton>
          </div>
        </div>

        <!-- Step 2: Deposit -->
        <div v-else-if="gamePlayStep === 2" class="text-center py-6 space-y-6">
          <div class="mb-6">
            <div class="text-xl font-medium text-white mb-2">Deposit Tokens</div>
            <p class="text-gray-400">Deposit {{ betAmount }} {{ game.token.symbol }} tokens to start the game.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Bet Amount:</span>
              <span class="font-semibold text-white"> {{ betAmount }} {{ game.token.symbol }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ probabilityPercentage }}% </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Win:</span>
              <span class="font-semibold text-success-400"> {{ potentialWinAmount.toLocaleString() }} {{ game.token.symbol }} </span>
            </div>
          </div>

          <div>
            <AppButton @click="handleDeposit" variant="primary" :disabled="isDepositing" class="px-8">
              <AppLoader v-if="isDepositing" size="sm" color="white" class="mr-2" />
              {{ isDepositing ? "Processing..." : "Deposit Tokens" }}
            </AppButton>
          </div>
        </div>

        <!-- Step 3: Claim -->
        <div v-else-if="gamePlayStep === 3" class="text-center py-6 space-y-6">
          <div class="mb-6">
            <div class="text-xl font-medium text-white mb-2">Claim Winnings</div>
            <p class="text-gray-400">Try your luck! Click the button below to see if you've won.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Bet Amount:</span>
              <span class="font-semibold text-white"> {{ betAmount }} {{ game.token.symbol }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ probabilityPercentage }}% </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Win:</span>
              <span class="font-semibold text-success-400"> {{ potentialWinAmount.toLocaleString() }} {{ game.token.symbol }} </span>
            </div>
          </div>

          <div>
            <AppButton @click="handleClaim" variant="accent" :disabled="isClaiming" class="px-8">
              <AppLoader v-if="isClaiming" size="sm" color="white" class="mr-2" />
              {{ isClaiming ? "Processing..." : "Claim Now" }}
            </AppButton>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-else-if="gamePlayStep === 4" class="text-center py-6 space-y-6">
          <div
            v-if="gameStore.currentGamePlay?.isWin"
            class="mb-6 bg-success-900 rounded-xl p-6 border border-success-700 neon-border-success"
          >
            <div class="text-2xl font-bold text-white mb-2">🎉 Congratulations! 🎉</div>
            <p class="text-success-300 text-lg">
              You won {{ gameStore.currentGamePlay?.winAmount?.toLocaleString() }} {{ game.token.symbol }}!
            </p>
          </div>

          <div v-else class="mb-6 bg-background-dark rounded-xl p-6 border border-gray-700">
            <div class="text-xl font-medium text-white mb-2">Better luck next time!</div>
            <p class="text-gray-400">You didn't win this round. Try again with a different bet or probability.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Bet Amount:</span>
              <span class="font-semibold text-white"> {{ betAmount }} {{ game.token.symbol }} </span>
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

            <AppButton @click="gamePlayStep = 1" variant="primary"> Play Again </AppButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
