import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { IAssetParams } from "../../types/IAssetParams";

interface INetworkAssetCache {
  [key: string]: IAssetCache;
}
interface IAssetCache {
  [key: string]: IAssetParams;
}

const cache: INetworkAssetCache = {};

export const getAssetAsync = async (assetId: string | number | bigint, avmClient: AlgorandClient): Promise<IAssetParams> => {
  const network = await avmClient.client.network();
  const assetBigInt = BigInt(assetId);
  const assetStr = assetBigInt.toString();
  if (cache[network.genesisId] && cache[network.genesisId][assetStr]) {
    return cache[network.genesisId][assetStr];
  }
  if (assetBigInt == 0n) {
    if (network.genesisId == "mainnet-v1.0") {
      return {
        id: 0n,
        type: "native",
        creator: "",
        decimals: 6,
        total: 10_000_000_000_000_000n,
        clawback: undefined,
        defaultFrozen: false,
        freeze: undefined,
        manager: undefined,
        metadataHash: undefined,
        name: "Algorand",
        nameB64: new Uint8Array(Buffer.from("Algorand", "ascii")),
        reserve: undefined,
        unitName: "Algo",
        unitNameB64: new Uint8Array(Buffer.from("Algo", "ascii")),
        url: "https://www.algorand.com",
        urlB64: new Uint8Array(Buffer.from("https://www.algorand.com", "ascii")),
      };
    } else if (network.genesisId == "voimain-v1.0") {
      return {
        id: 0n,
        type: "native",
        creator: "",
        decimals: 6,
        total: 10_000_000_000_000_000n,
        clawback: undefined,
        defaultFrozen: false,
        freeze: undefined,
        manager: undefined,
        metadataHash: undefined,
        name: "Voi Chain",
        nameB64: new Uint8Array(Buffer.from("Voi Chain", "ascii")),
        reserve: undefined,
        unitName: "Voi",
        unitNameB64: new Uint8Array(Buffer.from("Voi", "ascii")),
        url: "https://www.voi.network",
        urlB64: new Uint8Array(Buffer.from("https://www.voi.network", "ascii")),
      };
    } else if (network.genesisId == "aramidmain-v1.0") {
      return {
        id: 0n,
        type: "native",
        creator: "",
        decimals: 6,
        total: 10_000_000_000_000_000n,
        clawback: undefined,
        defaultFrozen: false,
        freeze: undefined,
        manager: undefined,
        metadataHash: undefined,
        name: "Aramid Chain",
        nameB64: new Uint8Array(Buffer.from("Aramid Chain", "ascii")),
        reserve: undefined,
        unitName: "Aramid",
        unitNameB64: new Uint8Array(Buffer.from("Aramid", "ascii")),
        url: "https://aramid.finance",
        urlB64: new Uint8Array(Buffer.from("https://aramid.finance", "ascii")),
      };
    } else if (network.genesisId == "dockernet-v1") {
      return {
        id: 0n,
        type: "native",
        creator: "",
        decimals: 6,
        total: 10_000_000_000_000_000n,
        clawback: undefined,
        defaultFrozen: false,
        freeze: undefined,
        manager: undefined,
        metadataHash: undefined,
        name: "Local chain",
        nameB64: new Uint8Array(Buffer.from("Local chain", "ascii")),
        reserve: undefined,
        unitName: "Local",
        unitNameB64: new Uint8Array(Buffer.from("Local", "ascii")),
        url: "https://lora.algokit.io/localnet",
        urlB64: new Uint8Array(Buffer.from("https://lora.algokit.io/localnet", "ascii")),
      };
    } else {
      console.error("requets for native token, but token genesis not identified", network);
    }
  }
  const assetInfo = await avmClient.client.algod.getAssetByID(assetBigInt).do();
  if (assetInfo?.params) {
    if (!cache[network.genesisId]) cache[network.genesisId] = {};
    cache[network.genesisId][assetStr] = { ...assetInfo.params, id: assetBigInt, type: "asa" };
  }
  // localStorage.setItem(
  //   `${network.genesisId}-${assetStr}`,
  //   JSON.stringify(cache[network.genesisId][assetStr], (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  // );
  return cache[network.genesisId][assetStr];
};
