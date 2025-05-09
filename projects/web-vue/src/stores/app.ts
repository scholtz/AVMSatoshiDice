import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";
import { getArc200Client } from "arc200-client";
import { defineStore } from "pinia";
import { ComputedRef, reactive } from "vue";

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
  tokenType: "native" | "asa" | "arc200";
  userBalance: bigint;
  assetDecimals: number;
  assetHolding: IAssetHolding[];
}
const defaultState: IState = {
  appId: 4870n,
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

  function getBalanceForToken(tokenId: string | number | bigint): number {
    return Number(state.token2balance[tokenId.toString()] || 0n);
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
  const updateBalance = async (
    assetId: string | number | bigint,
    tokenType: "native" | "asa" | "arc200",
    activeAddress: ComputedRef<string | null>,
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
  ) => {
    //state.token2balance[tokenId] = newBalance;
    state.assetId = BigInt(assetId);
    state.tokenType = tokenType;

    if (!activeAddress.value) {
      state.userBalance = 0n;
      return;
    }

    const algorandClient = getAlgorandClient();
    if (state.tokenType == "native") {
      const info = await algorandClient.client.algod.accountInformation(activeAddress.value).do();
      state.userBalance = info.amount;
      state.assetDecimals = 6;
    }
    if (state.tokenType == "asa" && state.assetId > 0n) {
      const info = await algorandClient.client.algod.accountInformation(activeAddress.value).do();
      state.assetHolding =
        info.assets?.map((i) => {
          return { amount: i.amount, assetId: i.amount, isFrozen: i.isFrozen };
        }) ?? [];
      if (info.assets) {
        state.userBalance = info.assets[Number(state.assetId)].amount ?? 0n;
      }

      const assetInfo = await algorandClient.client.algod.getAssetByID(state.assetId).do();
      if (assetInfo?.params) {
        state.assetDecimals = assetInfo.params.decimals;
        if (assetInfo.params.name) {
          state.tokenName = assetInfo.params.name;
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
      state.userBalance = await arc200.arc200BalanceOf({ args: { owner: activeAddress.value } });
    }
    console.log("updateBalance", state);
  };
  return { state, getBalanceForToken, updateBalance, getAlgorandClient };
});

export const resetConfiguration = () => {
  localStorage.clear();
  const app = useAppStore();
  app.state = { ...defaultState };
};
