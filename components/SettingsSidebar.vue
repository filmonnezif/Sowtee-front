<script setup lang="ts">
/**
 * SettingsSidebar Component
 * Unified settings sidebar for both home and speaking pages
 */

import { Image, Mic, FileText, X, RefreshCw, Palette, Languages, Camera, Upload, Trash2, CheckCircle, Loader2 } from 'lucide-vue-next'

const appStore = useAppStore()
const camera = useCamera()
const api = useApi()
const speech = useSpeechRecognition()
const { t, locale } = useI18n()
const { $i18n } = useNuxtApp()

// Voice clone state
const voiceCloneFile = ref<File | null>(null)
const isCloning = ref(false)
const cloneError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

/**
 * Handle voice clone file selection
 */
function onVoiceFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  cloneError.value = ''

  // Validate file type
  if (!file.type.startsWith('audio/')) {
    cloneError.value = 'Please select an audio file'
    return
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    cloneError.value = 'File too large (max 5MB)'
    return
  }

  voiceCloneFile.value = file
}

/**
 * Upload and clone the voice
 */
async function uploadVoiceClone() {
  if (!voiceCloneFile.value) return

  isCloning.value = true
  cloneError.value = ''

  try {
    const result = await api.cloneVoice(voiceCloneFile.value)
    appStore.setClonedVoice(result.voice_id!, result.voice_name || 'My Voice')
    voiceCloneFile.value = null
    // Reset file input
    if (fileInputRef.value) fileInputRef.value.value = ''
  } catch (error: any) {
    cloneError.value = error.message || 'Cloning failed'
    console.error('Voice cloning failed:', error)
  } finally {
    isCloning.value = false
  }
}

/**
 * Remove the cloned voice
 */
async function removeVoiceClone() {
  try {
    await api.removeClonedVoice()
    appStore.clearClonedVoice()
    voiceCloneFile.value = null
    cloneError.value = ''
  } catch (error) {
    console.error('Failed to remove cloned voice:', error)
  }
}

// Camera settings state
const isRefreshingCameras = ref(false)

/**
 * Refresh available cameras
 */
async function refreshCameras() {
  isRefreshingCameras.value = true
  try {
    await camera.refreshDevices()
    appStore.setAvailableCameras(camera.state.availableDevices)
  } catch (error) {
    console.error('Failed to refresh cameras:', error)
  } finally {
    isRefreshingCameras.value = false
  }
}

/**
 * Initialize cameras on mount
 */
onMounted(async () => {
  await refreshCameras()
  // Initialize the store with available cameras
  appStore.setAvailableCameras(camera.state.availableDevices)
})

// Watch for settings sidebar opening to refresh cameras
watch(
  () => appStore.settingsExpanded,
  async (isExpanded) => {
    if (isExpanded && appStore.availableCameras.length === 0) {
      await refreshCameras()
    }
  }
)

const languages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', dir: 'rtl' },
  { code: 'ur', name: 'Urdu', dir: 'rtl' }
]

/**
 * Close the settings sidebar
 */
function closeSettings() {
  appStore.toggleSettings()
}

/**
 * Start listening to speech
 */
async function startListening() {
  if (speech.isSupported.value && !speech.isListening.value) {
    await speech.startListening()
    appStore.setListeningToSpeech(true)
  }
}

/**
 * Recapture scene - capture a new image and analyze it
 */
async function recaptureScene() {
  const frame = camera.captureFrame()
  if (!frame) {
    console.warn('Failed to capture frame')
    return
  }

  appStore.capturedSceneImage = frame
  appStore.sceneDescription = 'Analyzing scene...'
  appStore.setProcessing(true)

  try {
    const response = await api.predictPhrases(
      appStore.userId,
      frame,
      appStore.interactionMode
    )
    
    // Update scene description from analysis
    if (response.context_analysis?.visual_context?.scene_description) {
      appStore.sceneDescription = response.context_analysis.visual_context.scene_description
    } else {
      appStore.sceneDescription = 'Scene captured'
    }
  } catch (error) {
    console.error('Scene analysis failed:', error)
    appStore.sceneDescription = 'Analysis failed'
  } finally {
    appStore.setProcessing(false)
  }
}

const backgroundOptions = [
  { key: 'default', bg: '#000000', surface: '#121212', card: '#18181b' },
  { key: 'slate', bg: '#0f172a', surface: '#1e293b', card: '#334155' },
  { key: 'neutral', bg: '#171717', surface: '#262626', card: '#404040' },
  { key: 'gray', bg: '#111827', surface: '#1f2937', card: '#374151' },
  { key: 'deepBlack', bg: '#000000', surface: '#121212', card: '#18181b' },
]

const accentOptions = [
  { key: 'blue', value: '#3b82f6' },
  { key: 'yellow', value: '#eab308' },
  { key: 'red', value: '#ef4444' },
  { key: 'green', value: '#22c55e' },
  { key: 'purple', value: '#a855f7' },
]

const textOptions = [
  { key: 'default', value: '#f5f5f7' },
  { key: 'white', value: '#ffffff' },
  { key: 'gray', value: '#d1d5db' },
  { key: 'amber', value: '#fef3c7' },
  { key: 'sky', value: '#e0f2fe' },
]

function setThemeBg(opt: typeof backgroundOptions[0]) {
  appStore.setThemeSettings({
    background: opt.bg,
    surface: opt.surface,
    card: opt.card
  })
}

async function changeLanguage(code: string) {
  await $i18n.setLocale(code)
  appStore.setLanguage(code as 'en' | 'ar' | 'ur')
}

/**
 * Get camera display name
 */
function getCameraDisplayName(cameraId: string | null): string {
  if (!cameraId) return 'Default Camera'
  const camera = appStore.availableCameras.find(c => c.deviceId === cameraId)
  return camera?.label || 'Unknown Camera'
}
</script>

<template>
  <div class="settings-sidebar">
    <div class="settings-sidebar__header">
      <h2 class="settings-sidebar__title">{{ t('settings.title') }}</h2>
      <button class="settings-sidebar__close" @click="closeSettings">
        <X :size="20" />
      </button>
    </div>
    
    <!-- General Settings (from ControlPanel) -->
    <ControlPanel />

    <div class="settings-section">
      <div class="settings-section__header">
        <Languages :size="18" class="text-aac-highlight" />
        <span>{{ t('settings.language') }}</span>
      </div>
      <div class="settings-section__content flex gap-2">
        <button 
          v-for="lang in languages" 
          :key="lang.code"
          class="px-3 py-1.5 rounded-lg text-sm transition-all border"
          :class="locale === lang.code ? 'bg-aac-highlight text-white border-aac-highlight' : 'bg-aac-surface text-aac-text border-transparent hover:border-aac-highlight'"
          @click="changeLanguage(lang.code)"
        >
          {{ t(`languages.${lang.code}`) }}
        </button>
      </div>
    </div>

    <!-- Voice Clone -->
    <div class="settings-section">
      <div class="settings-section__header">
        <Mic :size="18" class="text-aac-highlight" />
        <span>Voice Clone</span>
      </div>
      <div class="settings-section__content">
        <!-- Cloned state -->
        <div v-if="appStore.clonedVoiceId" class="voice-clone-active">
          <div class="voice-clone-active__info">
            <CheckCircle :size="16" class="text-green-400" />
            <span class="text-sm text-gray-200">{{ appStore.clonedVoiceName || 'My Voice' }}</span>
          </div>
          <button class="voice-clone-remove" @click="removeVoiceClone">
            <Trash2 :size="14" />
            <span>Remove</span>
          </button>
        </div>

        <!-- Upload state -->
        <div v-else class="voice-clone-upload">
          <p class="text-xs text-gray-400 mb-2">Upload a 10–30 second audio clip of your voice</p>
          
          <input
            ref="fileInputRef"
            type="file"
            accept="audio/*"
            class="hidden"
            @change="onVoiceFileSelect"
          />

          <div v-if="!voiceCloneFile" class="voice-clone-dropzone" @click="fileInputRef?.click()">
            <Upload :size="20" class="text-gray-400" />
            <span class="text-xs text-gray-400">Choose audio file</span>
          </div>

          <div v-else class="voice-clone-ready">
            <div class="voice-clone-ready__file">
              <Mic :size="14" class="text-aac-highlight" />
              <span class="text-xs text-gray-200 truncate">{{ voiceCloneFile.name }}</span>
            </div>
            <button
              class="voice-clone-btn"
              :disabled="isCloning"
              @click="uploadVoiceClone"
            >
              <Loader2 v-if="isCloning" :size="14" class="animate-spin" />
              <Upload v-else :size="14" />
              <span>{{ isCloning ? 'Cloning...' : 'Clone Voice' }}</span>
            </button>
          </div>

          <p v-if="cloneError" class="text-xs text-red-400 mt-1">{{ cloneError }}</p>
        </div>
      </div>
    </div>

    <!-- Appearance Settings -->
    <div class="settings-section">
      <div class="settings-section__header">
        <Palette :size="18" class="text-aac-highlight" />
        <span>{{ t('settings.appearance.title') }}</span>
      </div>
      <div class="settings-section__content space-y-3">
        <!-- Background -->
        <div>
          <div class="text-xs text-gray-400 mb-2">{{ t('settings.appearance.background') }}</div>
          <div class="flex gap-2">
            <button 
              v-for="opt in backgroundOptions" 
              :key="opt.key"
              class="w-6 h-6 rounded-full border-2 transition-all"
              :class="appStore.themeSettings.background === opt.bg ? 'border-aac-highlight scale-110' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: opt.bg }"
              @click="setThemeBg(opt)"
              :title="t('settings.colors.' + opt.key)"
            />
          </div>
        </div>
        <!-- Accent -->
        <div>
          <div class="text-xs text-gray-400 mb-2">{{ t('settings.appearance.accent') }}</div>
          <div class="flex gap-2">
            <button 
              v-for="opt in accentOptions" 
              :key="opt.key"
              class="w-6 h-6 rounded-full border-2 transition-all"
              :class="appStore.themeSettings.accent === opt.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: opt.value }"
              @click="appStore.setThemeSettings({ accent: opt.value })"
              :title="t('settings.colors.' + opt.key)"
            />
          </div>
        </div>
        <!-- Text -->
        <div>
          <div class="text-xs text-gray-400 mb-2">{{ t('settings.appearance.text') }}</div>
          <div class="flex gap-2">
             <button 
              v-for="opt in textOptions" 
              :key="opt.key"
              class="w-6 h-6 rounded-full border-2 transition-all"
              :class="appStore.themeSettings.text === opt.value ? 'border-aac-highlight scale-110' : 'border-transparent hover:scale-105'"
              :style="{ backgroundColor: opt.value }"
              @click="appStore.setThemeSettings({ text: opt.value })"
              :title="t('settings.colors.' + opt.key)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Scene Context Settings -->
    <div class="settings-section">
      <div class="settings-section__header">
        <Image :size="18" class="text-aac-highlight" />
        <span>{{ t('settings.sceneContext.title') }}</span>
      </div>
      <div class="settings-section__content">
        <div v-if="appStore.capturedSceneImage" class="scene-preview">
          <div class="scene-preview__container">
            <img :src="appStore.capturedSceneImage" alt="Scene" class="scene-preview__image" />
            <button 
              class="scene-preview__recapture-btn"
              :disabled="appStore.isProcessing"
              :title="t('settings.sceneContext.recapture')"
              @click="recaptureScene"
            >
              <RefreshCw :size="16" :class="{ 'animate-spin': appStore.isProcessing }" />
            </button>
          </div>
          <p v-if="appStore.sceneDescription" class="scene-preview__text">{{ appStore.sceneDescription }}</p>
        </div>
        <div v-else class="scene-preview__empty">
          <p class="text-gray-400 text-sm">{{ t('settings.sceneContext.placeholder') }}</p>
          <button 
            class="scene-preview__capture-btn"
            :disabled="appStore.isProcessing"
            @click="recaptureScene"
          >
            <RefreshCw :size="14" :class="{ 'animate-spin': appStore.isProcessing }" />
            <span>{{ appStore.isProcessing ? t('settings.sceneContext.capturing') : t('settings.sceneContext.capture') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Recording Context Settings -->
    <div class="settings-section">
      <div class="settings-section__header">
        <Mic :size="18" class="text-aac-highlight" />
        <span>{{ t('settings.listening.title') }}</span>
        <button 
          v-if="!speech.isListening.value"
          class="settings-btn-sm"
          @click="startListening"
        >
          {{ t('settings.listening.start') }}
        </button>
        <span v-else class="listening-indicator">
          <span class="listening-dot" />
          {{ t('settings.listening.active') }}
        </span>
      </div>
      <div class="settings-section__content">
        <div v-if="appStore.lastHeardText" class="text-sm">
          <span class="text-gray-400">{{ t('settings.listening.lastHeard') }}</span>
          <p class="text-gray-200 mt-1">"{{ appStore.lastHeardText }}"</p>
        </div>
        <p v-else class="text-gray-400 text-sm">
          {{ speech.isListening.value ? t('settings.listening.listeningPlaceholder') : t('settings.listening.enablePlaceholder') }}
        </p>
      </div>
    </div>

    <!-- Camera Settings -->
    <div class="settings-section">
      <div class="settings-section__header">
        <Camera :size="18" class="text-aac-highlight" />
        <span>{{ t('settings.cameras.title') }}</span>
        <button 
          class="settings-btn-sm"
          @click="refreshCameras"
          :disabled="isRefreshingCameras"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': isRefreshingCameras }" />
        </button>
      </div>
      <div class="settings-section__content space-y-4">
        <!-- Webgazer Camera -->
        <div>
          <div class="text-xs text-gray-400 mb-2">{{ t('settings.cameras.webgazer') }}</div>
          <select 
            :value="appStore.webgazerCameraId || ''"
            @change="appStore.setWebgazerCamera(($event.target as HTMLSelectElement).value || null)"
            class="camera-select"
          >
            <option value="">{{ t('settings.cameras.default') }}</option>
            <option 
              v-for="cam in appStore.availableCameras" 
              :key="cam.deviceId"
              :value="cam.deviceId"
            >
              {{ cam.label }}
            </option>
          </select>
          <div class="text-xs text-gray-500 mt-1">
            {{ getCameraDisplayName(appStore.webgazerCameraId) }}
          </div>
        </div>

        <!-- Scene Capture Camera -->
        <div>
          <div class="text-xs text-gray-400 mb-2">{{ t('settings.cameras.sceneCapture') }}</div>
          <select 
            :value="appStore.sceneCaptureCameraId || ''"
            @change="appStore.setSceneCaptureCamera(($event.target as HTMLSelectElement).value || null)"
            class="camera-select"
          >
            <option value="">{{ t('settings.cameras.default') }}</option>
            <option 
              v-for="cam in appStore.availableCameras" 
              :key="cam.deviceId"
              :value="cam.deviceId"
            >
              {{ cam.label }}
            </option>
          </select>
          <div class="text-xs text-gray-500 mt-1">
            {{ getCameraDisplayName(appStore.sceneCaptureCameraId) }}
          </div>
        </div>

        <!-- Camera Status -->
        <div v-if="appStore.availableCameras.length === 0" class="text-sm text-gray-400">
          {{ t('settings.cameras.noCameras') }}
        </div>
        <div v-else class="text-xs text-gray-500">
          {{ t('settings.cameras.available', { count: appStore.availableCameras.length }) }}
        </div>
      </div>
    </div>

    <!-- Custom Situation Context -->
    <div class="settings-section">
      <div class="settings-section__header">
        <FileText :size="18" class="text-aac-highlight" />
        <span>{{ t('settings.situation.title') }}</span>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="appStore.customContextEnabled"
            @change="appStore.setCustomContextEnabled(($event.target as HTMLInputElement).checked)"
          />
          <span class="toggle__slider" />
        </label>
      </div>
      <Transition name="expand">
        <div v-if="appStore.customContextEnabled" class="settings-section__content">
          <textarea
            v-model="appStore.customContext"
            class="context-textarea"
            :placeholder="t('settings.situation.placeholder')"
            rows="2"
            @input="appStore.setCustomContext(($event.target as HTMLTextAreaElement).value)"
          />
          <div class="quick-contexts">
            <button 
              class="quick-context-btn"
              @click="appStore.setCustomContext('Giving a presentation at a hackathon about our AAC communication app')"
            >{{ t('settings.situation.quickContexts.hackathon') }}</button>
            <button 
              class="quick-context-btn"
              @click="appStore.setCustomContext('Meeting with my doctor to discuss my health and medication')"
            >{{ t('settings.situation.quickContexts.doctor') }}</button>
            <button 
              class="quick-context-btn"
              @click="appStore.setCustomContext('At a restaurant, ready to order food and drinks')"
            >{{ t('settings.situation.quickContexts.restaurant') }}</button>
          </div>
        </div>
      </Transition>
    </div>


    
    <!-- Debug Panel -->
    <DebugPanel />
  </div>
</template>

<style scoped>
/* Settings Sidebar */
.settings-sidebar {
  @apply fixed top-0 right-0 z-40;
  @apply w-80 h-full;
  @apply bg-aac-surface border-l border-aac-card;
  @apply overflow-y-auto;
  @apply p-5 space-y-4;
}

.settings-sidebar__header {
  @apply flex items-center justify-between;
  @apply pb-4 mb-4 border-b border-[#2a2a30];
}

.settings-sidebar__title {
  @apply text-lg font-semibold text-gray-100;
}

.settings-sidebar__close {
  @apply w-8 h-8 rounded-lg;
  @apply flex items-center justify-center;
  @apply text-gray-400 hover:text-white hover:bg-[#252529];
  @apply transition-colors;
}

/* Settings Sections */
.settings-section {
  @apply bg-aac-card rounded-xl p-4;
  @apply border border-aac-card;
}

.settings-section__content {
  @apply mt-2;
}

.settings-sidebar__title {
  @apply text-lg font-semibold text-aac-text;
}

.settings-section__header {
  @apply flex items-center gap-2 text-sm text-aac-text;
  @apply mb-3;
}

.settings-btn-sm {
  @apply ml-auto px-3 py-1 rounded-full;
  @apply bg-aac-highlight text-white text-xs;
  @apply transition-colors;
}

.settings-btn-sm:hover {
  background-color: rgb(var(--aac-highlight) / 0.8);
}

.listening-indicator {
  @apply ml-auto flex items-center gap-1.5 text-xs text-green-400;
}

.listening-dot {
  @apply w-2 h-2 rounded-full bg-green-500;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Scene Preview */
.scene-preview__container {
  @apply relative flex items-start gap-2 mb-2;
}

.scene-preview__image {
  @apply flex-1 h-20 object-cover rounded-lg;
}

.scene-preview__recapture-btn {
  @apply w-9 h-9 rounded-lg;
  @apply bg-aac-surface text-aac-muted;
  @apply flex items-center justify-center;
  @apply transition-all duration-200;
  @apply hover:bg-aac-highlight hover:text-white;
  @apply border border-aac-surface;
  @apply flex-shrink-0;
}

.scene-preview__recapture-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
  @apply hover:bg-aac-surface hover:text-aac-muted;
}

.scene-preview__text {
  @apply text-xs text-gray-400;
}

.scene-preview__empty {
  @apply flex flex-col gap-2;
}

.scene-preview__capture-btn {
  @apply flex items-center gap-2;
  @apply px-3 py-1.5 rounded-lg;
  @apply bg-aac-surface text-aac-muted text-xs;
  @apply transition-all duration-200;
  @apply hover:bg-aac-highlight hover:text-white;
  @apply border border-aac-surface;
  @apply w-fit;
}

.scene-preview__capture-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
  @apply hover:bg-aac-surface hover:text-aac-muted;
}

/* Toggle Switch */
.toggle {
  @apply ml-auto relative inline-block w-10 h-5 cursor-pointer;
}

.toggle input {
  @apply opacity-0 w-0 h-0;
}

.toggle__slider {
  @apply absolute inset-0 rounded-full;
  @apply bg-[#2a2a30] transition-colors duration-200;
}

.toggle__slider::before {
  content: '';
  @apply absolute left-0.5 top-0.5 w-4 h-4;
  @apply bg-gray-400 rounded-full;
  @apply transition-all duration-200;
}

.toggle input:checked + .toggle__slider {
  @apply bg-aac-highlight;
}

.toggle input:checked + .toggle__slider::before {
  @apply translate-x-5 bg-white;
}

/* Context Textarea */
.context-textarea {
  @apply w-full p-3 rounded-lg;
  @apply bg-aac-bg text-aac-text;
  @apply border border-aac-surface focus:border-aac-highlight;
  @apply resize-none text-sm;
  @apply placeholder:text-aac-muted;
  @apply focus:outline-none focus:ring-1 focus:ring-aac-highlight;
}

.quick-contexts {
  @apply flex flex-wrap gap-2 mt-2;
}

.quick-context-btn {
  @apply px-3 py-1 rounded-full text-xs;
  @apply bg-aac-surface text-aac-muted;
  @apply hover:bg-aac-highlight hover:text-white;
  @apply transition-colors;
}

/* Transitions */
.expand-enter-active,
.expand-leave-active {
  @apply transition-all duration-200;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  @apply opacity-0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  @apply opacity-100;
  max-height: 200px;
}

/* Camera Select */
.camera-select {
  @apply w-full p-2 rounded-lg;
  @apply bg-aac-bg text-aac-text;
  @apply border border-aac-surface focus:border-aac-highlight;
  @apply text-sm;
  @apply focus:outline-none focus:ring-1 focus:ring-aac-highlight;
  @apply cursor-pointer;
}

.camera-select:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Voice Clone */
.voice-clone-active {
  @apply flex items-center justify-between;
}

.voice-clone-active__info {
  @apply flex items-center gap-2;
}

.voice-clone-remove {
  @apply flex items-center gap-1 px-2 py-1 rounded-lg text-xs;
  @apply text-red-400 hover:bg-red-500/10;
  @apply transition-colors;
}

.voice-clone-dropzone {
  @apply flex flex-col items-center justify-center gap-2;
  @apply py-4 rounded-lg cursor-pointer;
  @apply border border-dashed border-gray-600;
  @apply hover:border-aac-highlight hover:bg-aac-bg;
  @apply transition-all;
}

.voice-clone-ready {
  @apply space-y-2;
}

.voice-clone-ready__file {
  @apply flex items-center gap-2 p-2 rounded-lg;
  @apply bg-aac-bg;
}

.voice-clone-btn {
  @apply flex items-center justify-center gap-2 w-full;
  @apply px-3 py-2 rounded-lg text-xs font-medium;
  @apply bg-aac-highlight text-white;
  @apply hover:opacity-90 transition-opacity;
}

.voice-clone-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>
