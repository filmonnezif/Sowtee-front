<script setup lang="ts">
/**
 * ControlPanel Component
 * Settings and mode controls for the AAC interface
 */

import { Hand, Eye, ToggleRight, Lightbulb } from 'lucide-vue-next'
import type { InteractionMode } from '~/types/api'
const appStore = useAppStore()
const eyeGaze = useEyeGaze()
const gazeController = useGazeController()

const modes: Array<{ value: InteractionMode; label: string; icon: typeof Hand }> = [
  { value: 'touch', label: 'Touch', icon: Hand },
  { value: 'eye_gaze', label: 'Eye Gaze', icon: Eye },
  { value: 'switch', label: 'Switch', icon: ToggleRight },
]

const { t } = useI18n()

function setMode(mode: InteractionMode) {
  appStore.setInteractionMode(mode)
}

/**
 * Start calibration process
 */
async function startCalibration() {
  appStore.eyeGazeCalibrated = false
  gazeController.stop()
  await eyeGaze.startTracking()
  eyeGaze.startImplicitCalibration()
}
</script>

<template>
  <div class="bg-aac-card rounded-2xl p-5 space-y-5 border border-aac-card">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-aac-text">{{ t('settings.general.title') }}</h2>
    </div>
    
    <!-- Interaction Mode -->
    <div>
      <label class="block text-sm text-aac-muted mb-3">{{ t('settings.general.interactionMode') }}</label>
      <div class="flex gap-2">
        <button
          v-for="mode in modes"
          :key="mode.value"
          :class="[
            'flex-1 py-2 px-3 rounded-xl font-medium transition-all text-center flex flex-col items-center',
            appStore.interactionMode === mode.value
              ? 'bg-aac-highlight text-white'
              : 'bg-aac-surface text-aac-muted hover:bg-aac-highlight hover:bg-opacity-10'
          ]"
          @click="setMode(mode.value)"
        >
          <component :is="mode.icon" :size="20" class="mb-0.5" />
          <span class="text-xs">{{ t(`settings.general.modes.${mode.value === 'eye_gaze' ? 'eyeGaze' : mode.value}`) }}</span>
        </button>
      </div>
    </div>
    

    


    <!-- Eye Gaze Settings (shown when eye gaze mode is selected) -->
    <div v-if="appStore.isEyeGazeMode" class="space-y-4 pt-4 border-t border-aac-surface">
      <h3 class="text-base font-medium text-aac-text flex items-center gap-2">
        <Eye :size="18" class="text-aac-highlight" />
        {{ t('settings.general.eyeGaze.title') }}
      </h3>

      <!-- Calibration Status -->
      <div class="flex items-center justify-between p-3 bg-aac-surface rounded-xl">
        <div class="flex items-center gap-2">
          <span
            :class="[
              'w-2.5 h-2.5 rounded-full',
              appStore.eyeGazeCalibrated ? 'bg-green-500' : 'bg-yellow-500'
            ]"
          />
          <span class="text-sm text-aac-text">
            {{ appStore.eyeGazeCalibrated ? t('settings.general.eyeGaze.calibrated') : t('settings.general.eyeGaze.notCalibrated') }}
          </span>
        </div>
          <button
          class="text-sm text-aac-highlight hover:opacity-80"
          @click="startCalibration()"
        >
          {{ appStore.eyeGazeCalibrated ? t('settings.general.eyeGaze.recalibrate') : t('settings.general.eyeGaze.calibrate') }}
        </button>
      </div>
      
      <!-- Dwell Threshold -->
      <div>
        <label class="block text-sm text-aac-muted mb-2">
          {{ t('settings.general.eyeGaze.dwellTime') }}: {{ appStore.dwellThreshold / 1000 }}s
        </label>
        <input
          type="range"
          min="500"
          max="3000"
          step="100"
          :value="appStore.dwellThreshold"
          class="w-full accent-aac-highlight"
          @input="(e) => appStore.setDwellThreshold(Number((e.target as HTMLInputElement).value))"
        />
        <p class="text-xs text-aac-muted mt-1">
          {{ t('settings.general.eyeGaze.dwellHint') }}
        </p>
      </div>

      <!-- Open Eye Gaze Overlay Button -->
      <button
        v-if="!appStore.eyeGazeOverlayActive && !appStore.eyeGazeCalibrationActive"
        class="w-full py-2.5 px-4 bg-aac-highlight hover:opacity-90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        @click="appStore.setEyeGazeOverlay(true)"
      >
        <Eye :size="18" />
        {{ t('settings.general.eyeGaze.openMode') }}
      </button>
      
      <p class="text-xs text-gray-500 flex items-start gap-1.5">
        <Lightbulb :size="14" class="text-yellow-500 flex-shrink-0 mt-0.5" />
        <span>{{ t('settings.general.eyeGaze.tip') }}</span>
      </p>
    </div>
    
    <!-- Debug Toggle -->
    <div class="flex items-center justify-between">
      <span class="text-aac-text text-sm">{{ t('settings.general.debug') }}</span>
      <button
        :class="[
          'relative w-12 h-6 rounded-full transition-colors',
          appStore.showDebugInfo ? 'bg-aac-highlight' : 'bg-aac-surface'
        ]"
        @click="appStore.toggleDebugInfo()"
      >
        <span
          :class="[
            'absolute top-0.5 w-5 h-5 rounded-full transition-transform',
            appStore.showDebugInfo ? 'translate-x-6 bg-white' : 'translate-x-0.5 bg-aac-muted'
          ]"
        />
      </button>
    </div>
    

  </div>
</template>
