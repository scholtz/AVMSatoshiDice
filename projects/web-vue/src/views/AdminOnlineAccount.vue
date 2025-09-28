<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { useToast } from "primevue";
import { onMounted, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import H1 from "../components/H1.vue";
import MainPanel from "../components/MainPanel.vue";
import { useI18n } from "vue-i18n";
import { useAppStore } from "../stores/app";
const toast = useToast();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { activeAddress, transactionSigner } = useWallet();
interface IParticipationData {
  fee: number;
  voteFirst: number;
  voteLast: number;
  voteKeyDilution: number;
  selectionKey: string;
  voteKey: string;
  stateProofKey: string;
}
const chainId = route.params.chain as
  | "mainnet-v1.0"
  | "aramidmain-v1.0"
  | "testnet-v1.0"
  | "betanet-v1.0"
  | "voimain-v1.0"
  | "fnet-v1"
  | "dockernet-v1";
const state = reactive({
  address: "",
  participationData: {
    fee: 1000,
    voteFirst: 0,
    voteLast: 0,
    voteKeyDilution: 0,
    selectionKey: "",
    voteKey: "",
    stateProofKey: "",
  } as IParticipationData,
});

onMounted(() => {
  if (!activeAddress.value) return;
  const client = appStore.getAppClient(activeAddress.value, transactionSigner, chainId);
  state.address = algosdk.encodeAddress(client.appAddress.publicKey);
});

const makeOnlineClick = async () => {
  try {
    if (!activeAddress.value) return;
    const client = appStore.getAppClient(activeAddress.value, transactionSigner, chainId);
    await client.send.sendOnlineKeyRegistration({
      args: {
        fee: BigInt(state.participationData.fee),
        selectionKey: new Uint8Array(Buffer.from(state.participationData.selectionKey, "base64")),
        stateProofKey: new Uint8Array(Buffer.from(state.participationData.stateProofKey, "base64")),
        voteFirst: BigInt(state.participationData.voteFirst),
        voteKey: new Uint8Array(Buffer.from(state.participationData.voteKey, "base64")),
        voteKeyDilution: BigInt(state.participationData.voteKeyDilution),
        voteLast: BigInt(state.participationData.voteLast),
      },
    });
    router.push("/admin");
  } catch (e: any) {
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
  <AuthScreen class="flex flex-col items-center justify-center w-full">
    <MainPanel class="w-200 text-white p-6">
      <H1>{{ $t('admin.makeScAccountOnline') }}</H1>
      <code class="my-5 border-1 rounded bg-teal-900 p-5 block">
        ADDRESS={{ state.address }} ROUNDS=5000000 ./create-participation-key.sh
      </code>
      <div v-if="state && state.participationData">
        <div class="field grid">
          <label for="voteFirst" class="col-12 mb-2">{{ $t('admin.firstVoteRound') }}</label>
          <div class="col-12">
            <InputNumber inputId="voteFirst" v-model="state.participationData.voteFirst" class="w-full" />
          </div>
        </div>
        <div class="field grid">
          <label for="voteLast" class="col-12 mb-2">{{ $t('admin.lastVoteRound') }}</label>
          <div class="col-12">
            <InputNumber inputId="voteLast" v-model="state.participationData.voteLast" class="w-full" />
          </div>
        </div>
        <div class="field grid">
          <label for="voteKeyDilution" class="col-12 mb-2">{{ $t('admin.voteKeyDilution') }}</label>
          <div class="col-12">
            <InputNumber inputId="voteKeyDilution" v-model="state.participationData.voteKeyDilution" class="w-full" />
          </div>
        </div>
        <div class="field grid">
          <label for="selectionKey" class="col-12 mb-2">{{ $t('admin.selectionKey') }}</label>
          <div class="col-12">
            <InputText id="selectionKey" v-model="state.participationData.selectionKey" class="w-full" />
          </div>
        </div>
        <div class="field grid">
          <label for="voteKey" class="col-12 mb-2">{{ $t('admin.voteKey') }}</label>
          <div class="col-12">
            <InputText id="voteKey" v-model="state.participationData.voteKey" class="w-full" />
          </div>
        </div>
        <div class="field grid">
          <label for="stateProofKey" class="col-12 mb-2">{{ $t('admin.stateProofKey') }}</label>
          <div class="col-12">
            <InputText id="stateProofKey" v-model="state.participationData.stateProofKey" class="w-full" />
          </div>
        </div>
        <div class="field grid">
          <label for="fee" class="col-12 mb-2">{{ $t('admin.networkFees') }}</label>
          <div class="col-12">
            <InputNumber inputId="fee" v-model="state.participationData.fee" class="w-full" />
          </div>
        </div>
        <Button class="my-4" @click="makeOnlineClick">{{ $t('admin.makeAccountOnline') }}</Button>
      </div>
    </MainPanel>
  </AuthScreen>
</template>
