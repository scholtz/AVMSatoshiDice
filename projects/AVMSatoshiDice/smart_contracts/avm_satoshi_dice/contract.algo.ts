import {
  arc4,
  assert,
  Asset,
  biguint,
  BigUint,
  BoxMap,
  bytes,
  Contract,
  err,
  Global,
  GlobalState,
  gtxn,
  itxn,
  op,
  Txn,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { Address, Bool, methodSelector, UintN256, UintN64 } from '@algorandfoundation/algorand-typescript/arc4'

class GameStruct extends arc4.Struct<{
  /**
   * Balance of the game. Anyone can create a game and deposit there any balance. The token is determined by other fields
   */
  balance: UintN256
  /**
   * Asset id. If native token then 0, if arc200 token, the app id, if asa the asset id.
   */
  assetId: UintN64
  /**
   * If true, the asset id is equal to 0 and native token is used.
   */
  isNativeToken: Bool
  /**
   * If true, the token id is the ASA id.
   */
  isASAToken: Bool
  /**
   * If true, the token id is the arc200 token app id.
   */
  isArc200Token: Bool
  /**
   * Time when game was created
   */
  createdAtTime: UintN64
  /**
   * Blockchain block round when the Game was created. Each game play has specific round at the PlayStruct object.
   */
  createdAtRound: UintN64
  /**
   * Time when someone last played the game
   */
  lastPlayedTime: UintN64
  /**
   * Time when someone last won at the game
   */
  lastWinTime: UintN64
  /**
   * Time when someone last won at the game
   */
  lastWinAmount: UintN256
  /**
   * Biggest win time
   */
  biggestWinTime: UintN64
  /**
   * Biggest win amount
   */
  biggestWinAmount: UintN256

  /**
   * Win ratio is defined by the game creator. It is the ratio which reduces the probability of winning. This is expressed as decimal with base 1_000_000
   *
   * Value 1_000_000 means 1_000_000/1_000_000 = 1.. if player chosen probability of winning 50%, the end probability is 50%
   * Value 200_000 means 200_000/1_000_000 = 0.2.. if player chosen probability of winning 50%, the end probability is 50%*0.2=10%
   * Value 0 means 0/1_000_000 = 0.. if player chosen probability of winning 0%, the end probability is 50%*0=0%
   *
   * Win ratio is public and game creators should compete on who provides higher probability of winning.
   */
  winRatio: UintN64
  /**
   * Owner of the game. Person who can do free deposit or withdrawal from the game.
   */
  owner: Address
}> {}

class AddressAssetStruct extends arc4.Struct<{
  /**
   * Asset id. If native token then 0, if arc200 token, the app id, if asa the asset id.
   */
  assetId: UintN64
  /**
   * Owner of the game. Person who can do free deposit or withdrawal from the game.
   */
  owner: Address
}> {}

class PlayStruct extends arc4.Struct<{
  /**
   * 1 - initiated
   * 2 - won
   * 3 - lost
   */
  state: UintN64
  /**
   * Player can choose probability of winning.
   *
   * Value 1_000_000 means 1_000_000/1_000_000 = 1.. Player wins all the time.
   * Value 200_000 means 200_000/1_000_000 = 0.2 .. Player wins every 5th time.
   * Value 0 means 0/1_000_000 = 1.. Player never wins.
   *
   * Each game has modifiers on the player selection probability.
   * If winRatio of game is 200_000 and user selected winProbability to be 200_000, the end probability is 0,2*0,2 = 4%
   *
   * winProbability is also multiplication factor for the win.
   *
   * If the play deposit was 100 tokens, with value 1_000_000 (1) the withdrawal will be 100
   * If the play deposit was 100 tokens, with value 500_000 (0.5) the withdrawal will be 200
   * If the play deposit was 100 tokens, with value 100_000 (0.1) the withdrawal will be 1000
   * If the play deposit was 100 tokens, with value 0 (0.1) the player lost the game
   *
   */
  winProbability: UintN64
  /**
   * The round in which the game was played. The verification for random number comparision is done in the round + 1.
   *
   * User can claim win only within round + 100 rounds
   */
  round: UintN64
  /**
   * The user deposit for the play
   */
  deposit: UintN256
  /**
   * The game asset id
   */
  assetId: UintN64
  /**
   * The game creator
   */
  gameCreator: Address
  /**
   * Owner of the play. Person who did play the game.
   */
  owner: Address
}> {}

export class AvmSatoshiDice extends Contract {
  public games = BoxMap<AddressAssetStruct, GameStruct>({ keyPrefix: 'g' })
  public plays = BoxMap<Address, PlayStruct>({ keyPrefix: 'p' })
  public allDeposits = BoxMap<UintN64, UintN256>({ keyPrefix: 'd' })

  /**
   * Version of the smart contract
   */
  version = GlobalState<string>({ key: 'scver' })
  /**
   * addressUdpater from global biatec configuration is allowed to update application
   */
  @arc4.abimethod({ allowActions: 'UpdateApplication' })
  updateApplication(newVersion: string): boolean {
    assert(Global.creatorAddress === Txn.sender, 'Only creator can update application')
    this.version.value = newVersion
    return true
  }
  /**
   * Creator can perfom key registration for this LP pool
   */
  @arc4.abimethod()
  public sendOnlineKeyRegistration(
    voteKey: bytes,
    selectionKey: bytes,
    stateProofKey: bytes,
    voteFirst: uint64,
    voteLast: uint64,
    voteKeyDilution: uint64,
    fee: uint64,
  ): bytes {
    assert(Global.creatorAddress === Txn.sender, 'Only creator can use this method')
    const itxnResult = itxn
      .keyRegistration({
        selectionKey: selectionKey,
        stateProofKey: stateProofKey,
        voteFirst: voteFirst,
        voteKeyDilution: voteKeyDilution,
        voteLast: voteLast,
        voteKey: voteKey,
        fee: fee,
      })
      .submit()
    return itxnResult.txnId
  }

  /**
   * Biatec can withdraw service fees. The current balance
   *
   * @param amount Amout to send
   * @param receiver Receiver
   * @param note Note
   * @returns
   */
  @arc4.abimethod()
  public withdraw(receiver: Address, amount: UintN256, assetId: UintN64, isArc200Token: Bool): void {
    const key = new AddressAssetStruct({
      assetId: assetId,
      owner: new Address(Txn.sender),
    })

    if (this.games(key).exists) {
      const game = this.games(key).value.copy()

      let toWithdrawIncludingFee: biguint = amount.native
      if (toWithdrawIncludingFee === BigUint(0)) {
        toWithdrawIncludingFee = game.balance.native
      }
      const fee: biguint = toWithdrawIncludingFee / BigUint(40)
      const toWithdrawNet: biguint = toWithdrawIncludingFee - fee

      assert(
        game.balance.native >= toWithdrawIncludingFee,
        'Game creator can withdraw from the game only the game deposit',
      )

      this.games(key).value.balance = new UintN256(game.balance.native - toWithdrawIncludingFee)
      this.allDeposits(assetId).value = new UintN256(this.allDeposits(assetId).value.native - toWithdrawNet)

      if (game.isNativeToken.native) {
        itxn
          .payment({
            amount: new UintN64(toWithdrawNet).native,
            receiver: receiver.native,
            note: 'user withdrawal',
            fee: 0,
          })
          .submit()
      }
      if (game.isASAToken.native) {
        itxn
          .assetTransfer({
            xferAsset: game.assetId.native,
            assetAmount: new UintN64(toWithdrawNet).native,
            assetReceiver: receiver.native,
            note: 'user withdrawal',
            fee: 0,
          })
          .submit()
      }
      if (game.isArc200Token.native) {
        // ARC 200
        itxn
          .applicationCall({
            appId: game.assetId.native,
            appArgs: [methodSelector('arc200_transfer(address,uint256)bool'), receiver, new UintN256(toWithdrawNet)],
            fee: 0,
            note: 'user withdrawal',
          })
          .submit()
      }
    } else {
      // box does not exists
      if (Global.creatorAddress === Txn.sender) {
        // global deployer can perform fee transfer

        if (assetId.native === 0) {
          const maxWithdrawableBalance: uint64 =
            Global.currentApplicationAddress.balance -
            Global.currentApplicationAddress.minBalance -
            new UintN64(this.allDeposits(assetId).value.native).native
          assert(amount.native <= BigUint(maxWithdrawableBalance), 'maxWithdrawableBalance is less then requested')
          let toWidraw: uint64 = new UintN64(amount.native).native
          if (toWidraw === 0) {
            toWidraw = maxWithdrawableBalance
          }

          itxn
            .payment({
              amount: new UintN64(toWidraw).native,
              receiver: receiver.native,
              note: 'admin withdrawal',
              fee: 0,
            })
            .submit()
        } else if (isArc200Token.native) {
          // arc200 withdrawal
          // TODO .. check the balance
          // const balance =  itxn
          //   .applicationCall({
          //     appId: assetId.native,
          //     appArgs: [
          //       methodSelector('arc200_balanceOf(address)uint256'),
          //       new Address(Global.currentApplicationAddress)
          //     ],
          //   })
          //   .submit()
          //
          // THERE IS SECURITY ISSUE NOW.. ADMIN CAN WITHDRAW ANY AMOUNT OF ARC200
          // how to do arc200_balanceOf within the smart contract?
          itxn
            .applicationCall({
              appId: assetId.native,
              appArgs: [methodSelector('arc200_transfer(address,uint256)bool'), receiver, amount],
              fee: 0,
              note: 'admin withdrawal',
            })
            .submit()
        } else {
          // asa
          const balance = Asset(assetId.native).balance(Global.currentApplicationAddress)
          const maxWithdrawableBalance: uint64 = balance - new UintN64(this.allDeposits(assetId).value.native).native
          assert(amount.native <= BigUint(maxWithdrawableBalance), 'maxWithdrawableBalance is less then requested')
          let toWidraw: uint64 = new UintN64(amount.native).native
          if (toWidraw === 0) {
            toWidraw = maxWithdrawableBalance
          }

          itxn
            .assetTransfer({
              xferAsset: assetId.native,
              assetAmount: new UintN64(toWidraw).native,
              assetReceiver: receiver.native,
              note: 'admin withdrawal',
              fee: 0,
            })
            .submit()
        }
      } else {
        err('The game for this asset does not exists')
      }
    }
  }

  /**
   * Create new game or deposit by the owner more assets to the game.
   *
   * @param txnDeposit Deposit transaction
   * @param winRatio Win ratio.. 1_000_000 for user probability, 200_000 for 0.2 factor of the user probability, 0 for no win
   */
  @arc4.abimethod()
  public CreateGameWithNativeToken(txnDeposit: gtxn.PaymentTxn, winRatio: UintN64): GameStruct {
    const sender = new arc4.Address(txnDeposit.sender)
    const assetId = new UintN64(0)
    assert(winRatio.native <= 1_000_000, 'Win probability must be below 1 000 000')

    const fee: uint64 = txnDeposit.amount / 40 //2.5%
    const deposit: uint64 = txnDeposit.amount - fee
    let prevDeposit: UintN256 = new UintN256(0)
    if (this.allDeposits(assetId).exists) {
      prevDeposit = this.allDeposits(assetId).value
    }

    this.allDeposits(assetId).value = new UintN256(prevDeposit.native + BigUint(deposit))

    assert(txnDeposit.receiver === Global.currentApplicationAddress, 'Receiver must be the gas station app')

    const key = new AddressAssetStruct({
      assetId: assetId,
      owner: sender,
    })
    if (this.games(key).exists) {
      assert(this.games(key).value.isNativeToken === new Bool(true), 'The previous game was not for the native token')
      assert(this.games(key).value.isASAToken === new Bool(false), 'The previous game was ASA token')
      assert(this.games(key).value.assetId === assetId, 'The previous game was not for the native token')

      // do more deposit to the user game
      const oldBalance = this.games(key).value.balance
      this.games(key).value.balance = new UintN256(oldBalance.native + BigUint(deposit))
      this.games(key).value.winRatio = winRatio
    } else {
      // new game
      const newValue = new GameStruct({
        balance: new UintN256(BigUint(deposit)),
        assetId: assetId,
        isArc200Token: new Bool(false),
        isNativeToken: new Bool(true),
        isASAToken: new Bool(false),

        createdAtTime: new UintN64(Global.latestTimestamp),
        createdAtRound: new UintN64(Global.round),

        lastPlayedTime: new UintN64(0),
        lastWinTime: new UintN64(0),
        lastWinAmount: new UintN256(0),
        biggestWinAmount: new UintN256(0),
        biggestWinTime: new UintN64(0),

        winRatio: winRatio,
        owner: sender,
      })
      this.games(key).value = newValue.copy()
    }
    return this.games(key).value
  }
  /**
   * Anyone can optin this contract to his ASA if he deposits 10 native tokens
   *
   * @param txnDeposit Deposit tx
   * @param assetId Assset id
   */
  @arc4.abimethod()
  public OptInToASA(txnDeposit: gtxn.PaymentTxn, assetId: UintN64) {
    assert(
      txnDeposit.receiver === Global.currentApplicationAddress,
      'Receiver of the optin fee must be the current smart contract',
    )
    assert(txnDeposit.amount === 10_000_000, 'Opt in fee for new asset is 10 native tokens')

    if (!Global.currentApplicationAddress.isOptedIn(Asset(assetId.native))) {
      itxn
        .assetTransfer({
          xferAsset: assetId.native,
          assetAmount: 0,
          assetReceiver: Global.currentApplicationAddress,
          fee: 0,
        })
        .submit()
    }
  }

  /**
   * Create new game or deposit by the owner more assets to the game.
   *
   * @param txnDeposit Deposit transaction
   * @param winRatio Win ratio.. 1_000_000 for user probability, 200_000 for 0.2 factor of the user probability, 0 for no win
   */
  @arc4.abimethod()
  public CreateGameWithASAToken(txnDeposit: gtxn.AssetTransferTxn, winRatio: UintN64): GameStruct {
    const sender = new arc4.Address(txnDeposit.sender)
    assert(winRatio.native <= 1_000_000, 'Win probability must be below 1 000 000')
    const assetId = new UintN64(txnDeposit.xferAsset.id)

    const fee: uint64 = txnDeposit.assetAmount / 40 //2.5%
    const deposit: uint64 = txnDeposit.assetAmount - fee
    let prevDeposit: UintN256 = new UintN256(0)
    if (this.allDeposits(assetId).exists) {
      prevDeposit = this.allDeposits(assetId).value
    }

    this.allDeposits(assetId).value = new UintN256(prevDeposit.native + BigUint(deposit))

    assert(txnDeposit.assetReceiver === Global.currentApplicationAddress, 'Receiver must be the gas station app')

    const key = new AddressAssetStruct({
      assetId: assetId,
      owner: sender,
    })
    if (this.games(key).exists) {
      assert(this.games(key).value.isNativeToken === new Bool(false), 'The previous game was for the native token')
      assert(this.games(key).value.isArc200Token === new Bool(false), 'The previous game was for the arc200 token')
      assert(this.games(key).value.isASAToken === new Bool(true), 'The previous game was not for the ASA token')
      assert(this.games(key).value.assetId === assetId, 'The previous game was not for the same token')

      // do more deposit to the user game
      const oldBalance = this.games(key).value.balance
      this.games(key).value.balance = new UintN256(oldBalance.native + BigUint(deposit))
      this.games(key).value.winRatio = winRatio
    } else {
      // new game
      const newValue = new GameStruct({
        balance: new UintN256(BigUint(deposit)),
        assetId: assetId,
        isArc200Token: new Bool(false),
        isNativeToken: new Bool(false),
        isASAToken: new Bool(true),

        createdAtTime: new UintN64(Global.latestTimestamp),
        createdAtRound: new UintN64(Global.round),

        lastPlayedTime: new UintN64(0),
        lastWinTime: new UintN64(0),
        lastWinAmount: new UintN256(0),
        biggestWinAmount: new UintN256(0),
        biggestWinTime: new UintN64(0),

        winRatio: winRatio,
        owner: sender,
      })
      this.games(key).value = newValue.copy()
    }
    return this.games(key).value
  }

  /**
   * Create new game or deposit by the owner more assets to the game.
   *
   * @param txnDeposit Deposit transaction
   * @param winRatio Win ratio.. 1_000_000 for user probability, 200_000 for 0.2 factor of the user probability, 0 for no win
   */
  @arc4.abimethod()
  public CreateGameWithArc200Token(assetId: UintN64, amount: UintN256, winRatio: UintN64): GameStruct {
    const sender = new arc4.Address(Txn.sender)
    assert(winRatio.native <= 1_000_000, 'Win probability must be below 1 000 000')

    const fee: biguint = amount.native / BigUint(40) //2.5%
    const deposit: biguint = amount.native - fee
    let prevDeposit: UintN256 = new UintN256(0)
    if (this.allDeposits(assetId).exists) {
      prevDeposit = this.allDeposits(assetId).value
    }

    this.allDeposits(assetId).value = new UintN256(prevDeposit.native + BigUint(deposit))

    // perform the deposit
    itxn
      .applicationCall({
        appId: assetId.native,
        appArgs: [
          methodSelector('arc200_transferFrom(address,address,uint256)bool'),
          new Address(Txn.sender),
          new Address(Global.currentApplicationAddress),
          amount,
        ],
      })
      .submit()

    const key = new AddressAssetStruct({
      assetId: assetId,
      owner: sender,
    })
    if (this.games(key).exists) {
      assert(this.games(key).value.isNativeToken === new Bool(false), 'The previous game was for the native token')
      assert(this.games(key).value.isArc200Token === new Bool(true), 'The previous game was NOT for the arc200 token')
      assert(this.games(key).value.isASAToken === new Bool(false), 'The previous game was for the ASA token')
      assert(this.games(key).value.assetId === assetId, 'The previous game was not for the same token')

      // do more deposit to the user game
      const oldBalance = this.games(key).value.balance
      this.games(key).value.balance = new UintN256(oldBalance.native + BigUint(deposit))
      this.games(key).value.winRatio = winRatio
    } else {
      // new game
      const newValue = new GameStruct({
        balance: new UintN256(deposit),
        assetId: assetId,
        isArc200Token: new Bool(true),
        isNativeToken: new Bool(false),
        isASAToken: new Bool(false),

        createdAtTime: new UintN64(Global.latestTimestamp),
        createdAtRound: new UintN64(Global.round),

        lastPlayedTime: new UintN64(0),
        lastWinTime: new UintN64(0),
        lastWinAmount: new UintN256(0),
        biggestWinAmount: new UintN256(0),
        biggestWinTime: new UintN64(0),

        winRatio: winRatio,
        owner: sender,
      })
      this.games(key).value = newValue.copy()
    }
    return this.games(key).value
  }
  /**
   * Starts new game play
   *
   * Player selects win probability and the data is stored to the player's box storage.
   *
   * @param txnDeposit Deposit
   * @param game The
   * @param winProbability
   */
  @arc4.abimethod()
  public StartGameWithNativeToken(
    txnDeposit: gtxn.PaymentTxn,
    game: AddressAssetStruct,
    winProbability: UintN64,
  ): PlayStruct {
    const sender = new arc4.Address(txnDeposit.sender)
    const assetId = new UintN64(0)
    assert(Txn.sender === txnDeposit.sender, 'Sender of the app call must be the same as sender of the deposit')
    assert(game.assetId === assetId, 'Asset id in the tx does not match the game asset id')
    assert(this.games(game).exists, 'The game does not exist')
    assert(this.games(game).value.assetId === assetId, 'This game must be played with native token')
    assert(winProbability.native <= 1_000_000, 'Win probability must be below 1 000 000')

    if (this.plays(sender).exists) {
      // user already played some game. Lets check if he does not have any pending game.
      assert(this.plays(sender).value.state.native > 1, 'Your previous game has not yet been claimed')
      // if the prev state is 2 or 3 (win or loose) we can override this game
    } else {
      // new game
    }
    this.games(game).value.lastPlayedTime = new UintN64(Global.latestTimestamp)

    // lets check if the game has enough money for potential win scenario
    // 100_000_000 * 1_000_000 / 200_000 = 500_000_000

    const winAmount: biguint = BigUint((txnDeposit.amount * 1_000_000) / winProbability.native)
    const maxPotWinAmount: biguint = this.games(game).value.balance.native / BigUint(2)
    assert(
      maxPotWinAmount >= winAmount,
      'The game does not have enough balance for your win scenario. You can win max 50% of the game balance',
    )

    let prevDeposit: UintN256 = new UintN256(0)
    if (this.allDeposits(assetId).exists) {
      prevDeposit = this.allDeposits(assetId).value
    }
    this.allDeposits(assetId).value = new UintN256(prevDeposit.native + BigUint(txnDeposit.amount))

    const newValue = new PlayStruct({
      round: new UintN64(Global.round),
      state: new UintN64(1),
      winProbability: winProbability,
      deposit: new UintN256(BigUint(txnDeposit.amount)),
      owner: sender,
      gameCreator: game.owner,
      assetId: game.assetId,
    })

    this.plays(sender).value = newValue.copy()
    return newValue
  }

  /**
   * Starts new game play
   *
   * Player selects win probability and the data is stored to the player's box storage.
   *
   * @param txnDeposit Deposit
   * @param game The
   * @param winProbability
   */
  @arc4.abimethod()
  public StartGameWithASAToken(
    txnDeposit: gtxn.AssetTransferTxn,
    game: AddressAssetStruct,
    winProbability: UintN64,
  ): PlayStruct {
    const sender = new arc4.Address(txnDeposit.sender)
    const assetId = new UintN64(txnDeposit.xferAsset.id)
    assert(Txn.sender === txnDeposit.sender, 'Sender of the app call must be the same as sender of the deposit')
    assert(game.assetId.native === assetId.native, 'Asset id in the tx does not match the game asset id')
    assert(this.games(game).exists, 'The game does not exist')
    assert(this.games(game).value.assetId === assetId, 'This game must be played with native token')
    assert(winProbability.native <= 1_000_000, 'Win probability must be below 1 000 000')

    if (this.plays(sender).exists) {
      // user already played some game. Lets check if he does not have any pending game.
      assert(this.plays(sender).value.state.native > 1, 'Your previous game has not yet been claimed')
      // if the prev state is 2 or 3 (win or loose) we can override this game
    } else {
      // new game
    }
    this.games(game).value.lastPlayedTime = new UintN64(Global.latestTimestamp)

    // lets check if the game has enough money for potential win scenario
    // 100_000_000 * 1_000_000 / 200_000 = 500_000_000

    const winAmount: biguint = BigUint((txnDeposit.assetAmount * 1_000_000) / winProbability.native)
    const maxPotWinAmount: biguint = this.games(game).value.balance.native / BigUint(2)
    assert(
      maxPotWinAmount >= winAmount,
      'The game does not have enough balance for your win scenario. You can win max 50% of the game balance',
    )

    let prevDeposit: UintN256 = new UintN256(0)
    if (this.allDeposits(assetId).exists) {
      prevDeposit = this.allDeposits(assetId).value
    }
    this.allDeposits(assetId).value = new UintN256(prevDeposit.native + BigUint(txnDeposit.assetAmount))

    const newValue = new PlayStruct({
      round: new UintN64(Global.round),
      state: new UintN64(1),
      winProbability: winProbability,
      deposit: new UintN256(BigUint(txnDeposit.assetAmount)),
      owner: sender,
      gameCreator: game.owner,
      assetId: game.assetId,
    })

    this.plays(sender).value = newValue.copy()
    return newValue
  }

  /**
   * Starts new game play
   *
   * Player selects win probability and the data is stored to the player's box storage.
   *
   * @param txnDeposit Deposit
   * @param game The
   * @param winProbability
   */
  @arc4.abimethod()
  public StartGameWithArc200Token(
    amount: UintN256,
    assetId: UintN64,
    game: AddressAssetStruct,
    winProbability: UintN64,
  ): PlayStruct {
    const sender = new arc4.Address(Txn.sender)
    assert(game.assetId === assetId, 'Asset id in the tx does not match the game asset id')
    assert(this.games(game).exists, 'The game does not exist')
    assert(this.games(game).value.assetId === assetId, 'This game must be played with native token')
    assert(winProbability.native <= 1_000_000, 'Win probability must be below 1 000 000')

    if (this.plays(sender).exists) {
      // user already played some game. Lets check if he does not have any pending game.
      assert(this.plays(sender).value.state.native > 1, 'Your previous game has not yet been claimed')
      // if the prev state is 2 or 3 (win or loose) we can override this game
    } else {
      // new game
    }

    this.games(game).value.lastPlayedTime = new UintN64(Global.latestTimestamp)
    // lets check if the game has enough money for potential win scenario
    // 100_000_000 * 1_000_000 / 200_000 = 500_000_000

    // perform the deposit
    itxn
      .applicationCall({
        appId: game.assetId.native,
        appArgs: [
          methodSelector('arc200_transferFrom(address,address,uint256)bool'),
          new Address(Txn.sender),
          new Address(Global.currentApplicationAddress),
          amount,
        ],
      })
      .submit()

    const winAmount: biguint = (amount.native * BigUint(1_000_000)) / BigUint(winProbability.native)
    const maxPotWinAmount: biguint = this.games(game).value.balance.native / BigUint(2)
    assert(
      maxPotWinAmount >= winAmount,
      'The game does not have enough balance for your win scenario. You can win max 50% of the game balance',
    )

    let prevDeposit: UintN256 = new UintN256(0)
    if (this.allDeposits(assetId).exists) {
      prevDeposit = this.allDeposits(assetId).value
    }
    this.allDeposits(assetId).value = new UintN256(prevDeposit.native + amount.native)

    const newValue = new PlayStruct({
      round: new UintN64(Global.round),
      state: new UintN64(1),
      winProbability: winProbability,
      deposit: new UintN256(amount.native),
      owner: sender,
      gameCreator: game.owner,
      assetId: game.assetId,
    })

    this.plays(sender).value = newValue.copy()
    return newValue
  }

  /**
   * Returns the current state of the game
   *
   * @returns the current game
   */
  @arc4.abimethod({ readonly: true })
  public Game(creator: Address, assetId: UintN64): GameStruct {
    const key = new AddressAssetStruct({
      assetId: assetId,
      owner: creator,
    })
    assert(this.games(key).exists, 'Did not found the game')
    return this.games(key).value
  }
  /**
   * Returns the active user box
   *
   * @returns the current player game
   */
  @arc4.abimethod({ readonly: true })
  public MyGame(): PlayStruct {
    const sender = new arc4.Address(Txn.sender)
    assert(this.plays(sender).exists, 'Did not found the game you are playing')
    return this.plays(sender).value
  }

  /**
   * Claim the game.
   *
   * If user won, he receives the assets
   *
   * If user lost, the game is funded with more balance
   */
  @arc4.abimethod()
  public ClaimGame(): PlayStruct {
    const sender = new arc4.Address(Txn.sender)
    assert(this.plays(sender).exists, 'Did not found the game you are playing')
    const play = this.plays(sender).value.copy()

    const key = new AddressAssetStruct({
      assetId: play.assetId,
      owner: play.gameCreator,
    })
    assert(this.games(key).exists, 'Did not found the game')
    const game = this.games(key).value.copy()

    // player did not claim the tx in time
    // 100 rounds @ 1 sec is ~ 2 minutes, at 2.7 sec its 4-5 min
    if (play.round.native < Global.round - 100) {
      this.LooseGame(key, game, play, sender)
      return this.plays(sender).value
    }

    // MAIN LOGIC OF THE APPLICATION IS HERE

    // seed is 256 bit number generated from prev block data
    const seed = BigUint(op.Block.blkSeed(play.round.native + 2))
    // lets take number from (0,1 with 6 decimal places)
    const rand0_1: biguint = seed % BigUint(1_000_000)

    // 200_000 * 900_000 / 1_000_000 = 180_000 (if player choose to play with win ration 0,2 and game has win ratio 0,9, we compare it to 0,18.. if rand(0,1) <= 0,18 then player won)
    const winThreshold: uint64 = (play.winProbability.native * game.winRatio.native) / 1_000_000
    if (rand0_1 < BigUint(winThreshold)) {
      // win
      // 100_000 * 1_000_000 / 1_000_000
      const winAmount: biguint = BigUint(
        (play.deposit.native * BigUint(1_000_000)) / BigUint(play.winProbability.native),
      )

      this.games(key).value.lastWinAmount = new UintN256(winAmount)
      this.games(key).value.lastWinTime = new UintN64(Global.latestTimestamp)
      if (winAmount > game.biggestWinAmount.native) {
        this.games(key).value.biggestWinAmount = new UintN256(winAmount)
        this.games(key).value.biggestWinTime = new UintN64(Global.latestTimestamp)
      }

      if (game.isNativeToken.native) {
        // native token

        let prevDeposit: UintN256 = new UintN256(0)
        if (this.allDeposits(key.assetId).exists) {
          prevDeposit = this.allDeposits(key.assetId).value
        }
        assert(prevDeposit.native >= winAmount, 'There is not enough money in the sc to cover this win tx')
        this.allDeposits(key.assetId).value = new UintN256(prevDeposit.native - winAmount)

        assert(game.balance.native >= winAmount, 'There is not enough money in the sc to cover this win tx')
        this.games(key).value.balance = new UintN256(game.balance.native - winAmount)

        this.plays(sender).value.state = new UintN64(2) // mark the state of the game 2 - win

        itxn
          .payment({
            sender: Global.currentApplicationAddress,
            receiver: play.owner.native,
            amount: new UintN64(winAmount).native,
            fee: 0,
          })
          .submit()
      }

      if (game.isASAToken.native) {
        // ASA token

        let prevDeposit: UintN256 = new UintN256(0)
        if (this.allDeposits(key.assetId).exists) {
          prevDeposit = this.allDeposits(key.assetId).value
        }
        assert(prevDeposit.native >= winAmount, 'There is not enough money in the sc to cover this win tx')
        this.allDeposits(key.assetId).value = new UintN256(prevDeposit.native - winAmount)

        assert(game.balance.native >= winAmount, 'There is not enough money in the sc to cover this win tx')
        this.games(key).value.balance = new UintN256(game.balance.native - winAmount)

        this.plays(sender).value.state = new UintN64(2) // mark the state of the game 2 - win

        itxn
          .assetTransfer({
            sender: Global.currentApplicationAddress,
            assetReceiver: play.owner.native,
            assetAmount: new UintN64(winAmount).native,
            xferAsset: game.assetId.native,
            fee: 0,
          })
          .submit()
      }
      if (game.isArc200Token.native) {
        let prevDeposit: UintN256 = new UintN256(0)
        if (this.allDeposits(key.assetId).exists) {
          prevDeposit = this.allDeposits(key.assetId).value
        }
        assert(prevDeposit.native >= winAmount, 'There is not enough money in the sc to cover this win tx')
        this.allDeposits(key.assetId).value = new UintN256(prevDeposit.native - winAmount)

        assert(game.balance.native >= winAmount, 'There is not enough money in the sc to cover this win tx')
        this.games(key).value.balance = new UintN256(game.balance.native - winAmount)

        this.plays(sender).value.state = new UintN64(2) // mark the state of the game 2 - win

        // ARC 200
        itxn
          .applicationCall({
            appId: game.assetId.native,
            appArgs: [methodSelector('arc200_transfer(address,uint256)bool'), play.owner, new UintN256(winAmount)],
            fee: 0,
          })
          .submit()
      }
    } else {
      // loose
      this.LooseGame(key, game, play, sender)
    }
    return this.plays(sender).value
  }
  // internal method to mark the game as lost and set the correct balances to the game
  private LooseGame(key: AddressAssetStruct, game: GameStruct, play: PlayStruct, sender: Address) {
    // deduct the lost game fee (the game creator won, so he charges the deposit fee to his game)
    // the fee is calculated as 20% from the game creator profit
    // for game win ratio 90%, the fee is (100-90)*0.2 % of every deposit to the game from lost game

    const gameProfitRatio: uint64 = 1_000_000 - this.games(key).value.winRatio.native
    const feeRatio: uint64 = gameProfitRatio / 5
    const fee: biguint = (play.deposit.native * BigUint(feeRatio)) / BigUint(1_000_000)

    this.allDeposits(key.assetId).value = new UintN256(this.allDeposits(key.assetId).value.native - fee)
    this.games(key).value.balance = new UintN256(game.balance.native + play.deposit.native - fee)
    this.plays(sender).value.state = new UintN64(3) // mark the state of the game 3 - loose
  }
}
