<script setup lang="ts">
import { PlayStruct } from "avm-satoshi-dice";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useAppStore } from "../../stores/app";
import { IGameStruct, useGameStore } from "../../stores/game";
import AppButton from "../common/AppButton.vue";
import FireworksEffect from "../effects/FireworksEffect.vue";
const gameStore = useGameStore();

const props = defineProps<{
  game: IGameStruct;
  play: PlayStruct;
  chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1";
}>();

const appStore = useAppStore();
const emit = defineEmits(["play-complete"]);

const checkCurrentRound = async () => {
  try {
    if (!gameStore) return;
    if (!props.play) return;
    console.log("checkCurrentRound", props.play.state);
    if (props.play.state == 1n) {
      const client = appStore.getAlgorandClient(props.chain);
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
  console.log("props.play", props.play);
  goToProof();
});
function bufferToDecimal(buf: Buffer): bigint {
  let result = 0n;
  for (const byte of buf) {
    result = (result << 8n) + BigInt(byte);
  }
  return result;
}
const goToProof = async () => {
  if (!props.play) throw Error("Game play not found");

  const algorand = appStore.getAlgorandClient(props.game.chain);
  const round = await algorand.client.algod.block(props.play.round + 2n).do();
  state.seedInB64 = Buffer.from(round.block.header.seed).toString("base64");
  state.seedInHex = Buffer.from(round.block.header.seed).toString("hex");
  state.seedInDec = bufferToDecimal(Buffer.from(round.block.header.seed));

  state.gamePlayStep = 4;

  if (props.play?.state == 2n) {
    showFireworks.value = true;
  }
};

const state = reactive({
  depositAmount: 1000,
  winProbability: 50,
  isDepositing: false,
  isClaiming: false,
  gamePlayStep: 1, // 1: Setup, 2: Deposit, 3: Claim, 4: Result
  errorMessage: "",
  play: undefined as undefined | PlayStruct,
  currentRound: undefined as undefined | bigint,
  seedInHex: undefined as undefined | string,
  seedInB64: undefined as undefined | string,
  seedInDec: undefined as undefined | bigint,
});

const showFireworks = ref(false);

const gameProofPlayerBigint = computed(() => {
  if (!props.play) return 0n;
  if (!props?.game?.game?.winRatio) return 0n;
  return (props.play.winProbability * props.game.game.winRatio) / 1_000_000n;
});
const gameProofRand01Bigint = computed(() => {
  if (!state.seedInDec) return 0n;
  return state.seedInDec % 1000000n;
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
</script>

<template>
  <div class="w-full">
    <FireworksEffect v-if="showFireworks"></FireworksEffect>

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
        <!-- Step 4: Result -->
        <div class="text-center py-6 space-y-6">
          <div v-if="props.play.state == 2n" class="mb-6 bg-success-900 rounded-xl p-6 border border-success-700 neon-border-success">
            <div class="text-2xl font-bold text-white mb-2">{{ $t('game.congratulations') }}</div>
            <p class="text-success-300 text-lg">
              {{ $t('game.youWon') }}
              <!-- You won {{ play.winAmount?.toLocaleString() }} {{ game.token.unitName }}! -->
            </p>
          </div>

          <div v-else class="mb-6 bg-background-dark rounded-xl p-6 border border-gray-700">
            <div class="text-xl font-medium text-white mb-2">{{ $t('game.betterLuckNextTime') }}</div>
            <p class="text-gray-400">{{ $t('game.reviewGameProof') }}</p>
          </div>

          <div class="bg-background-dark rounded-lg p-4 mx-auto max-w-md">
            <div class="flex justify-between items-center" v-if="props.play">
              <span class="text-gray-400">Deposit Amount:</span>
              <span class="font-semibold text-white">
                {{ (Number(props.play.deposit) / 10 ** Number(game.token.decimals)).toLocaleString() }} {{ game.token.unitName }}
              </span>
            </div>

            <div class="flex justify-between items-center" v-if="props.play">
              <span class="text-gray-400">Win Probability:</span>
              <span class="font-semibold text-white"> {{ (Number(props.play.winProbability) / 10000).toLocaleString() }}% </span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-400">Outcome:</span>
              <span :class="['font-semibold', gameStore.playState2Text(props.play.state) == 'Win' ? 'text-success-400' : 'text-error-400']">
                {{ gameStore.playState2Text(props.play.state) }}
              </span>
            </div>

            <div class="flex justify-between items-center" v-if="props.play">
              <span class="text-gray-400">Game round:</span>
              <span class="font-semibold text-white"> {{ props.play.round.toLocaleString() }} </span>
            </div>
            <div class="flex justify-between items-center" v-if="props.play">
              <span class="text-gray-400">Game round + 2:</span>
              <span class="font-semibold text-white"> {{ (props.play.round + 2n).toLocaleString() }} </span>
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
            <div class="flex justify-between items-center" v-if="props.play">
              <span class="text-gray-400">External seed verification:</span>
              <span class="font-semibold text-white">
                <a
                  :href="`${appStore.state.algodHost}:${appStore.state.algodPort}/v2/blocks/${props.play.round + 2n}?format=json`"
                  target="_blank"
                  rel="noref"
                  ref="noref"
                >
                  Round {{ props.play.round + 2n }}
                </a>
              </span>
            </div>
            <div class="flex justify-between items-center" v-if="play.winProbability">
              <span class="text-gray-400">Your probability:</span>
              <span class="font-semibold text-white"
                >{{ play.winProbability?.toLocaleString() }} / {{ Number(1_000_000).toLocaleString() }}</span
              >
            </div>
            <div class="flex justify-between items-center" v-if="game.game.winRatio">
              <span class="text-gray-400">Game win ratio:</span>
              <span class="font-semibold text-white">
                {{ game.game.winRatio?.toLocaleString() }} / {{ Number(1_000_000).toLocaleString() }}
              </span>
            </div>
            <div class="flex justify-between items-center" v-if="game.game.winRatio && play.winProbability">
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
            <div class="flex justify-between items-center" v-if="props.play && props.play.state > 1n">
              <span class="text-gray-400">Validate proof:</span>
              <span class="font-semibold text-success-400" v-if="gameProofRand01Bigint >= gameProofPlayerBigint && props.play?.state == 3n">
                Proof is valid
              </span>
              <span class="font-semibold text-error-500" v-if="gameProofRand01Bigint < gameProofPlayerBigint && props.play?.state == 3n">
                Proof is invalid
              </span>
              <span class="font-semibold text-success-400" v-if="gameProofRand01Bigint < gameProofPlayerBigint && props.play?.state == 2n">
                Proof is valid
              </span>
              <span class="font-semibold text-error-500" v-if="gameProofRand01Bigint >= gameProofPlayerBigint && props.play?.state == 2n">
                Proof is invalid
              </span>
            </div>
          </div>

          <div class="flex justify-center space-x-4">
            <RouterLink to="/">
              <AppButton variant="outline"> Go back </AppButton>
            </RouterLink>
            <RouterLink :to="`/game/${props.game.chain}/${props.game.id}/play`">
              <AppButton variant="primary"> Play the game </AppButton>
            </RouterLink>
          </div>
        </div>
      </div>
    </MainPanel>
  </div>
</template>
