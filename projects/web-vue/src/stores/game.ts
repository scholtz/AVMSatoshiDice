import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  AddressAssetStruct,
  GameStruct,
  PlayStruct,
} from "../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";
import { getAssetAsync } from "../scripts/algorand/getAssetAsync";
import { IAssetParams } from "../types/IAssetParams";
import { IChainCode2AppClient } from "../types/IChainCode2AppClient";

export interface IGameStruct {
  id: string;
  idObj: AddressAssetStruct;
  game: GameStruct;
  token: IAssetParams;
  chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1";
}
interface IAsset2AssetParams {
  [key: string]: IAssetParams;
}
export const useGameStore = defineStore("game", () => {
  // State
  const games = ref<IGameStruct[]>([]);
  const tokens = ref<IAssetParams[]>([]);
  const selectedTokenFilter = ref<bigint | null>(null);
  const currentGame = ref<IGameStruct | null>(null);
  const currentGamePlay = ref<PlayStruct | null>(null);

  const loadGames = async (clients: IChainCode2AppClient) => {
    const gamesData: IGameStruct[] = [];
    console.log("clients", clients);
    for (let chain of Object.keys(clients)) {
      try {
        const client = clients[chain];

        const gamesMap = await client.state.box.games.getMap();
        for (let item of gamesMap) {
          try {
            const token = await getAssetAsync(item[0].assetId, client.algorand);
            gamesData.push({
              id: `${item[0].owner}-${item[0].assetId}`,
              idObj: item[0],
              game: item[1],
              token: token,
              chain: chain as
                | "mainnet-v1.0"
                | "aramidmain-v1.0"
                | "testnet-v1.0"
                | "betanet-v1.0"
                | "voimain-v1.0"
                | "fnet-v1"
                | "dockernet-v1",
            });
          } catch (e) {
            console.error("Error loading data for game ", chain, item, e);
          }
        }
      } catch (e) {
        console.error("Error loading games from chain", chain, e);
      }
    }

    games.value = gamesData;
    console.log("games", games);
  };
  // Getters
  const filteredGames = computed(() => {
    let result = [...games.value];

    // Apply token filter
    console.log("filter", selectedTokenFilter.value);
    if (selectedTokenFilter.value !== null) {
      result = result.filter((game) => game.token.id === selectedTokenFilter.value);
    }

    // Sort by win ratio (desc) and then by balance (desc)
    result.sort((a: IGameStruct, b: IGameStruct) => {
      if (a.game.winRatio !== b.game.winRatio) {
        return Number(b.game.winRatio - a.game.winRatio);
      }
      return Number(b.game.balance - a.game.balance);
    });

    return result;
  });

  // Actions
  function setTokenFilter(tokenId: bigint | null) {
    selectedTokenFilter.value = tokenId;
  }

  function getGameById(
    id: string,
    chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ) {
    return games.value.find((game) => game.id === id && game.chain == chain) || null;
  }

  function updateGame(updatedGame: IGameStruct) {
    const index = games.value.findIndex((game) => game.id === updatedGame.id);
    if (index !== -1) {
      games.value[index] = updatedGame;
      console.log("game updated at index", index, games.value[index]);
    } else {
      games.value.push(updatedGame);
      console.log("game updated - new", updatedGame);
    }
  }
  function setCurrentGame(
    gameId: string,
    chain: "mainnet-v1.0" | "aramidmain-v1.0" | "testnet-v1.0" | "betanet-v1.0" | "voimain-v1.0" | "fnet-v1" | "dockernet-v1",
  ) {
    currentGame.value = getGameById(gameId, chain);
  }
  const setLastGamePlay = (play: PlayStruct) => {
    currentGamePlay.value = play;
    console.log("last play: ", play);
  };
  const currentGameState = () => {
    if (!currentGamePlay.value) return "No game played";
    if (currentGamePlay.value.state == 1n) return "Waiting for result";
    if (currentGamePlay.value.state == 2n) return "Win";
    if (currentGamePlay.value.state == 3n) return "Lost";
    return "Unknown";
  };
  return {
    games,
    loadGames,
    tokens,
    filteredGames,
    selectedTokenFilter,
    currentGame,
    currentGamePlay,
    setTokenFilter,
    getGameById,
    setCurrentGame,
    setLastGamePlay,
    currentGameState,
    updateGame,
  };
});
