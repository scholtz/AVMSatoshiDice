import { AvmSatoshiDiceClient } from "avm-satoshi-dice";

export interface IChainCode2AppClient {
  [key: string]: AvmSatoshiDiceClient;
}
