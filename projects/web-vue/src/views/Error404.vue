<script setup lang="ts">
import { useI18n } from "vue-i18n";
import H1 from "../components/H1.vue";
import MainButton from "../components/MainButton.vue";
import MainPanel from "../components/MainPanel.vue";

useI18n(); // Initialize i18n for this component
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full">
    <MainPanel class="w-200 text-white p-6">
      <H1>{{ $t('errors.error404') }}</H1>
      <p class="my-4">{{ $t('errors.error404Message') }}</p>
      <RouterLink to="/">
        <MainButton>{{ $t('common.goHome') }}</MainButton>
      </RouterLink>
    </MainPanel>
  </div>
</template>
