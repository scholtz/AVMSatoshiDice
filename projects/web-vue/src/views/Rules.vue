<script setup lang="ts">
import MainButton from "../components/MainButton.vue";
import MainPanel from "../components/MainPanel.vue";
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <MainPanel class="">
      <div class="bg-gradient-to-r from-primary-900 to-background-dark p-4 border-b border-gray-800">
        <h3 class="text-lg font-semibold text-white">AVM Satoshi Dice game</h3>
      </div>
      <div class="p-6">
        <p class="my-4">AVM Satoshi Dice is proovable fair onchain game.</p>
        <H2>Game rules</H2>
        <img src="../assets/example-1.png" class="float-right ml-4 w-96" />
        <p class="my-4">
          First, select your probability of winning. For example, if you choose 50%, you can double your deposit. Combination of game win
          ratio and probability of winning is the game play probability of winning P (Up*Gp=P).
        </p>
        <p class="my-4">Then make a deposit to the blockchain game. Deposit will be deposited in block B.</p>
        <p class="my-4">
          Few blocks (few seconds) afterwards, all blockchain transactions generate new block. Every block has its seed number which is the
          input to another block (Thats why its called blockchain).
        </p>
        <p class="my-4">
          Seed is 32 bytes long number. It can be represented in base64, hex or decimal representation. Modulo of the seed of
          {{ Number(1_000_000).toLocaleString() }} will give you from the right side the number R.
          {{ Number(123_456_789).toLocaleString() }} modulo {{ Number(1_000_000).toLocaleString() }} =
          {{ Number(456_789).toLocaleString() }}. Game uses the R as random input to the game. If R < P
        </p>
        <p class="my-4">If R < P user won the game. If R >= P user lost the game and deposit to the game is incresed.</p>
        <p class="my-4">
          If player wins, his reward is calculated as deposit / probability of winning. So if user chosen {{ Number(50).toLocaleString() }}%
          as probability of winning and deposited {{ Number(1000).toLocaleString() }} tokens, {{ Number(1000).toLocaleString() }} /
          {{ Number(0.5).toLocaleString() }} = {{ Number(2000).toLocaleString() }}, net profit {{ Number(1000).toLocaleString() }}. If user
          chosen {{ Number(1).toLocaleString() }}% as probability of winning and deposited {{ Number(1000).toLocaleString() }} tokens,
          {{ Number(1000).toLocaleString() }} / {{ Number(0.01).toLocaleString() }} = {{ Number(100000).toLocaleString() }}, net profit
          {{ Number(99000).toLocaleString() }} tokens.
        </p>
        <p>Smallest user probability of winning is 0.0001%. Highest is 100%.</p>
        <p>
          User pays the network fees ~ 0.01 token per game. At algo price $1/Algo, user can play at least 100 games for $1 net worth of the
          network fees.
        </p>
        <p class="my-4">If you are not of legal age in your country, please do not play the game. Playing may lead to addiction.</p>

        <H2>Who can create game?</H2>
        <p class="my-4">
          Anyone who wants to make some tokens in long run, and believes in randomness of the AVM blockchain seed, can create a game. The
          initial deposit is required. The token to be deposited can be native blockchain token, ASA or ARC200.
        </p>
        <p class="my-4">
          You can select win ratio for your game (Gp). Win ratio is factor by which a player has smaller chance to win. Win ratio 90% means
          that if user picked 100% win, at the end his game play probability of winning (P) will be 90%.
        </p>
        <p class="my-4">
          There are protocol fees in place - deposit and withdrawal fee is 2.5%. The profit sharing fee is 20%. If the user looses against
          the game, the game receives his deposit minus the profit sharing fee. The profit sharing fee is 1-win game ratio. For game with
          90% win game ratio, the profit from deposit {{ Number(100000).toLocaleString() }} tokens is 10% =
          {{ Number(10000).toLocaleString() }} tokens. The protocol profit sharing fee is {{ Number(2000).toLocaleString() }} tokens.
        </p>

        <RouterLink to="/">
          <MainButton>Go home</MainButton>
        </RouterLink>
      </div>
    </MainPanel>
  </div>
</template>
