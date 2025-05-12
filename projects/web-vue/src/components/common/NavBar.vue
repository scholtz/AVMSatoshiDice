<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import AppButton from "./AppButton.vue";

const router = useRouter();
const isMenuOpen = ref(false);
const { activeWallet, activeAddress } = useWallet();

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const disconnectClick = () => {
  activeWallet.value?.disconnect();
  router.push("/");
};
</script>

<template>
  <nav class="bg-background-dark border-b border-gray-800 w-full items-start justify-self-start place-content-start place-self-start">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">
          <RouterLink to="/" class="flex-shrink-0">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-primary-600 rounded flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1" fill="currentColor"></circle>
                  <circle cx="15.5" cy="8.5" r="1" fill="currentColor"></circle>
                  <circle cx="15.5" cy="15.5" r="1" fill="currentColor"></circle>
                  <circle cx="8.5" cy="15.5" r="1" fill="currentColor"></circle>
                </svg>
              </div>
              <span class="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 text-transparent bg-clip-text"
                >AVM Satoshi Dice</span
              >
            </div>
          </RouterLink>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <RouterLink to="/" class="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-800">Games</RouterLink>
              <RouterLink
                to="/proovable-fair-onchain-game"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Rules
              </RouterLink>
              <RouterLink
                to="/create-game"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Create Game
              </RouterLink>
            </div>
          </div>
        </div>
        <div class="hidden md:block">
          <div class="ml-4 flex items-center md:ml-6">
            <div v-if="activeAddress" class="relative">
              <div class="flex items-center">
                <span class="bg-gradient-to-r from-primary-600 to-secondary-600 px-3 py-2 rounded-l-md text-white font-medium">
                  {{ activeAddress.substring(0, 5) + "..." + activeAddress.substring(activeAddress.length - 5) }}
                </span>
                <AppButton @click="disconnectClick" class="rounded-l-none"> Disconnect </AppButton>
              </div>
            </div>
          </div>
        </div>
        <div class="-mr-2 flex md:hidden">
          <button
            @click="toggleMenu"
            type="button"
            class="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
          >
            <span class="sr-only">Open main menu</span>
            <svg
              class="block h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div :class="isMenuOpen ? 'block' : 'hidden'" class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <RouterLink to="/" class="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800">Games</RouterLink>
        <RouterLink
          to="/proovable-fair-onchain-game"
          class="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Rules
        </RouterLink>
        <RouterLink
          to="/create-game"
          class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >Create Game</RouterLink
        >
      </div>
      <div class="pt-4 pb-3 border-t border-gray-700">
        <div class="flex items-center px-5">
          <div v-if="activeAddress" class="w-full">
            <div class="text-base font-medium leading-none text-white mb-2">
              {{ activeAddress.substring(0, 5) + "..." + activeAddress.substring(activeAddress.length - 5) }}
            </div>
            <AppButton @click="disconnectClick" class="w-full"> Disconnect </AppButton>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
