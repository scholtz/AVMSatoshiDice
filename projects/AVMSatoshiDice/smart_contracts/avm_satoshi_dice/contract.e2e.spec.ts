import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'
import algosdk, {
  Address,
  makeAssetCreateTxnWithSuggestedParamsFromObject,
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  makePaymentTxnWithSuggestedParamsFromObject,
} from 'algosdk'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { Arc200Factory } from '../artifacts/arc200/Arc200Client'
import { AvmSatoshiDiceFactory } from '../artifacts/avm_satoshi_dice/AvmSatoshiDiceClient'

describe('AvmSatoshiDice contract', () => {
  const localnet = algorandFixture()
  beforeAll(() => {
    Config.configure({
      debug: true,
      // traceAll: true,
    })
    registerDebugEventHandlers()
  })
  beforeEach(localnet.newScope)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(AvmSatoshiDiceFactory, {
      defaultSender: account,
    })

    const { appClient } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
    })

    await localnet.algorand.account.ensureFunded(appClient.appAddress, account, AlgoAmount.Algo(10))
    return { client: appClient }
  }
  const deployArc200 = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(Arc200Factory, {
      defaultSender: account,
    })

    const { appClient } = await factory.deploy({
      onUpdate: 'append',
      onSchemaBreak: 'append',
    })
    await localnet.algorand.account.ensureFunded(appClient.appAddress, account, AlgoAmount.Algo(10))
    await appClient.send.bootstrap({
      args: {
        decimals: 6,
        name: Buffer.from('TestARC200', 'ascii'),
        symbol: Buffer.from('$', 'ascii'),
        totalSupply: BigInt(10_000_000_000n * 1_000_000n),
      },
    })
    return { clientArc200: appClient }
  }

  test('createGameWithNativeToken', async () => {
    const testAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(testAccount)

    const result = await client.send.createGameWithNativeToken({
      args: {
        txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
          amount: BigInt(100),
          receiver: client.appAddress,
          sender: testAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        winRatio: 100,
      },
    })
  })

  test('win with 100% chance - native token', async () => {
    const deployerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(deployerAccount)

    await client.send.createGameWithNativeToken({
      args: {
        txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
          amount: BigInt(1_000_000),
          receiver: client.appAddress,
          sender: deployerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        winRatio: 1_000_000,
      },
      sender: deployerAccount,
    })

    const playerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(90) })
    console.log('playerAccount', playerAccount.addr)
    const balanceResponse = await localnet.context.algod.accountInformation(playerAccount).do()

    await client.send.startGameWithNativeToken({
      args: {
        txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
          amount: BigInt(100_000),
          receiver: client.appAddress,
          sender: playerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        game: {
          assetId: 0n,
          owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
        },
        winProbability: 1_000_000,
      },
      sender: playerAccount,
    })

    const dummyAccount1 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further
    const dummyAccount2 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further

    await client.send.claimGame({
      args: {},
      sender: playerAccount,
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
    })

    const myGame = await client.myGame({
      args: {},
      sender: playerAccount,
    })
    expect(myGame.state).toBe(2n) // win

    const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
    expect(balanceResponse2.amount).toBe(balanceResponse.amount - 4000n)
  })

  test('win with 100% chance - arc200 token', async () => {
    const deployerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(deployerAccount)
    const { clientArc200 } = await deployArc200(deployerAccount)

    const assetId = clientArc200.appId
    console.log('assetId', assetId)
    const playerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(90) })
    // deposit asset to the player account
    const balance = await clientArc200.arc200BalanceOf({
      args: {
        owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
      },
      sender: deployerAccount,
    })
    expect(balance).toBe(10_000_000_000n * 1_000_000n)
    await clientArc200.send.arc200Transfer({
      args: {
        to: algosdk.encodeAddress(playerAccount.addr.publicKey),
        value: 10_000_000,
      },
      sender: deployerAccount,
    })
    await clientArc200.send.arc200Transfer({
      args: {
        to: algosdk.encodeAddress(playerAccount.addr.publicKey),
        value: 1,
      },
      sender: deployerAccount,
    })
    const balance2 = await clientArc200.arc200BalanceOf({
      args: {
        owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
      },
      sender: deployerAccount,
    })
    expect(balance2).toBe(10_000_000_000n * 1_000_000n - 10_000_001n)
    const balance3 = await clientArc200.arc200BalanceOf({
      args: {
        owner: algosdk.encodeAddress(playerAccount.addr.publicKey),
      },
      sender: playerAccount,
    })
    expect(balance3).toBe(10_000_001n)

    // create game with the asset

    await clientArc200.send.arc200Approve({
      args: {
        spender: algosdk.encodeAddress(client.appAddress.publicKey),
        value: BigInt(1_000_000),
      },
      sender: deployerAccount,
    })
    console.log('approved 1_000_000 to app address')

    await client.send.createGameWithArc200Token({
      args: {
        amount: BigInt(1_000_000),
        assetId: assetId,
        winRatio: 1_000_000,
      },
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
      sender: deployerAccount,
    })

    console.log('playerAccount', algosdk.encodeAddress(playerAccount.addr.publicKey))
    const balanceResponse = await localnet.context.algod.accountInformation(playerAccount).do()
    console.log('balanceResponse', balanceResponse)

    const game = await client.game({
      args: {
        assetId: assetId,
        creator: algosdk.encodeAddress(deployerAccount.addr.publicKey),
      },
    })
    expect(game.assetId).toBe(assetId)

    await clientArc200.send.arc200Approve({
      args: {
        spender: algosdk.encodeAddress(client.appAddress.publicKey),
        value: BigInt(1_000_000),
      },
      sender: playerAccount,
    })
    console.log('approved 100_000 to app address')

    console.log('startGameWithAsaToken')
    await client.send.startGameWithArc200Token({
      args: {
        amount: BigInt(100_000),
        assetId: assetId,
        game: {
          assetId: assetId,
          owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
        },
        winProbability: 1_000_000,
      },
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
      sender: playerAccount,
    })

    const dummyAccount1 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further
    const dummyAccount2 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further

    console.log('claimGame')
    await client.send.claimGame({
      args: {},
      sender: playerAccount,
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
    })

    const myGame = await client.myGame({
      args: {},
      sender: playerAccount,
    })
    expect(myGame.state).toBe(2n) // win

    const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
    expect(balanceResponse2.amount).toBe(balanceResponse.amount - 5000n)
    const balanceAfter1 = await clientArc200.arc200BalanceOf({
      args: {
        owner: algosdk.encodeAddress(playerAccount.addr.publicKey),
      },
      sender: playerAccount,
    })
    expect(balanceAfter1).toBe(10_000_001n)
  })

  test('win with 100% chance - asa token', async () => {
    const deployerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(deployerAccount)

    // create asset
    const newAssetTx = await deployerAccount.signer(
      [
        makeAssetCreateTxnWithSuggestedParamsFromObject({
          sender: deployerAccount.addr,
          assetName: 'ASA',
          decimals: 6,
          total: 1_000_000_000n * 1_000_000n,
          unitName: 'ASA',
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
      ],
      [0],
    )
    const sentNewAssetTx = await localnet.context.algod.sendRawTransaction(newAssetTx).do()
    const account = await localnet.context.algod.accountInformation(deployerAccount.addr).do()
    expect(account.assets?.length).toBe(1)
    if (!account.assets) throw Error('no asset')

    const assetId = account.assets[0].assetId
    const playerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(90) })
    // deposit asset to the player account
    const optinAssetTx = await playerAccount.signer(
      [
        makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: playerAccount.addr,
          amount: 0,
          assetIndex: assetId,
          receiver: playerAccount.addr,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
      ],
      [0],
    )
    await localnet.context.algod.sendRawTransaction(optinAssetTx).do()
    const receiveAssetTxByPlayer = await deployerAccount.signer(
      [
        makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: deployerAccount.addr,
          amount: 10_000_000,
          assetIndex: assetId,
          receiver: playerAccount.addr,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
      ],
      [0],
    )
    await localnet.context.algod.sendRawTransaction(receiveAssetTxByPlayer).do()

    // anyone can optin the contract to the asa if he pays the optin fee

    await client.send.optInToAsa({
      args: {
        assetId: assetId,
        txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
          amount: 10_000_000,
          receiver: client.appAddress,
          sender: deployerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
      },
      sender: deployerAccount,
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
    })

    // create game with the asset

    await client.send.createGameWithAsaToken({
      args: {
        txnDeposit: makeAssetTransferTxnWithSuggestedParamsFromObject({
          assetIndex: assetId,
          amount: BigInt(1_000_000),
          receiver: client.appAddress,
          sender: deployerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        winRatio: 1_000_000,
      },
      sender: deployerAccount,
    })

    console.log('playerAccount', algosdk.encodeAddress(playerAccount.addr.publicKey))
    const balanceResponse = await localnet.context.algod.accountInformation(playerAccount).do()
    console.log('balanceResponse', balanceResponse)

    const game = await client.game({
      args: {
        assetId: assetId,
        creator: algosdk.encodeAddress(deployerAccount.addr.publicKey),
      },
    })
    expect(game.assetId).toBe(assetId)
    console.log('startGameWithAsaToken')
    await client.send.startGameWithAsaToken({
      args: {
        txnDeposit: makeAssetTransferTxnWithSuggestedParamsFromObject({
          assetIndex: assetId,
          amount: BigInt(100_000),
          receiver: client.appAddress,
          sender: playerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        game: {
          assetId: assetId,
          owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
        },
        winProbability: 1_000_000,
      },
      sender: playerAccount,
    })

    const dummyAccount1 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further
    const dummyAccount2 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further

    console.log('claimGame')
    await client.send.claimGame({
      args: {},
      sender: playerAccount,
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
    })

    const myGame = await client.myGame({
      args: {},
      sender: playerAccount,
    })
    expect(myGame.state).toBe(2n) // win

    const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
    expect(balanceResponse2.amount).toBe(balanceResponse.amount - 4000n)
  })

  test('play with 50% chance', async () => {
    const deployerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(deployerAccount)

    await client.send.createGameWithNativeToken({
      args: {
        txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
          amount: BigInt(10_000_000),
          receiver: client.appAddress,
          sender: deployerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        winRatio: 1_000_000,
      },
      sender: deployerAccount,
    })
    let wonStats = 0
    let lostStats = 0
    for (let i = 0; i < 10; i++) {
      const playerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(50) })
      console.log('playerAccount', playerAccount.addr)
      const balanceResponse = await localnet.context.algod.accountInformation(playerAccount).do()

      await client.send.startGameWithNativeToken({
        args: {
          txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
            amount: BigInt(100_000),
            receiver: client.appAddress,
            sender: playerAccount,
            suggestedParams: await localnet.context.algod.getTransactionParams().do(),
          }),
          game: {
            assetId: 0n,
            owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
          },
          winProbability: 500_000,
        },
        sender: playerAccount,
      })

      const dummyAccount1 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further
      const dummyAccount2 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further

      await client.send.claimGame({
        args: {},
        sender: playerAccount,
        staticFee: AlgoAmount.MicroAlgos(2000),
        maxFee: AlgoAmount.MicroAlgos(3000),
      })

      const myGame = await client.myGame({
        args: {},
        sender: playerAccount,
      })
      if (myGame.state == 2n) {
        // win
        console.log('tested win scenario')
        const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
        expect(balanceResponse2.amount).toBe(balanceResponse.amount + 100_000n - 4000n)
        wonStats++
      } else {
        // loose
        console.log('tested loose scenario')
        const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
        expect(balanceResponse2.amount).toBe(balanceResponse.amount - 100_000n - 4000n)
        lostStats++
      }
    }
    console.log(`stats for 10 iterations 50% chance: ${wonStats}W ${lostStats}L`)
  })

  test('play with 25% chance - Native', async () => {
    const deployerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(deployerAccount)

    await client.send.createGameWithNativeToken({
      args: {
        txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
          amount: BigInt(10_000_000),
          receiver: client.appAddress,
          sender: deployerAccount,
          suggestedParams: await localnet.context.algod.getTransactionParams().do(),
        }),
        winRatio: 1_000_000,
      },
      sender: deployerAccount,
    })
    let wonStats = 0
    let lostStats = 0
    for (let i = 0; i < 10; i++) {
      const playerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(50) })
      console.log('playerAccount', playerAccount.addr)
      const balanceResponse = await localnet.context.algod.accountInformation(playerAccount).do()

      await client.send.startGameWithNativeToken({
        args: {
          txnDeposit: makePaymentTxnWithSuggestedParamsFromObject({
            amount: BigInt(100_000),
            receiver: client.appAddress,
            sender: playerAccount,
            suggestedParams: await localnet.context.algod.getTransactionParams().do(),
          }),
          game: {
            assetId: 0n,
            owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
          },
          winProbability: 250_000,
        },
        sender: playerAccount,
      })

      const dummyAccount1 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further
      const dummyAccount2 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further

      await client.send.claimGame({
        args: {},
        sender: playerAccount,
        staticFee: AlgoAmount.MicroAlgos(2000),
        maxFee: AlgoAmount.MicroAlgos(3000),
      })

      const myGame = await client.myGame({
        args: {},
        sender: playerAccount,
      })
      if (myGame.state == 2n) {
        // win
        console.log('tested win scenario')
        const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
        expect(balanceResponse2.amount).toBe(balanceResponse.amount + 300_000n - 4000n)
        wonStats++
      } else {
        // loose
        console.log('tested loose scenario')
        const balanceResponse2 = await localnet.context.algod.accountInformation(playerAccount).do()
        expect(balanceResponse2.amount).toBe(balanceResponse.amount - 100_000n - 4000n)
        lostStats++
      }
    }
    console.log(`stats for 10 iterations 25% chance: ${wonStats}W ${lostStats}L`)
  })

  test('play with 25% chance - ARC200', async () => {
    const deployerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) })
    const { client } = await deploy(deployerAccount)
    const { clientArc200 } = await deployArc200(deployerAccount)

    const assetId = clientArc200.appId
    console.log('assetId', assetId)
    // deposit asset to the player account
    const balance = await clientArc200.arc200BalanceOf({
      args: {
        owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
      },
      sender: deployerAccount,
    })
    expect(balance).toBe(10_000_000_000n * 1_000_000n)

    // create game with the asset

    await clientArc200.send.arc200Approve({
      args: {
        spender: algosdk.encodeAddress(client.appAddress.publicKey),
        value: BigInt(10_000_000),
      },
      sender: deployerAccount,
    })
    console.log('approved 10_000_000 to app address')

    await client.send.createGameWithArc200Token({
      args: {
        amount: BigInt(10_000_000),
        assetId: assetId,
        winRatio: 1_000_000,
      },
      staticFee: AlgoAmount.MicroAlgos(2000),
      maxFee: AlgoAmount.MicroAlgos(3000),
      sender: deployerAccount,
    })

    const game = await client.game({
      args: {
        assetId: assetId,
        creator: algosdk.encodeAddress(deployerAccount.addr.publicKey),
      },
    })
    expect(game.assetId).toBe(assetId)

    let wonStats = 0
    let lostStats = 0
    for (let i = 0; i < 10; i++) {
      const playerAccount = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(50) })
      console.log('playerAccount', algosdk.encodeAddress(playerAccount.addr.publicKey))

      await clientArc200.send.arc200Transfer({
        args: {
          to: algosdk.encodeAddress(playerAccount.addr.publicKey),
          value: 10_000_000,
        },
        sender: deployerAccount,
      })

      const initBalance = await clientArc200.arc200BalanceOf({
        args: {
          owner: algosdk.encodeAddress(playerAccount.addr.publicKey),
        },
        sender: playerAccount,
      })
      expect(initBalance).toBe(10_000_000n)

      await clientArc200.send.arc200Approve({
        args: {
          spender: algosdk.encodeAddress(client.appAddress.publicKey),
          value: BigInt(100_000),
        },
        sender: playerAccount,
      })
      console.log('approved 100_000 to app address')

      console.log('startGameWithAsaToken')
      await client.send.startGameWithArc200Token({
        args: {
          amount: BigInt(100_000),
          assetId: assetId,
          game: {
            assetId: assetId,
            owner: algosdk.encodeAddress(deployerAccount.addr.publicKey),
          },
          winProbability: 250_000,
        },
        staticFee: AlgoAmount.MicroAlgos(2000),
        maxFee: AlgoAmount.MicroAlgos(3000),
        sender: playerAccount,
      })

      const dummyAccount1 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further
      const dummyAccount2 = await localnet.context.generateAccount({ initialFunds: AlgoAmount.Algo(100) }) // generate new tx on chain, so that we move one block further

      await client.send.claimGame({
        args: {},
        sender: playerAccount,
        staticFee: AlgoAmount.MicroAlgos(2000),
        maxFee: AlgoAmount.MicroAlgos(3000),
      })

      const myGame = await client.myGame({
        args: {},
        sender: playerAccount,
      })
      if (myGame.state == 2n) {
        // win
        console.log('tested win scenario')

        const finalBalance = await clientArc200.arc200BalanceOf({
          args: {
            owner: algosdk.encodeAddress(playerAccount.addr.publicKey),
          },
          sender: playerAccount,
        })
        expect(finalBalance).toBe(initBalance + 300_000n)
        wonStats++
      } else {
        // loose
        console.log('tested loose scenario')
        const finalBalance = await clientArc200.arc200BalanceOf({
          args: {
            owner: algosdk.encodeAddress(playerAccount.addr.publicKey),
          },
          sender: playerAccount,
        })
        expect(finalBalance).toBe(initBalance - 100_000n)
        lostStats++
      }
    }
    console.log(`stats for 10 iterations 25% chance: ${wonStats}W ${lostStats}L`)
  })
})
