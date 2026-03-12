
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  'CameraPreview': typeof import("../../components/CameraPreview.vue").default
  'ControlPanel': typeof import("../../components/ControlPanel.vue").default
  'DebugPanel': typeof import("../../components/DebugPanel.vue").default
  'EyeGazeCalibration': typeof import("../../components/EyeGazeCalibration.vue").default
  'GazeCursor': typeof import("../../components/GazeCursor.vue").default
  'NextSuggestionsButton': typeof import("../../components/NextSuggestionsButton.vue").default
  'PhraseCard': typeof import("../../components/PhraseCard.vue").default
  'ScenePreview': typeof import("../../components/ScenePreview.vue").default
  'SentenceBuilder': typeof import("../../components/SentenceBuilder.vue").default
  'SettingsSidebar': typeof import("../../components/SettingsSidebar.vue").default
  'StartScreen': typeof import("../../components/StartScreen.vue").default
  'WordCorners': typeof import("../../components/WordCorners.vue").default
  'SpeakingContextPanel': typeof import("../../components/speaking/ContextPanel.vue").default
  'SpeakingLetterCard': typeof import("../../components/speaking/LetterCard.vue").default
  'SpeakingLetterCardGrid': typeof import("../../components/speaking/LetterCardGrid.vue").default
  'SpeakingSentenceSuggestions': typeof import("../../components/speaking/SentenceSuggestions.vue").default
  'SpeakingTypedTextDisplay': typeof import("../../components/speaking/TypedTextDisplay.vue").default
  'NuxtWelcome': typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default
  'NuxtLayout': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default
  'NuxtErrorBoundary': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
  'ClientOnly': typeof import("../../node_modules/nuxt/dist/app/components/client-only").default
  'DevOnly': typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default
  'ServerPlaceholder': typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default
  'NuxtLink': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default
  'NuxtLoadingIndicator': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
  'NuxtTime': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
  'NuxtRouteAnnouncer': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
  'NuxtImg': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
  'NuxtPicture': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
  'NuxtLinkLocale': typeof import("../../node_modules/@nuxtjs/i18n/dist/runtime/components/NuxtLinkLocale").default
  'SwitchLocalePathLink': typeof import("../../node_modules/@nuxtjs/i18n/dist/runtime/components/SwitchLocalePathLink").default
  'Motion': typeof import("@vueuse/motion").MotionComponent
  'MotionGroup': typeof import("@vueuse/motion").MotionGroupComponent
  'NuxtPage': typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default
  'NoScript': typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript
  'Link': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link
  'Base': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base
  'Title': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title
  'Meta': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta
  'Style': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style
  'Head': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head
  'Html': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html
  'Body': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body
  'NuxtIsland': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default
  'LazyCameraPreview': LazyComponent<typeof import("../../components/CameraPreview.vue").default>
  'LazyControlPanel': LazyComponent<typeof import("../../components/ControlPanel.vue").default>
  'LazyDebugPanel': LazyComponent<typeof import("../../components/DebugPanel.vue").default>
  'LazyEyeGazeCalibration': LazyComponent<typeof import("../../components/EyeGazeCalibration.vue").default>
  'LazyGazeCursor': LazyComponent<typeof import("../../components/GazeCursor.vue").default>
  'LazyNextSuggestionsButton': LazyComponent<typeof import("../../components/NextSuggestionsButton.vue").default>
  'LazyPhraseCard': LazyComponent<typeof import("../../components/PhraseCard.vue").default>
  'LazyScenePreview': LazyComponent<typeof import("../../components/ScenePreview.vue").default>
  'LazySentenceBuilder': LazyComponent<typeof import("../../components/SentenceBuilder.vue").default>
  'LazySettingsSidebar': LazyComponent<typeof import("../../components/SettingsSidebar.vue").default>
  'LazyStartScreen': LazyComponent<typeof import("../../components/StartScreen.vue").default>
  'LazyWordCorners': LazyComponent<typeof import("../../components/WordCorners.vue").default>
  'LazySpeakingContextPanel': LazyComponent<typeof import("../../components/speaking/ContextPanel.vue").default>
  'LazySpeakingLetterCard': LazyComponent<typeof import("../../components/speaking/LetterCard.vue").default>
  'LazySpeakingLetterCardGrid': LazyComponent<typeof import("../../components/speaking/LetterCardGrid.vue").default>
  'LazySpeakingSentenceSuggestions': LazyComponent<typeof import("../../components/speaking/SentenceSuggestions.vue").default>
  'LazySpeakingTypedTextDisplay': LazyComponent<typeof import("../../components/speaking/TypedTextDisplay.vue").default>
  'LazyNuxtWelcome': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default>
  'LazyNuxtLayout': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default>
  'LazyNuxtErrorBoundary': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
  'LazyClientOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only").default>
  'LazyDevOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default>
  'LazyServerPlaceholder': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default>
  'LazyNuxtLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default>
  'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
  'LazyNuxtTime': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
  'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
  'LazyNuxtImg': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
  'LazyNuxtPicture': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
  'LazyNuxtLinkLocale': LazyComponent<typeof import("../../node_modules/@nuxtjs/i18n/dist/runtime/components/NuxtLinkLocale").default>
  'LazySwitchLocalePathLink': LazyComponent<typeof import("../../node_modules/@nuxtjs/i18n/dist/runtime/components/SwitchLocalePathLink").default>
  'LazyMotion': LazyComponent<typeof import("@vueuse/motion").MotionComponent>
  'LazyMotionGroup': LazyComponent<typeof import("@vueuse/motion").MotionGroupComponent>
  'LazyNuxtPage': LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default>
  'LazyNoScript': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript>
  'LazyLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link>
  'LazyBase': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base>
  'LazyTitle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title>
  'LazyMeta': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta>
  'LazyStyle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style>
  'LazyHead': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head>
  'LazyHtml': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html>
  'LazyBody': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body>
  'LazyNuxtIsland': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
