<script setup lang="ts">
import { useI18n } from "vue-i18n";
import MainButton from "../components/MainButton.vue";
import MainPanel from "../components/MainPanel.vue";

useI18n(); // Initialize i18n for this component
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <MainPanel class="">
      <div class="bg-gradient-to-r from-primary-900 to-background-dark p-4 border-b border-gray-800">
        <h3 class="text-lg font-semibold text-white">{{ $t('rules.gameTitle') }}</h3>
      </div>
      <div class="p-6">
        <p class="my-4">{{ $t('rules.gameDescription') }}</p>
        <H2>{{ $t('rules.gameRules') }}</H2>
        <img src="../assets/example-1.png" class="float-right ml-4 w-96" />
        <p class="my-4">
          {{ $t('rules.gameRulesDescription1') }}
        </p>
        <p class="my-4">{{ $t('rules.gameRulesDescription2') }}</p>
        <p class="my-4">
          {{ $t('rules.gameRulesDescription3') }}
        </p>
        <p class="my-4">
          {{ $t('rules.gameRulesDescription4') }}
          {{ Number(1_000_000).toLocaleString() }} {{ $t('rules.gameRulesDescription5') }}
          {{ Number(123_456_789).toLocaleString() }} {{ $t('rules.gameRulesDescription6') }} {{ Number(1_000_000).toLocaleString() }} =
          {{ Number(456_789).toLocaleString() }}. {{ $t('rules.gameRulesDescription7') }}
        </p>
        <p class="my-4">{{ $t('rules.gameRulesDescription8') }}</p>
        <p class="my-4">
          {{ $t('rules.gameRulesDescription9') }} {{ Number(50).toLocaleString() }}%
          {{ $t('rules.gameRulesDescription10') }} {{ Number(1000).toLocaleString() }} {{ $t('rules.gameRulesDescription11') }} {{ Number(1000).toLocaleString() }} /
          {{ Number(0.5).toLocaleString() }} = {{ Number(2000).toLocaleString() }}{{ $t('rules.gameRulesDescription12') }} {{ Number(1000).toLocaleString() }}. {{ $t('rules.gameRulesDescription13') }}
          {{ Number(1).toLocaleString() }}% {{ $t('rules.gameRulesDescription10') }} {{ Number(1000).toLocaleString() }} {{ $t('rules.gameRulesDescription11') }}
          {{ Number(1000).toLocaleString() }} / {{ Number(0.01).toLocaleString() }} = {{ Number(100000).toLocaleString() }}, {{ $t('rules.gameRulesDescription12') }}
          {{ Number(99000).toLocaleString() }} {{ $t('rules.gameRulesDescription14') }}
        </p>
        <p>{{ $t('rules.gameRulesDescription15') }}</p>
        <p>
          {{ $t('rules.gameRulesDescription16') }}
        </p>
        <p>
          {{ $t('rules.gameRulesDescription17') }}
        </p>
        <p class="my-4">{{ $t('rules.gameRulesDescription18') }}</p>

        <H2>{{ $t('rules.whoCanCreateGame') }}</H2>
        <p class="my-4">
          {{ $t('rules.whoCanCreateGameDescription1') }}
        </p>
        <p class="my-4">
          {{ $t('rules.whoCanCreateGameDescription2') }}
        </p>
        <p class="my-4">
          {{ $t('rules.whoCanCreateGameDescription3') }}
          {{ Number(100000).toLocaleString() }} {{ $t('rules.whoCanCreateGameDescription4') }}
          {{ Number(10000).toLocaleString() }} {{ $t('rules.whoCanCreateGameDescription5') }} {{ Number(2000).toLocaleString() }} {{ $t('rules.whoCanCreateGameDescription6') }}
        </p>
        <img src="../assets/netlogo-satoshi-dice-simulation.jpg" class="float-right ml-4 w-96" />
        <p class="my-4">
          {{ $t('rules.whoCanCreateGameDescription7') }}
          <a href="https://ccl.northwestern.edu/netlogo/" target="_blank">{{ $t('rules.netLogoSoftware') }}</a>. {{ $t('rules.whoCanCreateGameDescription8') }}
          <a href="/files/simulation.nlogo">{{ $t('rules.simulationDownload') }}</a>.
        </p>
        <RouterLink to="/">
          <MainButton>{{ $t('common.goHome') }}</MainButton>
        </RouterLink>
      </div>
    </MainPanel>
  </div>
</template>
