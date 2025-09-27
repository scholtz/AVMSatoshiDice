<script setup lang="ts">
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk, { makeAssetTransferTxnWithSuggestedParamsFromObject, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { getArc200Client } from "arc200-client";
import { AvmSatoshiDiceClient, PlayStruct } from "avm-satoshi-dice";
import { useToast } from "primevue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "../../stores/app";
import { IGameStruct, useGameStore } from "../../stores/game";
import AppButton from "../common/AppButton.vue";
import AppLoader from "../common/AppLoader.vue";
import FireworksEffect from "../effects/FireworksEffect.vue";
const toast = useToast();
const gameStore = useGameStore();

const props = defineProps<{
  game: IGameStruct;
}>();

const appStore = useAppStore();
const emit = defineEmits(["play-complete"]);

const route = useRoute();
const { activeAddress, transactionSigner } = useWallet();

const checkCurrentRound = async () => {
  try {
    if (!gameStore) return;
    if (!gameStore.currentGamePlay) return;
    console.log("checkCurrentRound", gameStore.currentGamePlay.state);
    if (gameStore.currentGamePlay.state == 1n) {
      const client = appStore.getAlgorandClient(props.game.chain);
      const params = await client.client.algod.getTransactionParams().do();
      state.currentRound = params.firstValid;
    }
  } catch (e) {
    console.error("checkCurrentRound error", e);
  }
};
async function startRoundChecker() {
  while (true) {
    await checkCurrentRound();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
startRoundChecker();

onMounted(async () => {
  appStore.setEnv(props.game.chain);
  await appStore.updateBalance(props.game.token.id, props.game.token.type, activeAddress, transactionSigner, appStore.state.env);
  await checkCurrentGameState();
  if (route.name == "game-play-overview") {
    if (gameStore.currentGamePlay?.state == 1n) {
      state.gamePlayStep = 3;
    } else {
      await goToProof();
    }
  }

  setBalance(true);
  state.loaded = true;
});
function bufferToDecimal(buf: Buffer): bigint {
  let result = 0n;
  for (const byte of buf) {
    result = (result << 8n) + BigInt(byte);
  }
  return result;
}
const formattedWinUpToBalance = computed(() => {
  return (Number(props.game.game.balance / 10n) / 10 ** Number(props.game.token.decimals)).toLocaleString();
});
const goToProof = async () => {
  if (!gameStore.currentGamePlay) throw Error("Game play not found");

  const algorand = appStore.getAlgorandClient(props.game.chain);
  const round = await algorand.client.algod.block(gameStore.currentGamePlay.round + 2n).do();
  state.seedInB64 = Buffer.from(round.block.header.seed).toString("base64");
  state.seedInHex = Buffer.from(round.block.header.seed).toString("hex");
  state.seedInDec = bufferToDecimal(Buffer.from(round.block.header.seed));

  state.gamePlayStep = 4;

  if (state.play?.state == 2n) {
    showFireworks.value = true;
  }
};

const checkCurrentGameState = async (moveToCheckOnResult: boolean = false) => {
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
      state.play = play;
      if (play.state == 1n) {
        // unclaimed
        state.gamePlayStep = 3;
      }
      gameStore.setLastGamePlay(play);
      if (moveToCheckOnResult) {
        if (play.state == 1n) {
          state.gamePlayStep = 3;
        } else {
          await goToProof();
        }
      }
    }
  } catch (e: any) {
    console.error(e);
  }
};

const state = reactive({
  loaded: false,
  depositAmount: 1000,
  winProbability: 50,
  isDepositing: false,
  isClaiming: false,
  balanceModifiedByUser: false,
  modifyingByButton: false,
  gamePlayStep: 1, // 1: Setup, 2: Deposit, 3: Claim, 4: Result
  errorMessage: "",
  play: undefined as undefined | PlayStruct,
  currentRound: undefined as undefined | bigint,
  seedInHex: undefined as undefined | string,
  seedInB64: undefined as undefined | string,
  seedInDec: undefined as undefined | bigint,
});

watch(
  () => state.depositAmount,
  () => {
    if (!state.modifyingByButton) {
      state.balanceModifiedByUser = true;
    }
  },
);

const showFireworks = ref(false);

const tokenBalance = computed(() => {
  return appStore.getBalanceForToken(props.game.token.id, appStore.state.env);
});
const cannotClaim = computed(() => {
  if (state.isClaiming) return true;
  if (!state.play) return true;
  if (!state.currentRound) return true;
  return state.currentRound < state.play.round + 2n;
});

const potentialWinAmount = computed(() => {
  const probabilityDecimal = state.winProbability / 100;
  return Math.floor((state.depositAmount / probabilityDecimal) * 10 ** props.game.token.decimals) / 10 ** props.game.token.decimals;
});

const gameProofPlayerBigint = computed(() => {
  if (!gameStore?.currentGamePlay) return 0n;
  if (!props?.game?.game?.winRatio) return 0n;
  return (gameStore.currentGamePlay.winProbability * props.game.game.winRatio) / 1_000_000n;
});
const gameProofRand01Bigint = computed(() => {
  if (!state.seedInDec) return 0n;
  return state.seedInDec % 1000000n;
});
const potentialNetWinAmount = computed(() => {
  const probabilityDecimal = state.winProbability / 100;
  return (
    Math.floor((state.depositAmount * 10 ** props.game.token.decimals) / probabilityDecimal) / 10 ** props.game.token.decimals -
    state.depositAmount
  );
});

const probabilityPercentage = computed(() => {
  return state.winProbability.toFixed(4);
});
const probabilityIncludingWinRatioPercentage = computed(() => {
  return ((state.winProbability * Number(props.game.game.winRatio)) / 1000000).toFixed(4);
});

const maxPossibleWin = computed(() => {
  return Number(props.game.game.balance) / 10 ** Number(props.game.token.decimals) / 2;
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
    state.errorMessage = "Insufficient token balance for this deposit";
    return false;
  }

  if (!canWinAmount.value) {
    state.errorMessage = "Potential win amount exceeds 50% of the game balance";
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
    const algorandClient = appStore.getAlgorandClient(props.game.chain);
    const client = new AvmSatoshiDiceClient({
      algorand: algorandClient,
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });
    if (props.game.token.type == "native") {
      const ret = await client.send.startGameWithNativeToken({
        args: {
          game: props.game.idObj,
          txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
            amount: BigInt(Math.round(state.depositAmount * 10 ** Number(props.game.token.decimals))),
            receiver: algosdk.encodeAddress(client.appAddress.publicKey),
            sender: activeAddress.value,
            suggestedParams: await client.algorand.client.algod.getTransactionParams().do(),
          }),
          winProbability: BigInt(Math.round(state.winProbability * 10000)),
        },
        //staticFee: AlgoAmount.MicroAlgo(2000),
        maxFee: AlgoAmount.MicroAlgo(4000),
      });
      if (ret.return) {
        state.play = ret.return;
        gameStore.setLastGamePlay(state.play);
      }
    }
    if (props.game.token.type == "asa") {
      const ret = await client.send.startGameWithAsaToken({
        args: {
          game: props.game.idObj,
          txnDeposit: makeAssetTransferTxnWithSuggestedParamsFromObject({
            assetIndex: props.game.idObj.assetId,
            amount: BigInt(Math.round(state.depositAmount * 10 ** Number(props.game.token.decimals))),
            receiver: algosdk.encodeAddress(client.appAddress.publicKey),
            sender: activeAddress.value,
            suggestedParams: await client.algorand.client.algod.getTransactionParams().do(),
          }),
          winProbability: BigInt(Math.round(state.winProbability * 10000)),
        },
        //staticFee: AlgoAmount.MicroAlgo(2000),
        maxFee: AlgoAmount.MicroAlgo(4000),
      });
      if (ret.return) {
        state.play = ret.return;
        gameStore.setLastGamePlay(state.play);
      }
    }

    if (props.game.token.type == "arc200") {
      const arc200 = getArc200Client({
        algorand: algorandClient,
        appId: BigInt(props.game.idObj.assetId),
        defaultSender: activeAddress.value,
        defaultSigner: transactionSigner,
        appName: undefined,
        approvalSourceMap: undefined,
        clearSourceMap: undefined,
      });
      const amountUint = BigInt(Math.round(state.depositAmount * 10 ** Number(props.game.token.decimals)));
      const approveTx = await arc200.createTransaction.arc200Approve({
        args: {
          spender: algosdk.encodeAddress(client.appAddress.publicKey),
          value: amountUint,
        },
      });
      const group = await client
        .newGroup()
        .addTransaction(approveTx.transactions[0], transactionSigner)
        .startGameWithArc200Token({
          args: {
            game: props.game.idObj,
            amount: amountUint,
            assetId: props.game.idObj.assetId,
            winProbability: BigInt(Math.round(state.winProbability * 10000)),
          },
          staticFee: AlgoAmount.MicroAlgo(2000),
          maxFee: AlgoAmount.MicroAlgo(4000),
        })
        .send();
      if (group.returns[0]) {
        state.play = group.returns[0];
        gameStore.setLastGamePlay(state.play);
      }
    }

    // do the deposit
    state.isDepositing = false;
    state.gamePlayStep = 3;
  } catch (e: any) {
    state.isDepositing = false;
    console.error(e);
    state.errorMessage = e.message;
    toast.add({
      severity: "error",
      detail: e.message ?? e,
      life: 10000,
    });
    await checkCurrentGameState(true);
  }
};

const handleClaim = async () => {
  state.isClaiming = true;

  try {
    // Create game play record
    if (!activeAddress.value) throw Error("Active Address is missing");
    if (!state.play) throw Error("Cannot find current game");
    const client = new AvmSatoshiDiceClient({
      algorand: appStore.getAlgorandClient(props.game.chain),
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });
    const params = await client.algorand.client.algod.getTransactionParams().do();
    const firstValid = state.play.round > params.firstValid - 900n ? state.play.round + 3n : params.firstValid;
    const lastValid = firstValid + 1000n;

    if (props.game.token.type == "native") {
      const ret = await client.send.claimGame({
        args: {},
        firstValidRound: firstValid,
        lastValidRound: lastValid,
        staticFee: AlgoAmount.MicroAlgo(2000),
        maxFee: AlgoAmount.MicroAlgo(4000),
      });
      console.log("claimGame.ret", ret);
      if (ret.return) {
        state.play = ret.return;
        gameStore.setLastGamePlay(state.play);
      }
    }
    if (props.game.token.type == "asa") {
      const ret = await client.send.claimGame({
        args: {},
        firstValidRound: firstValid,
        lastValidRound: lastValid,
        staticFee: AlgoAmount.MicroAlgo(2000),
        maxFee: AlgoAmount.MicroAlgo(4000),
      });
      console.log("claimGame.ret", ret);
      if (ret.return) {
        state.play = ret.return;
        gameStore.setLastGamePlay(state.play);
      }
    }
    if (props.game.token.type == "arc200") {
      const ret = await client.send.claimGame({
        args: {},
        firstValidRound: firstValid,
        lastValidRound: lastValid,
        staticFee: AlgoAmount.MicroAlgo(2000),
        maxFee: AlgoAmount.MicroAlgo(4000),
      });
      console.log("claimGame.ret", ret);
      if (ret.return) {
        state.play = ret.return;
        gameStore.setLastGamePlay(state.play);
      }
    }
    await appStore.updateBalance(props.game.token.id, props.game.token.type, activeAddress, transactionSigner, appStore.state.env);
    // do the deposit
    state.isClaiming = false;
    await goToProof();
  } catch (e: any) {
    state.isClaiming = false;
    state.gamePlayStep = 3;
    await checkCurrentGameState(true);
    console.error(e);
    state.errorMessage = e.message;
    toast.add({
      severity: "error",
      detail: e.message ?? e,
      life: 10000,
    });
  }
};

const resetGameClick = () => {
  state.depositAmount = 1000;
  state.winProbability = 50;
  state.gamePlayStep = 1;
  showFireworks.value = false;
  state.errorMessage = "";
  emit("play-complete");
};
const playAgainClick = async () => {
  if (!state.play) {
    resetGameClick();
    return;
  }

  state.depositAmount = Number(state.play.deposit) / 10 ** Number(props.game.token.decimals);
  state.winProbability = Number(state.play.winProbability) / 10000;
  state.gamePlayStep = 1;
  showFireworks.value = false;
  state.errorMessage = "";
  await startPlay();
};

const setProbability = (probability: number, byButton: boolean = true) => {
  state.winProbability = probability;
  setBalance(byButton);
};
const setBalance = (byButton: boolean = true) => {
  if (!state.balanceModifiedByUser) {
    state.modifyingByButton = byButton;
    const maxBalance = Math.floor((Number(props.game.game.balance / 10n) * state.winProbability) / 100) / 10 ** props.game.token.decimals;

    state.depositAmount = Math.min(maxBalance, tokenBalance.value / 10 ** props.game.token.decimals); //

    setTimeout(() => {
      state.modifyingByButton = false;
    }, 100);
  }
};
</script>

<template>
  <div class="w-full">
    <FireworksEffect v-if="showFireworks"></FireworksEffect>

    <MainPanel v-if="state.loaded">
      <div class="bg-gradient-to-r from-primary-900 to-background-dark p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">{{ $t('game.playGameTitle', { token: game.token.name }) }}</h3>

        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <span v-if="game.token.name" class="w-5 h-5 rounded-full bg-gray-700 mr-1 flex items-center justify-center text-xs font-bold">
              {{ game.token.name.substring(0, 1) }}
            </span>
            <span class="text-sm font-medium text-gray-300">{{ game.token.unitName }}</span>
          </div>

          <div class="px-2 py-0.5 bg-primary-800 text-primary-300 rounded-full text-xs font-medium">
            {{ (Number(game.game.winRatio) / 10000).toLocaleString() }}% {{ $t('common.winRatio') }}
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Step 1: Setup -->
        <div v-if="state.gamePlayStep === 1" class="space-y-6">
          <div v-if="!tokenBalance">
            <Message severity="warn" v-if="game.chain == 'voimain-v1.0'">
              {{ $t('game.accountEmpty') }} {{ game.token.name }}. {{ $t('game.getTokensVoi') }}
              <a class="underline" href="https://www.voi.network/pages/projects/directory?type=DEX" target="_blank">{{ $t('game.voiDexes') }}</a>.
            </Message>
            <Message severity="warn" v-if="game.chain == 'mainnet-v1.0'">
              {{ $t('game.accountEmpty') }} {{ game.token.name }}. {{ $t('game.getTokensAlgorand') }}
              <a class="underline" href="https://algorand.co/ecosystem/directory?tags=DEX" target="_blank">{{ $t('game.algorandDexes') }}</a>.
            </Message>
            <Message severity="warn" v-if="game.chain == 'testnet-v1.0'">
              {{ $t('game.accountEmpty') }} {{ game.token.name }}. {{ $t('game.getTokensTestnet') }}
              <a class="underline" href="https://bank.testnet.algorand.network/" target="_blank">{{ $t('game.algorandTestnetFaucet') }}</a>.
            </Message>
          </div>

          <div class="md:grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-2 hidden">
            <Button @click="setProbability(0.1)">Multiplier<br />1000x</Button>
            <Button @click="setProbability(1)">Multiplier<br />100x</Button>
            <Button @click="setProbability(2)">Multiplier<br />50x</Button>
            <Button @click="setProbability(4)">Multiplier<br />25x</Button>
            <Button @click="setProbability(10)">Multiplier<br />10x</Button>
            <Button @click="setProbability(33.3333)">Multiplier<br />3x</Button>
            <Button @click="setProbability(50)">Multiplier<br />2x</Button>
            <Button @click="setProbability(66.6666)">Multiplier<br />1.5x</Button>
            <Button @click="setProbability(83.3333)">Multiplier<br />1.2x</Button>
            <Button @click="setProbability(90.909)">Multiplier<br />1.1x</Button>
            <Button @click="setProbability(95.238)">Multiplier<br />1.05x</Button>
            <Button @click="setProbability(99.0099)">Multiplier<br />1.01x</Button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label" for="state.depositAmount">{{ $t('game.depositAmount') }} ({{ game.token.unitName }})</label>
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
                {{ $t('game.yourBalance') }}: {{ (Number(tokenBalance) / 10 ** Number(game.token.decimals)).toLocaleString() }}
                {{ appStore.state.tokenName }}
              </div>
              <div v-if="!canAffordBet" class="mt-1 text-sm text-error-500">{{ $t('game.insufficientBalanceShort') }}</div>
            </div>
            <div>
              <label class="label" for="winProbability">{{ $t('game.winProbability') }} (%)</label>
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
              <span class="text-gray-400">Maximum win amount:</span>
              <span class="font-semibold text-lg"> {{ formattedWinUpToBalance }} {{ game.token.unitName }} </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Win:</span>
              <span :class="['font-semibold text-lg', canWinAmount ? 'text-success-400' : 'text-error-500']">
                {{ potentialWinAmount.toFixed(game.token.decimals).toLocaleString() }} {{ game.token.unitName }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Net Win:</span>
              <span> {{ potentialNetWinAmount.toFixed(game.token.decimals).toLocaleString() }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Game Balance:</span>
              <span class="font-semibold text-white">
                {{ (Number(game.game.balance) / 10 ** Number(game.token.decimals)).toFixed(game.token.decimals).toLocaleString() }}
                {{ game.token.unitName }}
              </span>
            </div>

            <div v-if="!canWinAmount" class="text-sm text-error-500">
              Potential win amount exceeds maximum win balance. Adjust your deposit or probability.
            </div>
          </div>

          <div v-if="state.errorMessage" class="bg-error-900 border border-error-600 text-error-200 p-3 rounded-lg">
            {{ state.errorMessage }}
          </div>

          <div class="flex justify-end">
            <AppButton @click="startPlay" variant="primary" :disabled="!canPlay">{{ $t('game.startGame') }}</AppButton>
          </div>
        </div>

        <!-- Step 2: Deposit -->
        <div v-else-if="state.gamePlayStep === 2" class="text-center py-6 space-y-6">
          <div class="mb-6">
            <div class="text-xl font-medium text-white mb-2">{{ $t('game.depositTokens') }}</div>
            <p class="text-gray-400">{{ $t('game.depositTokensMessage', { amount: state.depositAmount, token: game.token.unitName }) }}</p>
            <p class="text-red-400">{{ $t('game.checkYourWallet') }}</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white"> {{ state.depositAmount }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">{{ $t('game.winProbability') }}:</span>
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
        </div>

        <!-- Step 3: Claim -->
        <div v-else-if="state.gamePlayStep === 3" class="text-center py-6 space-y-6">
          <div class="mb-6">
            <div class="text-xl font-medium text-white mb-2">Check results</div>
            <p class="text-gray-400">
              Try your luck! Click the button below to see if you've won. Make sure to check results within 100 rounds from the play start,
              otherwise the game will time out!
            </p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Game round:</span>
              <span class="font-semibold text-white"> {{ state.play?.round }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Current round:</span>
              <span class="font-semibold text-white"> {{ state.currentRound }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white"> {{ state.depositAmount }} {{ game.token.unitName }} </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ probabilityPercentage }}% </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <span class="text-gray-400">Potential Win:</span>
              <span class="font-semibold text-success-400"> {{ potentialWinAmount.toLocaleString() }} {{ game.token.unitName }} </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400">Potential Net Win:</span>
              <span> {{ potentialNetWinAmount.toLocaleString() }} {{ game.token.unitName }} </span>
            </div>
          </div>

          <div>
            <AppButton @click="handleClaim" variant="primary" :disabled="cannotClaim" class="px-8">
              <AppLoader v-if="state.isClaiming || cannotClaim" size="sm" color="white" class="mr-2" />
              {{ state.isClaiming ? "Processing... Check your wallet.." : cannotClaim ? "Wait few blocks.." : "Check the results" }}
            </AppButton>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-else-if="state.gamePlayStep === 4" class="text-center py-6 space-y-6">
          <div
            v-if="gameStore.currentGameState() == 'Win'"
            class="mb-6 bg-success-900 rounded-xl p-6 border border-success-700 neon-border-success"
          >
            <div class="text-2xl font-bold text-white mb-2">🎉 Congratulations! 🎉</div>
            <p class="text-success-300 text-lg">
              You won
              <!-- You won {{ gameStore.currentGamePlay?.winAmount?.toLocaleString() }} {{ game.token.unitName }}! -->
            </p>
          </div>

          <div v-else class="mb-6 bg-background-dark rounded-xl p-6 border border-gray-700">
            <div class="text-xl font-medium text-white mb-2">Better luck next time!</div>
            <p class="text-gray-400">Feel free to review the game proof below and try your luck again.</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center" v-if="state.play">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white">
                {{ (Number(state.play.deposit) / 10 ** Number(game.token.decimals)).toLocaleString() }} {{ game.token.unitName }}
              </span>
            </div>

            <div class="flex justify-between items-center" v-if="state.play">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ (Number(state.play.winProbability) / 10000).toLocaleString() }}% </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Outcome:</span>
              <span :class="['font-semibold', gameStore.currentGameState() == 'Win' ? 'text-success-400' : 'text-error-400']">
                {{ gameStore.currentGameState() }}
              </span>
            </div>

            <div class="flex justify-between items-center" v-if="state.play">
              <span class="text-gray-400">Game round:</span>
              <span class="font-semibold text-white"> {{ state.play.round.toLocaleString() }} </span>
            </div>
            <div class="flex justify-between items-center" v-if="state.play">
              <span class="text-gray-400">Game round + 2:</span>
              <span class="font-semibold text-white"> {{ (state.play.round + 2n).toLocaleString() }} </span>
            </div>
            <div class="flex justify-between items-center" v-if="state.seedInB64">
              <span class="text-gray-400">Seed B64:</span>
              <span class="font-semibold text-white"><AbbrText :text="state.seedInB64"></AbbrText></span>
            </div>
            <div class="flex justify-between items-center" v-if="state.seedInHex">
              <span class="text-gray-400">Seed HEX:</span>
              <span class="font-semibold text-white"><AbbrText :text="state.seedInHex"></AbbrText></span>
            </div>
            <div class="flex justify-between items-center" v-if="state.seedInDec">
              <span class="text-gray-400">Seed decimal:</span>
              <span class="font-semibold text-white"><AbbrText :text="state.seedInDec?.toString()"></AbbrText></span>
            </div>
            <div class="flex justify-between items-center" v-if="state.seedInDec">
              <span class="text-gray-400">Random number (R):</span>
              <span class="font-semibold text-white"
                >{{ (state.seedInDec % 1000000n)?.toLocaleString() }} / {{ Number(1_000_000).toLocaleString() }}</span
              >
            </div>
            <div class="flex justify-between items-center" v-if="state.play">
              <span class="text-gray-400">External seed verification:</span>
              <span class="font-semibold text-white">
                <a
                  :href="`${appStore.state.algodHost}:${appStore.state.algodPort}/v2/blocks/${state.play.round + 2n}?format=json`"
                  target="_blank"
                  rel="noref"
                  ref="noref"
                >
                  Round {{ state.play.round + 2n }}
                </a>
              </span>
            </div>
            <div class="flex justify-between items-center" v-if="gameStore.currentGamePlay?.winProbability">
              <span class="text-gray-400">Your probability:</span>
              <span class="font-semibold text-white"
                >{{ gameStore.currentGamePlay?.winProbability?.toLocaleString() }} / {{ Number(1_000_000).toLocaleString() }}</span
              >
            </div>
            <div class="flex justify-between items-center" v-if="game.game.winRatio">
              <span class="text-gray-400">Game win ratio:</span>
              <span class="font-semibold text-white">
                {{ game.game.winRatio?.toLocaleString() }} / {{ Number(1_000_000).toLocaleString() }}
              </span>
            </div>
            <div class="flex justify-between items-center" v-if="game.game.winRatio && gameStore.currentGamePlay?.winProbability">
              <span class="text-gray-400">Play win probability (P):</span>
              <span class="font-semibold text-white">
                {{ gameProofPlayerBigint.toLocaleString() }} /
                {{ Number(1_000_000).toLocaleString() }}
              </span>
            </div>
            <div class="flex justify-between items-center" v-if="state.seedInDec">
              <span class="text-gray-400">Proof to win (R&lt;P):</span>
              <span class="font-semibold text-white">
                {{ gameProofRand01Bigint.toLocaleString() }} < {{ gameProofPlayerBigint.toLocaleString() }}
              </span>
            </div>
            <div class="flex justify-between items-center" v-if="state.play && state.play.state > 1n">
              <span class="text-gray-400">Validate proof:</span>
              <span class="font-semibold text-success-400" v-if="gameProofRand01Bigint >= gameProofPlayerBigint && state.play?.state == 3n">
                Proof is valid
              </span>
              <span class="font-semibold text-error-500" v-if="gameProofRand01Bigint < gameProofPlayerBigint && state.play?.state == 3n">
                Proof is invalid
              </span>
              <span class="font-semibold text-success-400" v-if="gameProofRand01Bigint < gameProofPlayerBigint && state.play?.state == 2n">
                Proof is valid
              </span>
              <span class="font-semibold text-error-500" v-if="gameProofRand01Bigint >= gameProofPlayerBigint && state.play?.state == 2n">
                Proof is invalid
              </span>
            </div>
          </div>

          <div class="flex justify-center space-x-4">
            <AppButton @click="resetGameClick" variant="outline"> Back to Game </AppButton>
            <AppButton @click="playAgainClick" variant="primary"> Play Again </AppButton>
          </div>
        </div>
      </div>
    </MainPanel>
    <MainPanel v-else class="p-6"><AppLoader size="lg" color="primary" /></MainPanel>
  </div>
</template>
