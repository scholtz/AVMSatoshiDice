<script setup lang="ts">
import algosdk from "algosdk";
import { parsePlayStruct, PlayStruct } from "avm-satoshi-dice";
import { onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { getAssetAsync } from "../../scripts/algorand/getAssetAsync";
import { useAppStore } from "../../stores/app";
import { useGameStore } from "../../stores/game";
import { IAssetParams } from "../../types/IAssetParams";
import AppLoader from "../common/AppLoader.vue";
const appStore = useAppStore();
const gameStore = useGameStore();
const state = reactive({
  isLoading: false,
  plays: [] as IGamePlayWithToken[],
});
// 1. Define your struct
const router = useRouter();
onMounted(async () => {
  console.log("gamelist onmounted");
  await refreshList();
});

export type ABIReturn = {
  rawReturnValue?: undefined;
  returnValue?: undefined;
  method?: undefined;
  decodeError: Error;
};
interface IGamePlayWithToken {
  txId: string;
  play: PlayStruct;
  token: IAssetParams;
  chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1";
}
state.isLoading = true;
const refreshList = async () => {
  const account = algosdk.generateAccount();
  const address = algosdk.encodeAddress(account.addr.publicKey);
  const transactionSigner = async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
    console.log("transactionSigner", txnGroup, indexesToSign);
    return [] as Uint8Array[];
  };
  const clients = appStore.getAppClients(address, transactionSigner);

  const plays: IGamePlayWithToken[] = [];
  for (let chain of Object.keys(clients)) {
    try {
      const client = clients[chain];
      const txs = await client.algorand.client.indexer.searchForTransactions().txType("appl").address(client.appAddress).limit(200).do();
      for (let tx of txs.transactions) {
        try {
          if (!tx.id) continue;
          if (tx.applicationTransaction?.applicationArgs && tx.applicationTransaction.applicationArgs.length > 0) {
            //console.log("arg", Buffer.from(tx.applicationTransaction.applicationArgs[0]).toString("hex"));
          }
          if (tx.logs && tx.logs.length == 1) {
            //client..decodeReturnValue<PlayStruct>(undefined,  )
            const play = parsePlayStruct(tx.logs[0]);
            plays.push({
              txId: tx.id,
              play: play,
              token: await getAssetAsync(play.assetId, client.algorand),
              chain: chain as
                | "mainnet-v1.0"
                | "aramidmain-v1.0"
                | "testnet-v1.0"
                | "betanet-v1.0"
                | "voimain-v1.0"
                | "fnet-v1"
                | "dockernet-v1",
            });
          }
        } catch (e: any) {
          console.error("error fetching plays", e);
        }
      }
    } catch (e: any) {
      console.error("error fetching plays", e);
    }
  }

  state.plays = plays
    .filter((p) => p.play.state > 1n)
    .sort((a, b) => {
      return Number(b.play.update - a.play.update);
    })
    .slice(0, 10);
  console.log("state.plays", state.plays, plays, plays.length);
  state.isLoading = false;
};

async function startRefreshListChecker() {
  while (true) {
    await refreshList();
    await new Promise((resolve) => setTimeout(resolve, 6000));
  }
}
startRefreshListChecker();
</script>

<template>
  <div class="w-full mb-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-white">{{ $t('game.recentPlays') }}</h2>
    </div>

    <div v-if="state.isLoading" class="flex justify-center py-12">
      <AppLoader size="lg" color="primary" />
    </div>

    <MainPanel v-else-if="state.plays.length === 0" class="p-8 text-center">
      <div class="text-gray-400 mb-2">{{ $t('game.noPlaysFound') }}</div>
      <p class="text-gray-500">{{ $t('game.connectionIssues') }}</p>
    </MainPanel>
    <div v-else>
      <div class="overflow-hidden rounded-lg border border-primary-900 hidden md:block">
        <table class="min-w-full table-auto text-left text-sm">
          <thead style="background: linear-gradient(to right, rgba(67, 56, 203, 0.5), rgba(59, 130, 246, 0.5))">
            <tr>
              <th class="px-4 py-2 font-medium">{{ $t('game.proof') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('game.time') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('game.blockchain') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('game.gameRound') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('game.asset') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('common.amount') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('game.status') }}</th>
            </tr>
          </thead>
          <tbody style="background: linear-gradient(to right, rgba(67, 56, 203, 0.5), rgba(59, 130, 246, 0.1))">
            <tr v-for="play in state.plays" class="hover:bg-gray-900">
              <td class="px-4 py-2">
                <Button size="small" class="w-full" @click="router.push(`/proof/${play.chain}/${play.txId}`)">Check game proof</Button>
              </td>
              <td class="px-4 py-2">{{ new Date(Number(play.play.update) * 1000).toLocaleString() }}</td>
              <td class="px-4 py-2">{{ play.chain }}</td>
              <td class="px-4 py-2">{{ play.play.round }}</td>
              <td class="px-4 py-2">{{ play.token.name }}</td>
              <td class="px-4 py-2">
                {{ (Number(play.play.deposit) / 10 ** Number(play.token.decimals)).toFixed(play.token.decimals).toLocaleString() }}
                {{ play.token.unitName }}
              </td>
              <td class="px-4 py-2">{{ gameStore.playState2Text(play.play.state) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="overflow-hidden rounded-lg border border-primary-900 block md:hidden">
        <table class="min-w-full table-auto text-left text-sm">
          <thead style="background: linear-gradient(to right, rgba(67, 56, 203, 0.5), rgba(59, 130, 246, 0.5))">
            <tr>
              <th class="px-4 py-2 font-medium">Proof</th>
              <th class="px-4 py-2 font-medium">Time</th>
              <th class="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody style="background: linear-gradient(to right, rgba(67, 56, 203, 0.5), rgba(59, 130, 246, 0.1))">
            <tr v-for="play in state.plays" class="hover:bg-gray-900">
              <td class="px-4 py-2">
                <Button size="small" class="w-full" @click="router.push(`/proof/${play.chain}/${play.txId}`)">Check game proof</Button>
              </td>
              <td class="px-4 py-2">{{ new Date(Number(play.play.update) * 1000).toLocaleString() }}</td>
              <td class="px-4 py-2">{{ gameStore.playState2Text(play.play.state) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
