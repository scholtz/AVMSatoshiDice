import { createI18n } from 'vue-i18n'

// Import all locale files
import en from './locales/en.json'
import sk from './locales/sk.json'
import de from './locales/de.json'
import ru from './locales/ru.json'
import es from './locales/es.json'
import zh from './locales/zh.json'
import pl from './locales/pl.json'
import cs from './locales/cs.json'

// Function to detect browser language
function getBrowserLanguage(): string {
  const browserLang = navigator.language || (navigator as any).languages?.[0] || 'en'
  
  // Extract primary language code (e.g., 'en-US' -> 'en')
  const primaryLang = browserLang.split('-')[0].toLowerCase()
  
  // Map browser language to supported languages
  const supportedLanguages = ['en', 'sk', 'de', 'ru', 'es', 'zh', 'pl', 'cs']
  
  return supportedLanguages.includes(primaryLang) ? primaryLang : 'en'
}

// Get saved language from localStorage or detect from browser
function getInitialLanguage(): string {
  const saved = localStorage.getItem('language')
  if (saved && ['en', 'sk', 'de', 'ru', 'es', 'zh', 'pl', 'cs'].includes(saved)) {
    return saved
  }
  
  // Detect browser language
  const detected = getBrowserLanguage()
  
  // Save detected language to localStorage
  localStorage.setItem('language', detected)
  
  return detected
}

const messages = {
  en,
  sk,
  de,
  ru,
  es,
  zh,
  pl,
  cs
}

export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getInitialLanguage(),
  fallbackLocale: 'en',
  messages,
  globalInjection: true
})

// Set initial HTML lang attribute
document.documentElement.setAttribute('lang', getInitialLanguage())

// Function to change language and persist to localStorage
export function setLanguage(locale: string) {
  const supportedLocales = ['en', 'sk', 'de', 'ru', 'es', 'zh', 'pl', 'cs']
  if (supportedLocales.includes(locale)) {
    i18n.global.locale.value = locale as any
    localStorage.setItem('language', locale)
    
    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', locale)
  }
}

// Get available languages with their display names
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština' }
  ]
}

export default i18n