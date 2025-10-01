<script setup lang="ts">
import { WalletId, useNetwork, useWallet, type Wallet } from "@txnlab/use-wallet-vue";
import { onMounted, reactive, ref, watch } from "vue";
import H2 from "../components/H2.vue";
import { useAppStore } from "../stores/app";
import MainButton from "./MainButton.vue";
import MainPanel from "./MainPanel.vue";
const appStore = useAppStore();
const state = reactive({
  wallets: [] as Wallet[],
});
const { setActiveNetwork, networkConfig } = useNetwork();
console.log("networkConfig", networkConfig);
onMounted(() => {
  selectChainClick(Object.values(appStore.state.chains).find((c) => c.code == store.state.env));
});

const { wallets, activeAddress } = useWallet();
const isMagicLink = (wallet: Wallet) => wallet.id === WalletId.MAGIC;
const getConnectArgs = (wallet: Wallet) => {
  if (isMagicLink(wallet)) {
    return { email: magicEmail.value };
  }
  return undefined;
};
const isConnectDisabled = (wallet: Wallet) => wallet.isConnected || (isMagicLink(wallet) && !isEmailValid());
const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(magicEmail.value);

const magicEmail = ref("");

const setActiveAccount = (event: Event, wallet: Wallet) => {
  const target = event.target as HTMLSelectElement;
  wallet.setActiveAccount(target.value);
};

const setActiveWallet = async (wallet: Wallet) => {
  await wallet.setActive();
};

watch(
  () => wallets,
  () => {
    selectChainClick(Object.values(appStore.state.chains).find((c) => c.code == store.state.env));
  },
);

const store = useAppStore();
const selectChainClick = (chain: any) => {
  if (!chain) return;
  if (chain.code) {
    store.setEnv(chain.code);
  }
  for (const networkId in networkConfig) {
    if (networkConfig[networkId].genesisId == chain.code) {
      setActiveNetwork(networkId);
    }
  }

  store.state.algodHost = chain.algodHost;
  store.state.algodPort = chain.algodPort;
  store.state.algodToken = chain.algodToken;
  store.state.indexerHost = chain.indexerHost;
  store.state.indexerPort = chain.indexerPort;
  store.state.indexerToken = chain.indexerToken;
  store.state.env = chain.code;
  store.state.tokenName = chain.tokenName;
  store.state.nativeTokenName = chain.tokenName;
  store.state.appId = chain.appId;
  const newWallets: Wallet[] = [];
  console.log("chain.wallets", chain.wallets, wallets.value);
  for (const walletId of chain.wallets) {
    const w = wallets.value.find((w) => w.id == walletId);
    console.log("w", w);
    if (w) {
      newWallets.push(w);
    }
  }
  state.wallets = newWallets;
};
</script>
<template>
  <div v-if="activeAddress" class="w-full">
    <slot />
  </div>
  <div v-else class="flex flex-col items-center justify-center w-full">
    <div class="flex-1 w-full">
      <MainPanel class="w-200 text-white p-6">
        <H2 class="text-center">{{ $t('wallet.blockchainSelection') }}</H2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <MainButton
            v-for="chain in Object.values(appStore.state.chains)"
            :key="chain.code"
            :class="store?.state?.env == chain.code ? 'bg-teal-800  hover:bg-teal-700 !text-teal-100' : ''"
            class="flex justify-center items-center w-full"
            @click="selectChainClick(chain)"
          >
            {{ chain.name }}
          </MainButton>
        </div>

        <H2 v-if="state.wallets.length > 0" class="text-center">{{ $t('wallet.walletSelection') }}</H2>
        <div v-if="state.wallets.length > 0">
          <div class="bg-background-dark grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 rounded-lg p-10">
            <div v-for="wallet in state.wallets" :key="wallet.id">
              <MainButton
                class="flex justify-center items-center w-full"
                v-if="!wallet.isActive && wallet.isConnected"
                @click="setActiveWallet(wallet)"
                :disabled="!wallet.isConnected || wallet.isActive"
              >
                <img :src="wallet.metadata.icon" width="40" class="rounded mx-2" />
                {{ wallet.metadata.name }} {{ $t('wallet.setActive') }}
              </MainButton>
              <MainButton
                v-else
                class="flex justify-center items-center w-full"
                @click="wallet.connect(getConnectArgs(wallet))"
                :disabled="isConnectDisabled(wallet)"
              >
                <img :src="wallet.metadata.icon" width="40" class="rounded mx-2" />
                {{ $t('wallet.connect') }} {{ wallet.metadata.name }} <span v-if="wallet.isActive">{{ $t('wallet.active') }}</span>
              </MainButton>
              <MainButton
                class="flex justify-center items-center w-full"
                @click="wallet.disconnect()"
                :disabled="!wallet.isConnected"
                v-if="wallet.isConnected"
              >
                <img :src="wallet.metadata.icon" width="40" class="rounded mx-2" />
                {{ wallet.metadata.name }} {{ $t('common.disconnect') }} <span v-if="wallet.isActive">{{ $t('wallet.active') }}</span>
              </MainButton>
              <!-- <button v-else @click="sendTransaction(wallet)" :disabled="isSending">
            {{ isSending ? 'Sending Transaction...' : 'Send Transaction' }}
          </button> -->

              <div v-if="isMagicLink(wallet)" class="input-group">
                <label for="magic-email">{{ $t('wallet.email') }}</label>
                <input
                  id="magic-email"
                  type="email"
                  v-model="magicEmail"
                  :placeholder="$t('wallet.enterEmail')"
                  :disabled="wallet.isConnected"
                />
              </div>

              <div v-if="wallet.isActive && wallet.accounts.length > 0">
                <select @change="(event) => setActiveAccount(event, wallet)">
                  <option v-for="account in wallet.accounts" :key="account.address" :value="account.address">
                    {{ account.address }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </MainPanel>
    </div>
  </div>
</template>
