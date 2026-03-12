
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


export const CameraPreview: typeof import("../components/CameraPreview.vue").default
export const ControlPanel: typeof import("../components/ControlPanel.vue").default
export const DebugPanel: typeof import("../components/DebugPanel.vue").default
export const EyeGazeCalibration: typeof import("../components/EyeGazeCalibration.vue").default
export const GazeCursor: typeof import("../components/GazeCursor.vue").default
export const NextSuggestionsButton: typeof import("../components/NextSuggestionsButton.vue").default
export const PhraseCard: typeof import("../components/PhraseCard.vue").default
export const ScenePreview: typeof import("../components/ScenePreview.vue").default
export const SentenceBuilder: typeof import("../components/SentenceBuilder.vue").default
export const SettingsSidebar: typeof import("../components/SettingsSidebar.vue").default
export const StartScreen: typeof import("../components/StartScreen.vue").default
export const WordCorners: typeof import("../components/WordCorners.vue").default
export const SpeakingContextPanel: typeof import("../components/speaking/ContextPanel.vue").default
export const SpeakingLetterCard: typeof import("../components/speaking/LetterCard.vue").default
export const SpeakingLetterCardGrid: typeof import("../components/speaking/LetterCardGrid.vue").default
export const SpeakingSentenceSuggestions: typeof import("../components/speaking/SentenceSuggestions.vue").default
export const SpeakingTypedTextDisplay: typeof import("../components/speaking/TypedTextDisplay.vue").default
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only").default
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only").default
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
export const NuxtLinkLocale: typeof import("../node_modules/@nuxtjs/i18n/dist/runtime/components/NuxtLinkLocale").default
export const SwitchLocalePathLink: typeof import("../node_modules/@nuxtjs/i18n/dist/runtime/components/SwitchLocalePathLink").default
export const Motion: typeof import("@vueuse/motion").MotionComponent
export const MotionGroup: typeof import("@vueuse/motion").MotionGroupComponent
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page").default
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components").Link
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components").Base
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components").Title
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components").Style
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components").Head
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components").Html
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components").Body
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default
export const LazyCameraPreview: LazyComponent<typeof import("../components/CameraPreview.vue").default>
export const LazyControlPanel: LazyComponent<typeof import("../components/ControlPanel.vue").default>
export const LazyDebugPanel: LazyComponent<typeof import("../components/DebugPanel.vue").default>
export const LazyEyeGazeCalibration: LazyComponent<typeof import("../components/EyeGazeCalibration.vue").default>
export const LazyGazeCursor: LazyComponent<typeof import("../components/GazeCursor.vue").default>
export const LazyNextSuggestionsButton: LazyComponent<typeof import("../components/NextSuggestionsButton.vue").default>
export const LazyPhraseCard: LazyComponent<typeof import("../components/PhraseCard.vue").default>
export const LazyScenePreview: LazyComponent<typeof import("../components/ScenePreview.vue").default>
export const LazySentenceBuilder: LazyComponent<typeof import("../components/SentenceBuilder.vue").default>
export const LazySettingsSidebar: LazyComponent<typeof import("../components/SettingsSidebar.vue").default>
export const LazyStartScreen: LazyComponent<typeof import("../components/StartScreen.vue").default>
export const LazyWordCorners: LazyComponent<typeof import("../components/WordCorners.vue").default>
export const LazySpeakingContextPanel: LazyComponent<typeof import("../components/speaking/ContextPanel.vue").default>
export const LazySpeakingLetterCard: LazyComponent<typeof import("../components/speaking/LetterCard.vue").default>
export const LazySpeakingLetterCardGrid: LazyComponent<typeof import("../components/speaking/LetterCardGrid.vue").default>
export const LazySpeakingSentenceSuggestions: LazyComponent<typeof import("../components/speaking/SentenceSuggestions.vue").default>
export const LazySpeakingTypedTextDisplay: LazyComponent<typeof import("../components/speaking/TypedTextDisplay.vue").default>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only").default>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only").default>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
export const LazyNuxtLinkLocale: LazyComponent<typeof import("../node_modules/@nuxtjs/i18n/dist/runtime/components/NuxtLinkLocale").default>
export const LazySwitchLocalePathLink: LazyComponent<typeof import("../node_modules/@nuxtjs/i18n/dist/runtime/components/SwitchLocalePathLink").default>
export const LazyMotion: LazyComponent<typeof import("@vueuse/motion").MotionComponent>
export const LazyMotionGroup: LazyComponent<typeof import("@vueuse/motion").MotionGroupComponent>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page").default>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Link>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Base>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Title>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Style>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Head>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Html>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Body>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default>

export const componentNames: string[]
