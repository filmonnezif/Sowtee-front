// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'shadcn-nuxt',
    '@nuxtjs/i18n',
    '@vueuse/motion/nuxt',
  ],

  i18n: {
    locales: [
      { code: 'en', file: 'en.json', name: 'English', dir: 'ltr' },
      { code: 'ar', file: 'ar.json', name: 'Arabic', dir: 'rtl' },
      { code: 'ur', file: 'ur.json', name: 'Urdu', dir: 'rtl' }
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    },
  },

  app: {
    head: {
      title: 'SOWTEE - صوتي',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'SOWTEE - The Self-Learning, Context-Aware Agentic Communication Bridge for AAC'
        },
      ],
      htmlAttrs: {},
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // Disable vite plugin-checker to avoid vueTsc issues
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  compatibilityDate: '2024-01-15',
})
