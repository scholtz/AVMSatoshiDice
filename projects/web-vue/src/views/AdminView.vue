<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { getArc200Client } from "arc200-client";
import { onMounted, reactive } from "vue";
import H1 from "../components/H1.vue";
import MainPanel from "../components/MainPanel.vue";
import { getAssetAsync } from "../scripts/algorand/getAssetAsync";
import { useAppStore } from "../stores/app";
import { IAssetParams } from "../types/IAssetParams";

const appStore = useAppStore();
const { activeAddress, transactionSigner } = useWallet();
interface IBalance {
  chain: string;
  token: IAssetParams;
  withdrawable: bigint;
  allDeposits: bigint;
  onlineState: string;
}
const state = reactive({
  balance: [] as IBalance[],
});
onMounted(async () => {
  if (!activeAddress.value) return;
  const clients = appStore.getAppClients(activeAddress.value, transactionSigner);

  for (const chain of Object.keys(clients)) {
    try {
      const client = clients[chain];
      console.log("checking ", chain);
      const info = await client.algorand.client.algod.accountInformation(client.appAddress).do();

      const map = await client.state.box.allDeposits.getMap();
      for (const [assetId, value] of map) {
        try {
          if (value == 1111111111n) {
            console.log("1111111111n");
          }
          const asset = await getAssetAsync(assetId, client.algorand);
          let allDeposits = 0n;
          if (asset.type == "arc200") {
            const arc200 = getArc200Client({
              algorand: client.algorand,
              appId: assetId,
              appName: undefined,
              approvalSourceMap: undefined,
              clearSourceMap: undefined,
              defaultSender: "TESTNTTTJDHIF5PJZUBTTDYYSKLCLM6KXCTWIOOTZJX5HO7263DPPMM2SU",
              defaultSigner: transactionSigner,
            });
            allDeposits = await arc200.arc200BalanceOf({
              args: { owner: algosdk.encodeAddress(client.appAddress.publicKey) },
            });
          } else {
            if (asset.id == assetId) {
              allDeposits = info.amount;
            } else {
              const assetInfo = info.assets?.find((a) => a.assetId == asset.id);
              if (assetInfo) {
                allDeposits = info.amount;
              }
            }
          }

          state.balance.push({
            chain: chain,
            token: asset,
            withdrawable: await client.withdrawable({
              args: {
                assetId: asset.id,
                isArc200Token: asset.type == "arc200",
              },
            }),
            allDeposits: allDeposits,
            onlineState: assetId == 0n ? info.status : "",
          });
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
});
</script>

<template>
  <AuthScreen class="flex flex-col items-center justify-center w-full">
    <MainPanel class="w-200 text-white p-6">
      <H1>{{ $t('admin.adminView') }}</H1>

      <H2>{{ $t('admin.balance') }}</H2>
      <div class="overflow-hidden rounded-lg border border-primary-900 hidden md:block">
        <table class="min-w-full table-auto text-left text-sm">
          <thead style="background: linear-gradient(to right, rgba(67, 56, 203, 0.5), rgba(59, 130, 246, 0.5))">
            <tr>
              <th class="px-4 py-2 font-medium">{{ $t('admin.chain') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('admin.token') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('admin.withdrawable') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('admin.allDeposits') }}</th>
              <th class="px-4 py-2 font-medium">{{ $t('admin.onlineState') }}</th>
            </tr>
          </thead>

          <tbody style="background: linear-gradient(to right, rgba(67, 56, 203, 0.5), rgba(59, 130, 246, 0.1))">
            <tr v-for="balance in state.balance" class="hover:bg-gray-900">
              <td class="px-4 py-2">{{ balance.chain }}</td>
              <td class="px-4 py-2">{{ balance.token.name }} ({{ balance.token.id }})</td>
              <td class="px-4 py-2">{{ Number(balance.withdrawable) / 10 ** Number(balance.token.decimals) }}</td>
              <td class="px-4 py-2">{{ Number(balance.allDeposits) / 10 ** Number(balance.token.decimals) }}</td>
              <td class="px-4 py-2">
                <RouterLink v-if="balance.onlineState" :to="`/admin/${balance.chain}/online`">
                  <Button size="small">{{ balance.onlineState }}</Button>
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </MainPanel>
  </AuthScreen>
</template>
