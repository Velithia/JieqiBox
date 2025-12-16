import { createI18n } from 'vue-i18n'
import zh_cn from './locales/zh_cn'
import zh_tw from './locales/zh_tw'
import en from './locales/en'
import vi from './locales/vi'
import ja from './locales/ja'
import ko from './locales/ko'
import ru from './locales/ru'
import de from './locales/de'
import fr from './locales/fr'
import es from './locales/es'
import th from './locales/th'
import ms from './locales/ms'
import { useConfigManager } from '../composables/useConfigManager'

// Get user's preferred language
const getDefaultLocale = () => {
  try {
    // Try to get saved language setting from config manager
    const configManager = useConfigManager()
    const savedLocale = configManager.getLocale()
    if (
      savedLocale &&
      [
        'zh_cn',
        'zh_tw',
        'en',
        'vi',
        'ja',
        'ko',
        'ru',
        'de',
        'fr',
        'es',
        'th',
        'ms',
      ].includes(savedLocale)
    ) {
      return savedLocale
    }
  } catch (error) {
    // Fallback if config manager is not available yet
    console.warn(
      'Config manager not available during i18n initialization:',
      error
    )
  }

  // Detect browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh-cn')) return 'zh_cn'
  if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk'))
    return 'zh_tw'
  if (browserLang.startsWith('vi')) return 'vi'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('ko')) return 'ko'
  if (browserLang.startsWith('ru')) return 'ru'
  if (browserLang.startsWith('de')) return 'de'
  if (browserLang.startsWith('fr')) return 'fr'
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('th')) return 'th'
  if (browserLang.startsWith('ms')) return 'ms'
  if (browserLang.startsWith('en')) return 'en'

  // Default to Simplified Chinese
  return 'zh_cn'
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getDefaultLocale(),
  fallbackLocale: 'zh_cn',
  messages: {
    zh_cn,
    zh_tw,
    en,
    vi,
    ja,
    ko,
    ru,
    de,
    fr,
    es,
    th,
    ms,
  },
})

export default i18n
