import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  AddressAssetStruct,
  AvmSatoshiDiceClient,
  GameStruct,
  PlayStruct,
} from "../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";
import { getAssetAsync } from "../scripts/algorand/getAssetAsync";
import { IAssetParams } from "../types/IAssetParams";

export interface IGameStruct {
  id: string;
  idObj: AddressAssetStruct;
  game: GameStruct;
  token: IAssetParams;
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

  const loadGames = async (client: AvmSatoshiDiceClient) => {
    const gamesMap = await client.state.box.games.getMap();
    const gamesData: IGameStruct[] = [];
    const tokensLocal: IAsset2AssetParams = {};
    for (let item of gamesMap) {
      const tokenidStr = BigInt(item[0].assetId).toString();
      const token = await getAssetAsync(item[0].assetId, client.algorand);
      tokensLocal[tokenidStr] = token;
      gamesData.push({
        id: `${item[0].owner}-${item[0].assetId}`,
        idObj: item[0],
        game: item[1],
        token: token,
      });
    }
    console.log("tokensLocal", tokensLocal);
    tokens.value = Object.values(tokensLocal);

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

  function getGameById(id: string) {
    return games.value.find((game) => game.id === id) || null;
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
  function setCurrentGame(gameId: string) {
    currentGame.value = getGameById(gameId);
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
