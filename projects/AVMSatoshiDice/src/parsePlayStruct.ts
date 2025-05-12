import { ABIAddressType, ABITupleType, ABIUintType } from 'algosdk'
import { Buffer } from 'buffer'
import { PlayStruct, PlayStructFromTuple } from '../smart_contracts/artifacts/avm_satoshi_dice/AvmSatoshiDiceClient'

export const parsePlayStruct = (data: Uint8Array): PlayStruct => {
  const hex = Buffer.from(data).toString('hex')

  const hexData = hex.startsWith('151f7c75') ? hex.slice(8) : hex
  const bytes = Uint8Array.from(Buffer.from(hexData, 'hex'))

  // 3. Define the ABI tuple type
  const tupleType = new ABITupleType([
    new ABIUintType(64), // state: uint64
    new ABIUintType(64), // winProbability: uint64
    new ABIUintType(64), // round: uint64
    new ABIUintType(256), // deposit: uint256
    new ABIUintType(256), // expected win: uint256
    new ABIUintType(256), // real transfer: uint256
    new ABIUintType(64), // assetId: uint64
    new ABIAddressType(), // gameCreator: address
    new ABIAddressType(), // owner: address
    new ABIUintType(64), // last timestamp
  ])

  // 4. Decode the bytes
  const abiTuple = tupleType.decode(bytes)

  // abiTuple is now: [bigint, bigint, bigint, bigint, bigint, string, string]
  const playStruct = PlayStructFromTuple(
    abiTuple as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, string, string, bigint],
  )
  return playStruct
}
