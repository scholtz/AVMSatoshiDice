<script setup lang="ts">
import algosdk from "algosdk";
import { parsePlayStruct, PlayStruct } from "avm-satoshi-dice";
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppButton from "../components/common/AppButton.vue";
import AppLoader from "../components/common/AppLoader.vue";
import TxProof from "../components/game/TxProof.vue";
import { getAssetAsync } from "../scripts/algorand/getAssetAsync";
import { useAppStore } from "../stores/app";
import { IGameStruct } from "../stores/game";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const isLoading = ref(true);
const txId = route.params.txId as string;
const chainId = route.params.chain as
  | "mainnet-v1.0"
  | "aramidmain-v1.0"
  | "testnet-v1.0"
  | "betanet-v1.0"
  | "voimain-v1.0"
  | "fnet-v1"
  | "dockernet-v1";

const state = reactive({
  play: undefined as undefined | PlayStruct,
  game: undefined as undefined | IGameStruct,
  chain: chainId as "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
});

onMounted(async () => {
  const address = "TESTNTTTJDHIF5PJZUBTTDYYSKLCLM6KXCTWIOOTZJX5HO7263DPPMM2SU";
  const transactionSigner = async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
    console.log("transactionSigner", txnGroup, indexesToSign);
    return [] as Uint8Array[];
  };
  const client = appStore.getAppClient(address, transactionSigner, chainId);

  const tx = await client.algorand.client.indexer.lookupTransactionByID(txId).do();
  if (tx.transaction.logs && tx.transaction.logs.length > 0) {
    const play = parsePlayStruct(tx.transaction.logs[0]);
    const game = await client.game({
      args: {
        assetId: play.assetId,
        creator: play.gameCreator,
      },
    });
    console.log("play", play, game);
    state.play = play;
    state.chain = chainId;
    state.game = {
      chain: chainId,
      game: game,
      id: `${play.gameCreator}-${play.assetId}`,
      idObj: {
        assetId: play.assetId,
        owner: play.gameCreator,
      },
      token: await getAssetAsync(play.assetId, client.algorand),
    };
  }
  isLoading.value = false;
});
</script>

<template>
  <div v-if="isLoading" class="flex justify-center py-12">
    <AppLoader size="lg" color="primary" />
  </div>

  <div v-else-if="!state.game || !state.play" class="card p-6 text-center">
    <div class="text-xl font-medium text-white mb-2">Game Not Found</div>
    <p class="text-gray-400 mb-6">The game you're looking for doesn't exist or has been removed.</p>
    <AppButton @click="router.push('/')" variant="primary"> Back to Games </AppButton>
  </div>

  <TxProof v-else :game="state.game" :play="state.play" :chain="state.chain" class="w-full" />
</template>
