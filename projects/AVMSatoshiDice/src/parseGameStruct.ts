import { ABIAddressType, ABIBoolType, ABITupleType, ABIUintType } from 'algosdk'
import { Buffer } from 'buffer'
import { GameStruct, GameStructFromTuple } from '../smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient'

export const parseGameStruct = (data: Uint8Array): GameStruct => {
  const hex = Buffer.from(data).toString('hex')

  const hexData = hex.startsWith('151f7c75') ? hex.slice(8) : hex
  const bytes = Uint8Array.from(Buffer.from(hexData, 'hex'))

  // 3. Define the ABI tuple type
  // uint256,uint64,bool,bool,bool,uint64,uint64,uint64,uint256,uint64,uint256,uint64,uint256,uint64,address
  const tupleType = new ABITupleType([
    new ABIUintType(256),
    new ABIUintType(64),
    new ABIBoolType(),
    new ABIBoolType(),
    new ABIBoolType(),
    new ABIUintType(64),
    new ABIUintType(64),
    new ABIUintType(64),
    new ABIUintType(256),
    new ABIUintType(64),
    new ABIUintType(256),
    new ABIUintType(64),
    new ABIUintType(256),
    new ABIUintType(64),
    new ABIAddressType(), // owner: address
  ])

  // 4. Decode the bytes
  const abiTuple = tupleType.decode(bytes)
  console.log('abiTuple', abiTuple)
  // abiTuple is now: [bigint, bigint, boolean, boolean, boolean, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, string]
  const gameStruct = GameStructFromTuple(
    abiTuple as [
      bigint,
      bigint,
      boolean,
      boolean,
      boolean,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      string,
    ],
  )
  return gameStruct
}
