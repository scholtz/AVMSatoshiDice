import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { IAssetParams } from "../../types/IAssetParams";

interface INetworkAssetCache {
  [key: string]: IAssetCache;
}
interface IAssetCache {
  [key: string]: IAssetParams;
}

const cache: INetworkAssetCache = {};

export const getAsset = async (assetId: string | number | bigint, avmClient: AlgorandClient) => {
  const network = await avmClient.client.network();
  const assetBigInt = BigInt(assetId);
  const assetStr = assetBigInt.toString();
  if (cache[network.genesisId][assetStr]) {
    return cache[network.genesisId][assetStr];
  }
  const assetInfo = await avmClient.client.algod.getAssetByID(BigInt(assetId)).do();
  if (assetInfo?.params) {
    if (!cache[network.genesisId]) cache[network.genesisId] = {};
    cache[network.genesisId][assetStr] = { ...assetInfo.params, id: assetBigInt, type: "asa" };
  }
  localStorage.setItem(
    `${network.genesisId}-${assetStr}`,
    JSON.stringify(cache[network.genesisId][assetStr], (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
  return cache[network.genesisId][assetStr];
};
