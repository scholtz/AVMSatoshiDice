import {
  AvmSatoshiDiceClient,
  AvmSatoshiDiceFactory,
  type AddressAssetStruct,
  type GameStruct,
  type PlayStruct,
} from '../smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient'

import { parseGameStruct } from './parseGameStruct'
import { parsePlayStruct } from './parsePlayStruct'

export { AvmSatoshiDiceClient, AvmSatoshiDiceFactory, parseGameStruct, parsePlayStruct }
export type { AddressAssetStruct, GameStruct, PlayStruct }
