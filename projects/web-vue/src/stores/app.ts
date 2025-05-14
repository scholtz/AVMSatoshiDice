import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { WalletId } from "@txnlab/use-wallet-vue";
import algosdk from "algosdk";
import { getArc200Client } from "arc200-client";
import { AvmSatoshiDiceClient } from "avm-satoshi-dice";
import { defineStore } from "pinia";
import { ComputedRef, reactive } from "vue";
import { getAssetAsync } from "../scripts/algorand/getAssetAsync";
import { IChainCode2AppClient } from "../types/IChainCode2AppClient";

type UserStruct = {
  balance: bigint;
  configuration: string;
};

type AppConfigurationV1 = {
  assets: bigint[];
  apps: bigint[];
  addresses: string[];
  version: bigint;
};
interface IToken2Balance {
  [key: string]: bigint;
}
interface IAssetHolding {
  assetName: string;
  decimals: number;
  /**
   * (a) number of units held.
   */
  amount: bigint;
  /**
   * Asset ID of the holding.
   */
  assetId: bigint;
  /**
   * (f) whether or not the holding is frozen.
   */
  isFrozen: boolean;
}
export interface IState {
  appId: bigint;
  algodHost: string;
  algodPort: number;
  algodToken: string;
  indexerHost: string;
  indexerPort: number;
  indexerToken: string;
  env: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1";
  tokenName: string;
  nativeTokenName: string;
  boxData: UserStruct | null;
  token2balance: IToken2Balance;
  configuration: AppConfigurationV1 | null;

  assetId: bigint;
  tokenType: "native" | "asa" | "arc200" | "other";
  userBalance: bigint;
  assetDecimals: number;
  assetHolding: IAssetHolding[];
  chains: IChainCode2Chain;
}
interface IChain {
  appId: bigint;
  name: string;
  code: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1";
  algodHost: string;
  algodPort: number;
  algodToken: string;
  indexerHost: string;
  indexerPort: number;
  indexerToken: string;
  tokenName: string;
  wallets: string[];
}
interface IChainCode2Chain {
  [key: string]: IChain;
}
const defaultState: IState = {
  appId: 6169n,
  // algodHost: "https://mainnet-api.algonode.cloud",
  // algodPort: 443,
  // algodToken: "",
  // indexerHost: "https://mainnet-api.algonode.cloud",
  // indexerPort: 443,
  // indexerToken: "",
  // env: "mainnet-v1.0",
  algodHost: "http://localhost",
  algodPort: 4001,
  algodToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  indexerHost: "http://localhost",
  indexerPort: 8980,
  indexerToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  env: "dockernet-v1",
  tokenName: "ALGO",
  nativeTokenName: "ALGO",
  boxData: null,
  configuration: null,
  token2balance: {},
  assetId: 0n,
  tokenType: "native",
  userBalance: 0n,
  assetDecimals: 6,
  assetHolding: [],
  chains: {
    "mainnet-v1.0": {
      appId: 2987731428n,
      name: "Algorand Mainnet",
      code: "mainnet-v1.0",
      algodHost: "https://mainnet-api.4160.nodely.dev",
      algodPort: 443,
      algodToken: "",
      indexerHost: "https://mainnet-idx.4160.nodely.dev",
      indexerPort: 443,
      indexerToken: "",
      tokenName: "ALGO",
      wallets: [WalletId.BIATEC, WalletId.DEFLY, WalletId.EXODUS, WalletId.PERA, WalletId.KIBISIS, WalletId.WALLETCONNECT, WalletId.LUTE],
    },
    "voimain-v1.0": {
      appId: 40051512n,
      name: "Voi Mainnet",
      code: "voimain-v1.0",
      algodHost: "https://mainnet-api.voi.nodely.dev",
      algodPort: 443,
      algodToken: "",
      indexerHost: "https://mainnet-idx.voi.nodely.dev",
      indexerPort: 443,
      indexerToken: "",
      tokenName: "VOI",
      wallets: [WalletId.BIATEC, WalletId.KIBISIS, WalletId.DEFLY, WalletId.WALLETCONNECT, WalletId.LUTE],
    },
    "aramidmain-v1.0": {
      appId: 187516n,
      name: "Aramid Mainnet",
      code: "aramidmain-v1.0",
      algodHost: "https://algod.aramidmain.a-wallet.net",
      algodPort: 443,
      algodToken: "",
      indexerHost: "https://aramidindexer.de-k1.a-wallet.net",
      indexerPort: 443,
      indexerToken: "",
      tokenName: "Aramid",
      wallets: [WalletId.BIATEC, WalletId.DEFLY, WalletId.WALLETCONNECT],
    },
    "testnet-v1.0": {
      appId: 739400482n,
      name: "Algorand Testnet",
      code: "testnet-v1.0",
      algodHost: "https://testnet-api.4160.nodely.dev",
      algodPort: 443,
      algodToken: "",
      indexerHost: "https://testnet-idx.4160.nodely.dev",
      indexerPort: 443,
      indexerToken: "",
      tokenName: "TestA",
      wallets: [WalletId.BIATEC, WalletId.DEFLY, WalletId.PERA, WalletId.WALLETCONNECT, WalletId.LUTE],
    },
    // "dockernet-v1": {
    //   appId: 9982n,
    //   name: "Localnet",
    //   code: "dockernet-v1",
    //   algodHost: "http://localhost",
    //   algodPort: 4001,
    //   algodToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    //   indexerHost: "http://localhost",
    //   indexerPort: 8980,
    //   indexerToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    //   tokenName: "local",
    //   wallets: [WalletId.BIATEC, WalletId.KIBISIS, WalletId.DEFLY, WalletId.PERA, WalletId.WALLETCONNECT],
    // },
  },
};
export const useAppStore = defineStore("app", () => {
  let lastTheme = localStorage.getItem("lastTheme");
  if (!lastTheme) lastTheme = "lara-dark-teal";
  const initState = { ...defaultState };
  const state = reactive(initState);

  function getBalanceForToken(
    tokenId: string | number | bigint,
    chainId: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ): number {
    return Number(state.token2balance[`${chainId}-${tokenId.toString()}`] || 0n);
  }
  const getAppId = (
    chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ) => {
    return state.chains[chain].appId;
  };
  const getAppClients = (
    activeAddress: string,
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
  ) => {
    if (!activeAddress) throw Error("activeAddress is empty");

    const ret: IChainCode2AppClient = {};

    Object.values(state.chains).map((c) => {
      ret[c.code] = new AvmSatoshiDiceClient({
        algorand: getAlgorandClient(c.code),
        appId: getAppId(c.code),
        defaultSender: algosdk.decodeAddress(activeAddress),
        defaultSigner: transactionSigner,
      });
    });
    return ret;
  };
  const getAppClient = (
    activeAddress: string,
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
    chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ): AvmSatoshiDiceClient => {
    if (!activeAddress) throw Error("activeAddress is empty");

    return new AvmSatoshiDiceClient({
      algorand: getAlgorandClient(chain),
      appId: getAppId(chain),
      defaultSender: algosdk.decodeAddress(activeAddress),
      defaultSigner: transactionSigner,
    });
  };
  const getAlgorandClient = (
    chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ) => {
    console.log("client for ", chain);
    return AlgorandClient.fromConfig({
      algodConfig: {
        server: state.chains[chain].algodHost,
        port: state.chains[chain].algodPort,
        token: state.chains[chain].algodToken,
      },
      indexerConfig: {
        server: state.chains[chain].indexerHost,
        port: state.chains[chain].indexerPort,
        token: state.chains[chain].indexerToken,
      },
    });
  };
  const loadAllUserAssets = async (activeAddress: ComputedRef<string | null>) => {
    if (!activeAddress.value) {
      return;
    }
    const algorandClient = getAlgorandClient(state.env);
    const info = await algorandClient.client.algod.accountInformation(activeAddress.value).do();
    const allAssets = [];
    for (const asset of info?.assets ?? []) {
      const assetInfo = await getAssetAsync(asset.assetId, algorandClient);
      const assetData = {
        amount: asset.amount,
        assetId: asset.assetId,
        isFrozen: asset.isFrozen,
        assetName: assetInfo.name ?? "ASA" + asset.assetId,
        decimals: assetInfo.decimals,
      };
      allAssets.push(assetData);
    }
    state.assetHolding = allAssets;
  };
  const updateBalance = async (
    assetId: string | number | bigint,
    tokenType: "native" | "asa" | "arc200" | "other",
    activeAddress: ComputedRef<string | null>,
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
    chainId: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ) => {
    console.log("updating balance", activeAddress.value, assetId, tokenType);
    console.log("activeAddress.value", activeAddress.value);
    //state.
    const extendedTokenId = `${chainId}-${assetId}`;
    const assetIdBigint = BigInt(assetId);
    state.assetId = assetIdBigint;
    state.tokenType = tokenType;

    if (!activeAddress.value) {
      state.userBalance = 0n;
      return;
    }
    const algorandClient = getAlgorandClient(chainId);
    if (state.tokenType == "native") {
      const info = await algorandClient.client.algod.accountInformation(activeAddress.value).do();
      console.log("info", info);
      state.userBalance = info.amount;
      state.token2balance[extendedTokenId] = info.amount;
      state.assetDecimals = 6;
    }
    if (state.tokenType == "asa" && state.assetId > 0n) {
      const info = await algorandClient.client.algod.accountInformation(activeAddress.value).do();
      console.log("info", info);
      if (info.assets) {
        console.log(
          "info.assets.find((a) => a.assetId == assetIdBigint)",
          assetIdBigint,
          info.assets.find((a) => a.assetId == assetIdBigint),
        );
        state.userBalance = info.assets.find((a) => a.assetId == assetIdBigint)?.amount ?? 0n;
        state.token2balance[extendedTokenId] = state.userBalance;
      }

      const assetInfo = await getAssetAsync(state.assetId, algorandClient);
      if (assetInfo) {
        state.assetDecimals = assetInfo.decimals;
        if (assetInfo.name) {
          state.tokenName = assetInfo.name;
        }
      }
    }
    if (state.tokenType == "arc200" && state.assetId > 0) {
      const appInfo = await algorandClient.client.algod.getApplicationByID(state.assetId).do();
      console.log("appInfo", appInfo);
      const arc200 = getArc200Client({
        algorand: algorandClient,
        appId: state.assetId,
        defaultSender: activeAddress.value,
        defaultSigner: transactionSigner,
        appName: undefined,
        approvalSourceMap: undefined,
        clearSourceMap: undefined,
      });
      console.log("arc200", arc200);
      const balance = await arc200.arc200BalanceOf({ args: { owner: activeAddress.value } });
      state.userBalance = balance;
      state.token2balance[extendedTokenId] = balance;
      const assetInfo = await getAssetAsync(state.assetId, algorandClient);
      if (assetInfo) {
        state.assetDecimals = assetInfo.decimals;
        if (assetInfo.name) {
          state.tokenName = assetInfo.name;
        }
      }
      console.log("assetInfo", assetInfo);
    }
    console.log("updateBalance", state);
  };
  const tokenTypeToText = (type: "native" | "asa" | "arc200" | "other") => {
    switch (type) {
      case "arc200":
        return "ARC200";
      case "asa":
        return "ASA";
      case "native":
        return "Native token";
    }
    return "Unknown";
  };
  const setEnv = (
    env: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ) => {
    console.log("client for", env);
    state.algodHost = state.chains[env].algodHost;
    state.algodPort = state.chains[env].algodPort;
    state.algodToken = state.chains[env].algodToken;

    state.indexerHost = state.chains[env].indexerHost;
    state.indexerPort = state.chains[env].indexerPort;
    state.indexerToken = state.chains[env].indexerToken;

    state.appId = state.chains[env].appId;
    state.tokenName = state.chains[env].tokenName;

    state.env = env;
  };
  return {
    state,
    setEnv,
    getAppId,
    loadAllUserAssets,
    getBalanceForToken,
    updateBalance,
    getAlgorandClient,
    getAppClient,
    getAppClients,
    tokenTypeToText,
  };
});

export const resetConfiguration = () => {
  localStorage.clear();
  const app = useAppStore();
  app.state = { ...defaultState };
};
