<script setup lang="ts">
import { AlgoAmount } from "@algorandfoundation/algokit-utils/types/amount";
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk, { makeAssetTransferTxnWithSuggestedParamsFromObject, makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { getArc200Client } from "arc200-client";
import { AvmSatoshiDiceClient } from "avm-satoshi-dice";
import { useToast } from "primevue";
import { computed, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { getAssetAsync } from "../../scripts/algorand/getAssetAsync";
import { useAppStore } from "../../stores/app";
import { useGameStore } from "../../stores/game";
import AppButton from "../common/AppButton.vue";
import AppLoader from "../common/AppLoader.vue";
const toast = useToast();
const router = useRouter();
const gameStore = useGameStore();
const appStore = useAppStore();

const { activeAddress, transactionSigner } = useWallet();
const state = reactive({
  chain: appStore.state.env,
  assetId: 0,
  initialDeposit: 0,
  winRatio: 95,
  tokenType: "native" as "native" | "asa" | "arc200",
  isCreating: false,
});

onMounted(async () => {
  await appStore.updateBalance(state.assetId, state.tokenType, activeAddress, transactionSigner, appStore.state.env);
  await appStore.loadAllUserAssets(activeAddress);
  // check all user's tokens
});

watch(
  () => state.chain,
  async () => {
    state.tokenType = "native";
    state.assetId = 0;
    await appStore.setEnv(state.chain);
    await appStore.updateBalance(state.assetId, state.tokenType, activeAddress, transactionSigner, appStore.state.env);
  },
);

watch(
  () => state.assetId,
  async () => {
    await appStore.updateBalance(state.assetId, state.tokenType, activeAddress, transactionSigner, appStore.state.env);
  },
);
watch(
  () => state.tokenType,
  async () => {
    await appStore.updateBalance(state.assetId, state.tokenType, activeAddress, transactionSigner, appStore.state.env);
  },
);

const tokenBalance = computed(() => {
  return Number(appStore.state.userBalance) / 10 ** appStore.state.assetDecimals;
});

const canCreateGame = computed(() => {
  return state.initialDeposit > 0 && tokenBalance.value > state.initialDeposit;
});

const handleSubmit = async () => {
  try {
    if (!canCreateGame.value) throw Error("Please select correct parameters");
    if (!activeAddress.value) throw Error("Address not selected");
    state.isCreating = true;
    const algorandClient = appStore.getAlgorandClient(appStore.state.env);
    const client = new AvmSatoshiDiceClient({
      algorand: algorandClient,
      appId: appStore.state.appId,
      defaultSender: algosdk.decodeAddress(activeAddress.value),
      defaultSigner: transactionSigner,
    });
    console.log("client", client, client.appId, algosdk.encodeAddress(client.appAddress.publicKey), activeAddress.value);
    const winRatioUint = BigInt(state.winRatio * 10000);
    const amountUint = BigInt(state.initialDeposit * 10 ** appStore.state.assetDecimals);
    if (state.tokenType == "native") {
      console.log("executing native deposit");
      const ret = await client.send.createGameWithNativeToken({
        args: {
          txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
            amount: amountUint,
            receiver: algosdk.encodeAddress(client.appAddress.publicKey),
            sender: activeAddress.value,
            suggestedParams: await client.algorand.client.algod.getTransactionParams().do(),
          }),
          winRatio: winRatioUint,
        },
      });
      if (ret.return) {
        gameStore.updateGame({
          game: ret.return,
          id: `${activeAddress.value}-${state.assetId}`,
          idObj: { assetId: BigInt(state.assetId), owner: activeAddress.value },
          token: await getAssetAsync(state.assetId, algorandClient),
          chain: appStore.state.env,
        });
      }
      console.log("executing native deposit done");
    }
    if (state.tokenType == "asa") {
      console.log("executing asa deposit");
      const group = await client
        .newGroup()
        .optInToAsa({
          args: {
            assetId: state.assetId,
            txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
              amount: 10_000_000,
              receiver: algosdk.encodeAddress(client.appAddress.publicKey),
              sender: activeAddress.value,
              suggestedParams: await client.algorand.client.algod.getTransactionParams().do(),
            }),
          },
          staticFee: AlgoAmount.MicroAlgo(2000),
        })
        .createGameWithAsaToken({
          args: {
            txnDeposit: makeAssetTransferTxnWithSuggestedParamsFromObject({
              assetIndex: state.assetId,
              amount: amountUint,
              receiver: algosdk.encodeAddress(client.appAddress.publicKey),
              sender: activeAddress.value,
              suggestedParams: await client.algorand.client.algod.getTransactionParams().do(),
            }),
            winRatio: winRatioUint,
          },
        })
        .send({});

      if (group.returns[1]) {
        gameStore.updateGame({
          game: group.returns[1],
          id: `${activeAddress.value}-${state.assetId}`,
          idObj: { assetId: BigInt(state.assetId), owner: activeAddress.value },
          token: await getAssetAsync(state.assetId, appStore.getAlgorandClient(appStore.state.env)),
          chain: appStore.state.env,
        });
      }
    }
    if (state.tokenType == "arc200") {
      console.log("executing arc200 deposit");

      const arc200 = getArc200Client({
        algorand: algorandClient,
        appId: BigInt(state.assetId),
        defaultSender: activeAddress.value,
        defaultSigner: transactionSigner,
        appName: undefined,
        approvalSourceMap: undefined,
        clearSourceMap: undefined,
      });

      const approveTx = await arc200.createTransaction.arc200Approve({
        args: {
          spender: algosdk.encodeAddress(client.appAddress.publicKey),
          value: amountUint,
        },
      });

      const group = await client
        .newGroup()
        .addTransaction(approveTx.transactions[0], transactionSigner)
        .createGameWithArc200Token({
          args: {
            amount: amountUint,
            assetId: BigInt(state.assetId),
            winRatio: winRatioUint,
          },
          staticFee: AlgoAmount.MicroAlgo(2000),
          maxFee: AlgoAmount.MicroAlgo(4000),
        })
        .send();

      console.log("executing arc200 deposit done", group);
      if (group.returns[0]) {
        gameStore.updateGame({
          game: group.returns[0],
          id: `${activeAddress.value}-${state.assetId}`,
          idObj: { assetId: BigInt(state.assetId), owner: activeAddress.value },
          token: await getAssetAsync(state.assetId, appStore.getAlgorandClient(appStore.state.env)),
          chain: appStore.state.env,
        });
      }
    }

    state.isCreating = false;
    router.push(`/game/${state.chain}/${activeAddress.value}-${state.assetId}`);
  } catch (e: any) {
    state.isCreating = false;
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
    <div class="bg-gradient-to-r from-primary-900 to-background-dark p-4 border-b border-gray-800">
      <h3 class="text-lg font-semibold text-white">{{ $t('game.createNewGame') }}</h3>
    </div>

    <div class="p-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <p>
          {{ $t('game.selectBlockchainToken') }}
        </p>
        <div class="grid grid-cols-1 gap-6" :class="state.tokenType == 'native' ? 'md:grid-cols-3' : 'md:grid-cols-4'">
          <div>
            <label class="label" for="tokenType">{{ $t('game.chain') }}</label>
            <select class="input w-full" id="tokenType" v-model="state.chain">
              <option v-for="chain in Object.values(appStore.state.chains)" :key="chain.code" :value="chain.code">{{ chain.name }}</option>
            </select>
          </div>
          <div>
            <label class="label" for="tokenType">{{ $t('game.tokenType') }}</label>
            <select class="input w-full" id="tokenType" v-model="state.tokenType">
              <option value="native">{{ $t('game.nativeTokenType') }}</option>
              <option value="asa">{{ $t('game.asaTokenType') }}</option>
              <option value="arc200">{{ $t('game.arc200TokenType') }}</option>
            </select>
          </div>
          <div v-if="state.tokenType == 'arc200'">
            <label class="label" for="assetId">{{ $t('game.arc200AppId') }}</label>
            <input
              id="assetId"
              v-model="state.assetId"
              type="text"
              class="input w-full"
              :placeholder="$t('game.enterAssetId')"
              required
            />
          </div>
          <div v-if="state.tokenType == 'asa'">
            <label class="label" for="assetId">{{ $t('game.asaId') }}</label>

            <input
              v-if="appStore.state.assetHolding.length == 0"
              id="assetId"
              v-model="state.assetId"
              type="text"
              class="input w-full"
              :placeholder="$t('game.enterAssetId')"
              required
            />
            <select
              v-else
              class="input w-full"
              id="tokenType"
              v-model="state.assetId"
              :placeholder="$t('game.selectAsaFromAccount')"
              :title="$t('game.addAsaToList')"
            >
              <option v-for="asset in appStore.state.assetHolding" :value="asset.assetId">{{ asset.assetName }}</option>
            </select>
          </div>

          <div>
            <label class="label" for="initialDeposit">{{ $t('game.initialDeposit') }} ({{ appStore.state.tokenName }})</label>
            <input
              id="initialDeposit"
              v-model.number="state.initialDeposit"
              type="number"
              min="1"
              :max="tokenBalance"
              class="input w-full"
              required
            />
            <div class="mt-1 text-sm text-gray-400">{{ $t('game.yourBalance') }}: {{ tokenBalance }} {{ appStore.state.tokenName }}</div>
            <div v-if="state.initialDeposit > tokenBalance" class="mt-1 text-sm text-error-500">{{ $t('game.exceedsBalance') }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div>
            <label class="label" for="winRatio">Win Ratio ({{ state.winRatio }}%)</label>
            <input
              id="winRatio"
              v-model.number="state.winRatio"
              type="range"
              min="90"
              max="100"
              step="0.0001"
              class="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
            />
            <div class="flex justify-between text-gray-400 text-xs mt-1">
              <span>90%</span>
              <span>95%</span>
              <span>100%</span>
            </div>
          </div>
          <div>
            <input
              id="winRatioInput"
              v-model.number="state.winRatio"
              type="number"
              min="90"
              max="100"
              step="0.0001"
              class="input w-full"
              required
            />
          </div>
        </div>

        <div class="bg-background-dark rounded-lg p-4 mb-4">
          <h4 class="font-medium text-white mb-3">Game Configuration Summary</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex justify-between">
              <span class="text-gray-400">Token type:</span>
              <span class="text-white" v-if="state.tokenType == 'arc200'">ARC200</span>
              <span class="text-white" v-if="state.tokenType == 'asa'">ASA</span>
              <span class="text-white" v-if="state.tokenType == 'native'">{{ appStore.state.tokenName }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-400">Token:</span>
              <span class="text-white">{{ appStore.state.tokenName }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-400">Initial Balance:</span>
              <span class="text-white">{{ state.initialDeposit.toLocaleString() }} {{ appStore.state.tokenName }}</span>
            </div>

            <div class="flex justify-between">
              <span class="text-gray-400">Win Ratio:</span>
              <span class="text-white">{{ state.winRatio.toFixed(4) }}%</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-4">
          <AppButton type="button" variant="outline" @click="router.push('/')"> Cancel </AppButton>

          <AppButton type="submit" variant="primary" :disabled="!canCreateGame || state.isCreating">
            <AppLoader v-if="state.isCreating" size="sm" color="white" class="mr-2" />
            {{ state.isCreating ? "Creating Game..." : "Create Game" }}
          </AppButton>
        </div>
      </form>
    </div>
  </MainPanel>
</template>
