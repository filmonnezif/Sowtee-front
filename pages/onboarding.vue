<script setup lang="ts">
import { UserRound, Hand, Eye, ToggleRight, Globe, ArrowRight, ArrowLeft } from 'lucide-vue-next'
import type { InteractionMode } from '~/types/api'

const appStore = useAppStore()
const { $i18n } = useNuxtApp()

const step = ref(0)
const totalSteps = 3

const loginName = ref(appStore.userName)
const selectedMode = ref<InteractionMode>('touch')
const selectedLanguage = ref<'en' | 'ar' | 'ur'>(appStore.language || 'en')

const modeOptions: Array<{ value: InteractionMode; label: string; sub: string; icon: typeof Hand }> = [
  { value: 'touch', label: 'Touch', sub: 'Best default for fast start', icon: Hand },
  { value: 'eye_gaze', label: 'Eye Gaze', sub: 'Hands-free with gaze dwell', icon: Eye },
  { value: 'switch', label: 'Switch', sub: 'Assistive switch input', icon: ToggleRight },
]

const languageOptions: Array<{ value: 'en' | 'ar' | 'ur'; label: string; sub: string }> = [
  { value: 'en', label: 'English', sub: 'Default' },
  { value: 'ar', label: 'العربية', sub: 'Arabic' },
  { value: 'ur', label: 'اردو', sub: 'Urdu' },
]

const currentTitle = computed(() => {
  if (step.value === 0) return 'Quick setup'
  if (step.value === 1) return 'Choose input mode'
  return 'Choose language'
})

const currentHint = computed(() => {
  if (step.value === 0) return 'Optional. You can skip and start now.'
  if (step.value === 1) return 'Touch is preselected so you can move fast.'
  return 'You can change this later in settings.'
})

function goBack() {
  if (step.value === 0) {
    navigateTo('/')
    return
  }
  step.value--
}

function goNext() {
  if (step.value >= totalSteps - 1) return
  step.value++
}

function markOnboardingCompleted() {
  if (typeof appStore.completeOnboarding === 'function') {
    appStore.completeOnboarding()
    return
  }

  ;(appStore as any).hasCompletedOnboarding = true
  ;(appStore as any).hasSkippedOnboarding = false

  if (import.meta.client) {
    localStorage.setItem('sowtee_onboarding_complete', 'true')
    localStorage.removeItem('sowtee_onboarding_skipped')
  }
}

function markOnboardingSkipped() {
  if (typeof appStore.skipOnboarding === 'function') {
    appStore.skipOnboarding()
    return
  }

  ;(appStore as any).hasSkippedOnboarding = true

  if (import.meta.client) {
    localStorage.setItem('sowtee_onboarding_skipped', 'true')
  }
}

async function applyAndStart(markCompleted = true) {
  const trimmedName = loginName.value.trim()

  if (trimmedName) {
    appStore.loginWithName(trimmedName)
  }

  appStore.setInteractionMode(selectedMode.value)
  appStore.setLanguage(selectedLanguage.value)
  await $i18n.setLocale(selectedLanguage.value)

  if (markCompleted) {
    markOnboardingCompleted()
  }

  await navigateTo('/speaking')
}

async function completeFlow() {
  await applyAndStart(true)
}

async function skipFlow() {
  markOnboardingSkipped()
  await navigateTo('/speaking')
}

onMounted(async () => {
  await nextTick()

  if (appStore.hasCompletedOnboarding || appStore.hasSkippedOnboarding) {
    await navigateTo('/speaking')
  }
})
</script>

<template>
  <div class="onboarding-page">
    <main class="onboarding-shell">
      <header class="onboarding-header">
        <button class="onboarding-nav-btn" @click="goBack">
          <ArrowLeft :size="18" />
          <span>Back</span>
        </button>

        <button class="onboarding-skip-btn" @click="skipFlow">
          Skip for now
        </button>
      </header>

      <div class="onboarding-progress" aria-hidden="true">
        <span
          v-for="dot in totalSteps"
          :key="dot"
          class="onboarding-progress__dot"
          :class="{ 'onboarding-progress__dot--active': dot - 1 <= step }"
        />
      </div>

      <section class="onboarding-card">
        <p class="onboarding-step">Step {{ step + 1 }} of {{ totalSteps }}</p>
        <h1 class="onboarding-title">{{ currentTitle }}</h1>
        <p class="onboarding-hint">{{ currentHint }}</p>

        <div v-if="step === 0" class="onboarding-content">
          <label class="onboarding-label" for="onboarding-name">Your name (optional)</label>
          <div class="onboarding-input-wrap">
            <UserRound :size="18" class="text-aac-muted" />
            <input
              id="onboarding-name"
              v-model="loginName"
              type="text"
              placeholder="Type your name"
              @keydown.enter.prevent="goNext"
            >
          </div>
          <p class="onboarding-microcopy">Leave this empty if you want to start immediately.</p>
        </div>

        <div v-else-if="step === 1" class="onboarding-content onboarding-options">
          <button
            v-for="mode in modeOptions"
            :key="mode.value"
            class="onboarding-option"
            :class="{ 'onboarding-option--active': selectedMode === mode.value }"
            @click="selectedMode = mode.value"
          >
            <div class="onboarding-option__icon">
              <component :is="mode.icon" :size="18" />
            </div>
            <div class="onboarding-option__text">
              <h3>{{ mode.label }}</h3>
              <p>{{ mode.sub }}</p>
            </div>
          </button>
        </div>

        <div v-else class="onboarding-content onboarding-options">
          <button
            v-for="lang in languageOptions"
            :key="lang.value"
            class="onboarding-option"
            :class="{ 'onboarding-option--active': selectedLanguage === lang.value }"
            @click="selectedLanguage = lang.value"
          >
            <div class="onboarding-option__icon">
              <Globe :size="18" />
            </div>
            <div class="onboarding-option__text">
              <h3>{{ lang.label }}</h3>
              <p>{{ lang.sub }}</p>
            </div>
          </button>
        </div>

        <div class="onboarding-actions">
          <button v-if="step < totalSteps - 1" class="onboarding-primary" @click="goNext">
            Continue
            <ArrowRight :size="18" />
          </button>

          <button v-else class="onboarding-primary" @click="completeFlow">
            Start speaking
            <ArrowRight :size="18" />
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.onboarding-page {
  @apply min-h-screen bg-aac-bg text-aac-text;
}

.onboarding-shell {
  @apply mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-6 md:px-8;
}

.onboarding-header {
  @apply mb-6 flex items-center justify-between;
}

.onboarding-nav-btn {
  @apply inline-flex items-center gap-2 rounded-lg border border-white/10 bg-aac-card px-3 py-2 text-sm text-aac-text transition-colors;
}

.onboarding-nav-btn:hover {
  @apply border-aac-highlight/70;
}

.onboarding-skip-btn {
  @apply text-sm font-medium text-aac-muted transition-colors;
}

.onboarding-skip-btn:hover {
  @apply text-aac-highlight;
}

.onboarding-progress {
  @apply mb-5 flex items-center gap-2;
}

.onboarding-progress__dot {
  @apply h-1.5 flex-1 rounded-full bg-white/10 transition-colors;
}

.onboarding-progress__dot--active {
  @apply bg-aac-highlight;
}

.onboarding-card {
  @apply rounded-3xl border border-white/10 bg-aac-card/70 p-5 md:p-8;
}

.onboarding-step {
  @apply text-xs uppercase tracking-[0.16em] text-aac-highlight;
}

.onboarding-title {
  @apply mt-2 text-2xl font-bold text-aac-text md:text-3xl;
}

.onboarding-hint {
  @apply mt-2 text-sm text-aac-muted;
}

.onboarding-content {
  @apply mt-6;
}

.onboarding-label {
  @apply mb-2 block text-sm text-aac-muted;
}

.onboarding-input-wrap {
  @apply flex items-center gap-2 rounded-xl border border-white/10 bg-aac-surface px-3;
}

.onboarding-input-wrap input {
  @apply h-11 w-full bg-transparent text-aac-text placeholder-aac-muted/60 outline-none;
}

.onboarding-microcopy {
  @apply mt-2 text-xs text-aac-muted/80;
}

.onboarding-options {
  @apply grid gap-3;
}

.onboarding-option {
  @apply flex items-center gap-3 rounded-2xl border border-white/10 bg-aac-surface px-4 py-3 text-left transition-all;
}

.onboarding-option:hover {
  @apply border-aac-highlight/60;
}

.onboarding-option--active {
  @apply border-aac-highlight bg-aac-highlight/10;
}

.onboarding-option__icon {
  @apply inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-aac-highlight;
}

.onboarding-option__text h3 {
  @apply text-base font-semibold text-aac-text;
}

.onboarding-option__text p {
  @apply text-sm text-aac-muted;
}

.onboarding-actions {
  @apply mt-6 flex items-center justify-end;
}

.onboarding-primary {
  @apply inline-flex items-center gap-2 rounded-xl bg-aac-highlight px-5 py-2.5 font-semibold text-white transition-opacity;
}

.onboarding-primary:hover {
  @apply opacity-90;
}
</style>
