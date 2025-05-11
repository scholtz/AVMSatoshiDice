import { AvmSatoshiDiceClient } from "../../../AVMSatoshiDice/smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient";

export interface IChainCode2AppClient {
  [key: string]: AvmSatoshiDiceClient;
}
