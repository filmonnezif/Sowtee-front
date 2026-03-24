<script setup lang="ts">
import type { InteractionMode } from '~/types/api'

interface CalibrationTarget {
  id: string
  x: number
  y: number
  label: string
  group: 'card' | 'suggestion' | 'action'
}

const appStore = useAppStore()
const eyeGaze = useEyeGaze()
const route = useRoute()

const isMobile = ref(false)

const returnTo = computed(() => {
  const fromQuery = typeof route.query.returnTo === 'string' ? route.query.returnTo : null
  return fromQuery || appStore.eyeGazeCalibrationReturnTo || '/speaking'
})

const source = computed(() => {
  const fromQuery = typeof route.query.source === 'string' ? route.query.source : null
  return fromQuery || appStore.eyeGazeCalibrationSource || 'unknown'
})

const calibrationTargets = computed<CalibrationTarget[]>(() => {
  const orderedTargets: CalibrationTarget[] = [
    { id: 'card-0', label: 'Card 1', x: 0, y: 0, group: 'card' },
    { id: 'card-1', label: 'Card 2', x: 0, y: 0, group: 'card' },
    { id: 'card-2', label: 'Card 3', x: 0, y: 0, group: 'card' },
    { id: 'card-3', label: 'Card 4', x: 0, y: 0, group: 'card' },
    { id: 'card-4', label: 'Card 5', x: 0, y: 0, group: 'card' },
    { id: 'suggestion-chip-0', label: 'Suggestion 1', x: 0, y: 0, group: 'suggestion' },
    { id: 'suggestion-chip-1', label: 'Suggestion 2', x: 0, y: 0, group: 'suggestion' },
    { id: 'suggestion-chip-2', label: 'Suggestion 3', x: 0, y: 0, group: 'suggestion' },
    { id: 'speak-btn', label: 'Speak button', x: 0, y: 0, group: 'action' },
    { id: 'space-key', label: 'Space button', x: 0, y: 0, group: 'action' },
    { id: 'backspace-key', label: 'Backspace button', x: 0, y: 0, group: 'action' },
    { id: 'gaze-pause-toggle', label: 'Pause gaze button', x: 0, y: 0, group: 'action' },
    { id: 'text-field-autocomplete', label: 'Autocomplete zone', x: 0, y: 0, group: 'action' },
  ]

  const pointLayout = isMobile.value
    ? [
        { x: 14, y: 84 }, { x: 38, y: 84 }, { x: 62, y: 84 }, { x: 86, y: 84 },
        { x: 22, y: 66 }, { x: 50, y: 66 }, { x: 78, y: 66 },
        { x: 22, y: 40 }, { x: 50, y: 40 }, { x: 78, y: 40 },
        { x: 70, y: 24 }, { x: 88, y: 24 },
        { x: 12, y: 12 },
      ]
    : [
        { x: 16, y: 82 }, { x: 40, y: 82 }, { x: 64, y: 82 }, { x: 88, y: 82 },
        { x: 24, y: 64 }, { x: 50, y: 64 }, { x: 76, y: 64 },
        { x: 24, y: 38 }, { x: 50, y: 38 }, { x: 76, y: 38 },
        { x: 70, y: 22 }, { x: 88, y: 22 },
        { x: 14, y: 10 },
      ]

  return orderedTargets.map((target, index) => {
    const point = pointLayout[index] ?? { x: 50, y: 50 }
    return {
      ...target,
      x: point.x,
      y: point.y,
    }
  })
})

const statusText = computed(() => {
  if (!eyeGaze.state.webgazerReady) return 'Preparing eye-gaze tracking...'
  if (!eyeGaze.state.videoFeedActive && !eyeGaze.state.useMouseFallback) return 'Camera not detected. Please check camera access.'
  if (eyeGaze.state.useMouseFallback) return 'Mouse fallback mode is active.'
  return 'Eye-gaze tracking is ready.'
})

async function initializeCalibration() {
  if (appStore.interactionMode !== ('eye_gaze' as InteractionMode)) {
    await navigateTo('/speaking')
    return
  }

  appStore.setCalibrationContext(returnTo.value, source.value)
  appStore.startCalibration()
  appStore.eyeGazeCalibrated = false

  await eyeGaze.startTracking()
  eyeGaze.startImplicitCalibration()
}

function updateViewportMode() {
  isMobile.value = window.innerWidth <= 768
}

function handleCalibrationTap(payload: { x: number; y: number }) {
  eyeGaze.recordCalibrationClick(payload.x, payload.y)
}

async function handleComplete() {
  eyeGaze.stopImplicitCalibration()
  appStore.endCalibration(true)
  await navigateTo(returnTo.value)
}

async function handleCancel() {
  eyeGaze.stopImplicitCalibration()
  appStore.endCalibration(false)
  appStore.setInteractionMode('touch')
  await navigateTo(returnTo.value)
}

onMounted(async () => {
  updateViewportMode()
  window.addEventListener('resize', updateViewportMode)
  await initializeCalibration()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportMode)
  eyeGaze.stopImplicitCalibration()
})
</script>

<template>
  <div class="calibration-page">
    <EyeGazeCalibration
      :is-calibrating="appStore.eyeGazeCalibrationActive"
      :webgazer-ready="eyeGaze.state.webgazerReady"
      :video-feed-active="eyeGaze.state.videoFeedActive"
      :use-mouse-fallback="eyeGaze.state.useMouseFallback"
      :status-text="statusText"
      :targets="calibrationTargets"
      @calibration-click="handleCalibrationTap"
      @complete="handleComplete"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
.calibration-page {
  @apply min-h-[100dvh] bg-aac-bg;
}
</style>
