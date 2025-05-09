import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { AvmSatoshiDiceClient, GameStruct } from "../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";
import type { GamePlay, Token } from "../types";

// Mock data
const mockTokens: Token[] = [
  { id: "1", symbol: "ALGO", name: "Algorand", type: "native", logoUrl: "https://cryptologos.cc/logos/algorand-algo-logo.png" },
  { id: "2", symbol: "USDC", name: "USD Coin", type: "asa", logoUrl: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png" },
  { id: "3", symbol: "PLANETS", name: "PlanetWatch", type: "asa", logoUrl: "https://cryptologos.cc/logos/planetwatch-planets-logo.png" },
  { id: "4", symbol: "DICE", name: "Dice Token", type: "arc200", logoUrl: "" },
];

export interface IGameStruct {
  game: GameStruct;
  id: string;
  token: Token;
}

export const useGameStore = defineStore("game", () => {
  // State
  const games = ref<IGameStruct[]>([]);
  const tokens = ref<Token[]>(mockTokens);
  const selectedTokenFilter = ref<string | null>(null);
  const currentGame = ref<IGameStruct | null>(null);
  const currentGamePlay = ref<GamePlay | null>(null);

  const loadGames = async (client: AvmSatoshiDiceClient) => {
    const gamesMap = await client.state.box.games.getMap();
    const gamesData: IGameStruct[] = [];
    gamesMap.forEach((g) => {
      gamesData.push({
        game: g,
        id: `${g.owner}-${g.assetId}`,
        token: mockTokens[0],
      });
    });
    games.value = gamesData;

    console.log("games", games);
  };
  // Getters
  const filteredGames = computed(() => {
    let result = [...games.value];

    // Apply token filter
    if (selectedTokenFilter.value) {
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
  function setTokenFilter(tokenId: string | null) {
    selectedTokenFilter.value = tokenId;
  }

  function getGameById(id: string) {
    return games.value.find((game) => game.id === id) || null;
  }

  function setCurrentGame(gameId: string) {
    currentGame.value = getGameById(gameId);
  }

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
  };
});
