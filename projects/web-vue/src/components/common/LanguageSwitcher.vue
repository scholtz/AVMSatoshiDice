<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
      :class="{ 'text-white bg-gray-800': isOpen }"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span>{{ currentLanguage?.nativeName || 'Language' }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50"
        @click.outside="isOpen = false"
      >
        <div class="py-1">
          <button
            v-for="language in languages"
            :key="language.code"
            @click="selectLanguage(language.code)"
            class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center justify-between"
            :class="{
              'bg-gray-700 text-white': currentLocale === language.code
            }"
          >
            <span>{{ language.nativeName }}</span>
            <span v-if="currentLocale === language.code" class="text-primary-400">✓</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAvailableLanguages, setLanguage } from '../../i18n'

const { locale } = useI18n()
const isOpen = ref(false)
const languages = getAvailableLanguages()

const currentLocale = computed(() => locale.value)
const currentLanguage = computed(() => 
  languages.find(lang => lang.code === currentLocale.value)
)

const selectLanguage = (languageCode: string) => {
  setLanguage(languageCode)
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Custom styles for the language switcher */
.transition {
  transition-property: all;
}
</style>