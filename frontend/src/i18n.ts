import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false, // React handles XSS
  },
  backend: {
    loadPath: '/content/locales/{{lng}}.json',
  },
  // Resources loaded async — components wrapped in Suspense handle loading state
  resources: {},
})

// Load locale file dynamically
async function loadLocale(lang: string) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}content/locales/${lang}.json`)
    if (!response.ok) throw new Error(`Failed to load locale: ${lang}`)
    const translations = await response.json()
    i18n.addResourceBundle(lang, 'translation', translations, true, true)
  } catch (err) {
    console.warn(`Could not load locale "${lang}", falling back to keys`, err)
  }
}

loadLocale('en')

export default i18n
export { loadLocale }
