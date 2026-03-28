<script setup lang="ts">
/**
 * SettingsSidebar Component
 * Essentials-only settings sidebar
 */

import { X, Languages, Mic, Hand, Eye, Move, Radio, Upload, CheckCircle, Trash2, Loader2, HelpCircle } from 'lucide-vue-next'
import type { InteractionMode, VoiceOption } from '~/types/api'

const appStore = useAppStore()
const speech = useSpeechRecognition()
const api = useApi()
const { t, locale } = useI18n()
const { $i18n } = useNuxtApp()
const route = useRoute()
const LISTENING_PAUSED_KEY = 'sowtee_listening_paused'

const isStartingListening = ref(false)
const listeningManuallyDisabled = ref(false)

const voiceCloneFile = ref<File | null>(null)
const isCloning = ref(false)
const cloneError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isMobile = ref(false)

const modes: Array<{ value: InteractionMode; label: string; description: string; icon: typeof Hand }> = [
  { value: 'touch', label: 'Touch', description: 'Tap cards and buttons directly on screen.', icon: Hand },
  { value: 'eye_gaze', label: 'Eye Gaze', description: 'Look at a card and hold your gaze to select it. Requires webcam.', icon: Eye },
  { value: 'switch', label: 'Arrows', description: 'Use arrow keys to navigate, Shift to select.', icon: Move },
]

const voiceOptions: Array<{ value: VoiceOption; label: string }> = [
  { value: 'male', label: 'Adam (Male)' },
  { value: 'female', label: 'Rachel (Female)' },
  { value: 'cloned', label: 'My Cloned Voice' },
]

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ur', name: 'Urdu' },
]

function detectMobile() {
  if (!import.meta.client) return
  isMobile.value = window.innerWidth <= 768
}

function closeSettings() {
  appStore.setSettingsExpanded(false)
}

async function syncVoiceCloneStatus() {
  try {
    const status = await api.getVoiceCloneStatus(appStore.userId)
    if (status.voice_id) {
      appStore.setClonedVoice(status.voice_id, status.voice_name || 'My Voice')
    } else {
      appStore.clearClonedVoice()
    }
  } catch (error) {
    console.error('Failed to fetch voice clone status:', error)
  }
}

function onVoiceFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  cloneError.value = ''

  if (!file.type.startsWith('audio/')) {
    cloneError.value = 'Please select an audio file.'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    cloneError.value = 'File too large (max 5MB).'
    return
  }

  voiceCloneFile.value = file
}

async function uploadVoiceClone() {
  if (!voiceCloneFile.value || isCloning.value) return

  isCloning.value = true
  cloneError.value = ''

  try {
    const result = await api.cloneVoice(voiceCloneFile.value, appStore.userId, 'My Voice')
    if (result.voice_id) {
      appStore.setClonedVoice(result.voice_id, result.voice_name || 'My Voice')
      appStore.setPreferredVoice('cloned')
    }
    voiceCloneFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  } catch (error: any) {
    cloneError.value = error?.message || 'Voice cloning failed.'
  } finally {
    isCloning.value = false
  }
}

async function removeVoiceClone() {
  try {
    await api.removeClonedVoice(appStore.userId)
    appStore.clearClonedVoice()
    if (appStore.preferredVoice === 'cloned') {
      appStore.setPreferredVoice('male')
    }
  } catch (error) {
    console.error('Failed to remove cloned voice:', error)
  }
}

async function ensureListeningActive(force = false) {
  if (!force && listeningManuallyDisabled.value) return
  if (isStartingListening.value || !speech.isSupported.value || speech.isListening.value) return

  isStartingListening.value = true
  try {
    const started = await speech.startListening()
    if (started) {
      appStore.setListeningToSpeech(true)
      listeningManuallyDisabled.value = false
      if (import.meta.client) {
        localStorage.setItem(LISTENING_PAUSED_KEY, 'false')
      }
    }
  } finally {
    isStartingListening.value = false
  }
}

function stopListening() {
  speech.stopListening()
  appStore.setListeningToSpeech(false)
  listeningManuallyDisabled.value = true
  if (import.meta.client) {
    localStorage.setItem(LISTENING_PAUSED_KEY, 'true')
  }
}

async function toggleListening() {
  if (speech.isListening.value) {
    stopListening()
    return
  }

  await ensureListeningActive(true)
}

function buildCalibrationUrl(source: string) {
  const returnTo = route.fullPath || '/speaking'
  const params = new URLSearchParams({ returnTo, source })
  return `/calibration?${params.toString()}`
}

async function setMode(mode: InteractionMode) {
  appStore.setInteractionMode(mode)

  if (mode === 'eye_gaze') {
    appStore.resetCalibration()
    appStore.setCalibrationContext(route.fullPath || '/speaking', 'settings')
    closeSettings()
    await navigateTo(buildCalibrationUrl('settings'))
  }
}

async function changeLanguage(code: string) {
  await $i18n.setLocale(code)
  appStore.setLanguage(code as 'en' | 'ar' | 'ur')
}

function setVoice(voice: VoiceOption) {
  if (voice === 'cloned' && !appStore.clonedVoiceId) return
  appStore.setPreferredVoice(voice)
}

onMounted(async () => {
  detectMobile()
  if (import.meta.client) {
    window.addEventListener('resize', detectMobile)
  }

  if (import.meta.client) {
    listeningManuallyDisabled.value = localStorage.getItem(LISTENING_PAUSED_KEY) === 'true'
  }

  await Promise.all([
    syncVoiceCloneStatus(),
    ensureListeningActive(),
  ])
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', detectMobile)
  }
})

watch(
  () => appStore.settingsExpanded,
  async (isExpanded) => {
    if (!isExpanded) return

    await Promise.all([
      syncVoiceCloneStatus(),
      ensureListeningActive(),
    ])
  }
)

watch(
  () => appStore.eyeGazeCalibrationActive,
  (isCalibrating) => {
    if (isCalibrating && appStore.settingsExpanded) {
      closeSettings()
    }
  }
)
</script>

<template>
  <div class="settings-sidebar">
    <div class="settings-sidebar__header">
      <h2 class="settings-sidebar__title">{{ t('settings.title') }}</h2>
      <button class="settings-sidebar__close" @click="closeSettings">
        <X :size="20" />
      </button>
    </div>

    <div v-if="!isMobile" class="settings-section settings-section--compact">
      <div class="settings-section__header">
        <Hand :size="16" class="text-aac-highlight" />
        <span>Input method</span>
      </div>
      <div class="settings-grid settings-grid--three">
        <button
          v-for="mode in modes"
          :key="mode.value"
          class="option-chip"
          :class="{ 'option-chip--active': appStore.interactionMode === mode.value }"
          @click="setMode(mode.value)"
        >
          <component :is="mode.icon" :size="14" />
          <span>{{ mode.label }}</span>
        </button>
      </div>

      <div class="settings-mode-helper">
        <HelpCircle :size="12" class="settings-mode-helper__icon" />
        <span>{{ modes.find(m => m.value === appStore.interactionMode)?.description }}</span>
      </div>
    </div>

    <div class="settings-section settings-section--compact">
      <div class="settings-section__header">
        <Languages :size="16" class="text-aac-highlight" />
        <span>{{ t('settings.language') }}</span>
      </div>
      <div class="settings-grid settings-grid--three">
        <button
          v-for="lang in languages"
          :key="lang.code"
          class="option-chip"
          :class="{ 'option-chip--active': locale === lang.code }"
          @click="changeLanguage(lang.code)"
        >
          {{ t(`languages.${lang.code}`) || lang.name }}
        </button>
      </div>
    </div>

    <div class="settings-section settings-section--compact">
      <div class="settings-section__header">
        <Mic :size="16" class="text-aac-highlight" />
        <span>Voice</span>
      </div>

      <div class="settings-grid settings-grid--three">
        <button
          v-for="voice in voiceOptions"
          :key="voice.value"
          class="option-chip"
          :class="{ 'option-chip--active': appStore.preferredVoice === voice.value }"
          :disabled="voice.value === 'cloned' && !appStore.clonedVoiceId"
          @click="setVoice(voice.value)"
        >
          {{ voice.label }}
        </button>
      </div>

      <div v-if="appStore.clonedVoiceId" class="voice-clone-status">
        <span class="voice-clone-status__tag">
          <CheckCircle :size="14" />
          {{ appStore.clonedVoiceName || 'My Voice' }}
        </span>
        <button class="voice-clone-remove" @click="removeVoiceClone">
          <Trash2 :size="14" />
          <span>Remove</span>
        </button>
      </div>

      <div v-else class="voice-clone-upload">
        <input
          ref="fileInputRef"
          type="file"
          accept="audio/*"
          class="hidden"
          @change="onVoiceFileSelect"
        >

        <button class="voice-upload-select" @click="fileInputRef?.click()">
          <Upload :size="14" />
          <span>{{ voiceCloneFile ? voiceCloneFile.name : 'Upload voice sample' }}</span>
        </button>

        <button
          class="voice-upload-clone"
          :disabled="!voiceCloneFile || isCloning"
          @click="uploadVoiceClone"
        >
          <Loader2 v-if="isCloning" :size="14" class="animate-spin" />
          <Upload v-else :size="14" />
          <span>{{ isCloning ? 'Cloning...' : 'Clone voice' }}</span>
        </button>

        <p v-if="cloneError" class="voice-clone-error">{{ cloneError }}</p>
      </div>
    </div>

    <div class="settings-section settings-section--compact">
      <div class="settings-section__header settings-section__header--listening">
        <div class="flex items-center gap-2">
          <Radio :size="16" class="text-aac-highlight" />
          <span>{{ t('settings.listening.title') }}</span>
        </div>

        <span v-if="speech.isListening.value" class="listening-indicator">
          <span class="listening-dot" />
          {{ t('settings.listening.active') }}
        </span>
      </div>

      <div class="listening-actions">
        <button class="settings-btn-sm" @click="toggleListening">
          {{ speech.isListening.value ? 'Stop listening' : (isStartingListening ? 'Starting…' : 'Start listening') }}
        </button>
      </div>

      <p class="settings-note">
        {{ speech.isListening.value ? t('settings.listening.listeningPlaceholder') : t('settings.listening.enablePlaceholder') }}
      </p>
    </div>

  </div>
</template>

<style scoped>
.settings-sidebar {
  @apply fixed right-0 z-40;
  @apply top-16;
  height: calc(100dvh - 4rem);
  max-height: calc(100dvh - 4rem);
  @apply w-72;
  @apply bg-aac-surface border-l border-aac-card;
  @apply overflow-y-auto;
  @apply p-4 space-y-3;
}

.settings-sidebar__header {
  @apply flex items-center justify-between;
  @apply pb-3 mb-1 border-b border-[#2a2a30];
}

.settings-sidebar__title {
  @apply text-base font-semibold text-aac-text;
}

.settings-sidebar__close {
  @apply w-8 h-8 rounded-lg;
  @apply flex items-center justify-center;
  @apply text-gray-400 hover:text-white hover:bg-[#252529];
  @apply transition-colors;
}

.settings-section {
  @apply bg-aac-card rounded-xl border border-aac-card;
}

.settings-section--compact {
  @apply p-3;
}

.settings-section__header {
  @apply flex items-center gap-2 text-sm font-medium text-aac-text;
  @apply mb-2;
}

.settings-section__header--listening {
  @apply justify-between;
}

.settings-grid {
  @apply grid gap-2;
}

.settings-grid--three {
  @apply grid-cols-3;
}

.option-chip {
  @apply px-2 py-2 rounded-lg text-xs;
  @apply border border-transparent;
  @apply bg-aac-surface text-aac-text;
  @apply transition-all duration-150;
  @apply inline-flex items-center justify-center gap-1.5;
}

.option-chip:hover:not(:disabled) {
  @apply border-aac-highlight;
}

.option-chip--active {
  @apply bg-aac-highlight text-white border-aac-highlight;
}

.option-chip:disabled {
  @apply opacity-45 cursor-not-allowed;
}

.voice-clone-status {
  @apply mt-2 flex items-center justify-between gap-2;
}

.voice-clone-status__tag {
  @apply inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs;
  @apply bg-aac-surface text-aac-text;
}

.voice-clone-remove {
  @apply inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs;
  @apply text-red-400 hover:bg-red-500/10;
  @apply transition-colors;
}

.voice-clone-upload {
  @apply mt-2 flex flex-col gap-2;
}

.voice-upload-select,
.voice-upload-clone {
  @apply inline-flex items-center justify-center gap-1.5;
  @apply rounded-lg px-3 py-2 text-xs;
}

.voice-upload-select {
  @apply border border-aac-surface bg-aac-surface text-aac-text;
}

.voice-upload-select:hover {
  @apply border-aac-highlight;
}

.voice-upload-clone {
  @apply bg-aac-highlight text-white;
}

.voice-upload-clone:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.voice-clone-error {
  @apply text-[11px] text-red-400;
}

.listening-actions {
  @apply mb-2;
}

.settings-btn-sm {
  @apply px-3 py-1 rounded-full;
  @apply bg-aac-highlight text-white text-xs;
  @apply transition-colors;
}

.settings-btn-sm:disabled {
  @apply opacity-60 cursor-not-allowed;
}

.settings-note {
  @apply text-[11px] text-aac-muted leading-relaxed;
}

.listening-indicator {
  @apply inline-flex items-center gap-1.5 text-xs text-green-400;
}

.listening-dot {
  @apply w-2 h-2 rounded-full bg-green-500;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.settings-mode-helper {
  @apply mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-aac-muted/80;
}

.settings-mode-helper__icon {
  @apply mt-0.5 flex-shrink-0 text-aac-highlight/60;
}
</style>
