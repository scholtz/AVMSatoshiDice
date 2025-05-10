import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";
import { getArc200Client } from "arc200-client";
import { defineStore } from "pinia";
import { ComputedRef, reactive } from "vue";
import { getAssetAsync } from "../scripts/algorand/getAssetAsync";

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
}
const defaultState: IState = {
  appId: 6029n,
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
  const getAlgorandClient = () => {
    return AlgorandClient.fromConfig({
      algodConfig: {
        server: state.algodHost,
        port: state.algodPort,
        token: state.algodToken,
      },
      indexerConfig: {
        server: state.indexerHost,
        port: state.indexerPort,
        token: state.indexerToken,
      },
    });
  };
  const loadAllUserAssets = async (activeAddress: ComputedRef<string | null>) => {
    if (!activeAddress.value) {
      return;
    }
    const algorandClient = getAlgorandClient();
    const info = await algorandClient.client.algod.accountInformation(activeAddress.value).do();
    const allAssets = [];
    for (let asset of info?.assets ?? []) {
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
    const algorandClient = getAlgorandClient();
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
      const arc200 = getArc200Client({
        algorand: algorandClient,
        appId: state.assetId,
        defaultSender: activeAddress.value,
        defaultSigner: transactionSigner,
        appName: undefined,
        approvalSourceMap: undefined,
        clearSourceMap: undefined,
      });
      const balance = await arc200.arc200BalanceOf({ args: { owner: activeAddress.value } });
      state.userBalance = balance;
      state.token2balance[extendedTokenId] = balance;
    }
    console.log("updateBalance", state);
  };
  return { state, loadAllUserAssets, getBalanceForToken, updateBalance, getAlgorandClient };
});

export const resetConfiguration = () => {
  localStorage.clear();
  const app = useAppStore();
  app.state = { ...defaultState };
};
