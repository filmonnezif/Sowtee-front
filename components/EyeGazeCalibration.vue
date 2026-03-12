<script setup lang="ts">
/**
 * EyeGazeCalibration Component
 * Full-screen calibration overlay for WebGazer eye tracking
 * Layout matches speaking page: 4 corners + 1 top-center + 2 middle sides
 * Test phase: stare at targets to measure accuracy
 */

const props = defineProps<{
  isCalibrating: boolean
  calibrationPoints: number
  webgazerReady: boolean
  videoFeedActive: boolean
  useMouseFallback: boolean
  gazePosition: { x: number; y: number } | null
}>()

const emit = defineEmits<{
  calibrationClick: [x: number, y: number]
  complete: []
  cancel: []
}>()

// Calibration target positions (Matches Speaking Page Layout)
// 4 corners + 1 top center + 2 middle sides = 7 points
const calibrationTargets = [
  { id: 1, x: 18, y: 20, label: 'Top Left' },
  { id: 2, x: 50, y: 15, label: 'Top Center' },
  { id: 3, x: 82, y: 20, label: 'Top Right' },
  { id: 4, x: 35, y: 50, label: 'Middle Left' },
  { id: 5, x: 65, y: 50, label: 'Middle Right' },
  { id: 6, x: 18, y: 80, label: 'Bottom Left' },
  { id: 7, x: 82, y: 80, label: 'Bottom Right' },
]

// State
const step = ref<'train' | 'test'>('train')
const clickedTargets = ref<Set<number>>(new Set())
const currentTarget = ref(0)
const clicksPerTarget = ref<Record<number, number>>({})

// Test mode state - single center point
const testTarget = { id: 0, x: 50, y: 50, label: 'Center' }
const testStartTime = ref<number | null>(null)
const testSamples = ref<number[]>([])
const testResult = ref<{ avgDistance: number; accuracy: number } | null>(null)
const isTestingTarget = ref(false)
const testComplete = ref(false)

// Minimum clicks per target for good calibration
const MIN_CLICKS_PER_TARGET = 3
const TOTAL_REQUIRED_CLICKS = 7 * MIN_CLICKS_PER_TARGET // 21 clicks total

// Test phase constants
const TEST_DURATION_MS = 3000 // 3 seconds
const GOOD_ACCURACY_THRESHOLD = 50 // pixels - green
const ACCEPTABLE_ACCURACY_THRESHOLD = 100 // pixels - yellow

// Computed progress
const progress = computed(() => {
  if (step.value === 'test') {
    return testComplete.value ? 1 : testElapsed.value / TEST_DURATION_MS
  }
  return Math.min(props.calibrationPoints / TOTAL_REQUIRED_CLICKS, 1)
})

const currentTrainTarget = computed(() => {
  if (currentTarget.value >= calibrationTargets.length) return null
  return calibrationTargets[currentTarget.value]
})

// Current gaze distance from center test target
const currentGazeDistance = computed(() => {
  if (step.value !== 'test' || !props.gazePosition || !isTestingTarget.value) return null
  
  const targetX = (testTarget.x / 100) * window.innerWidth
  const targetY = (testTarget.y / 100) * window.innerHeight
  
  return Math.round(Math.sqrt(
    Math.pow(props.gazePosition.x - targetX, 2) + 
    Math.pow(props.gazePosition.y - targetY, 2)
  ))
})

// Test phase elapsed time
const testElapsed = ref(0)
let testTimer: ReturnType<typeof setInterval> | null = null

/**
 * Handle click on calibration target
 */
function handleTargetClick(target: typeof calibrationTargets[0], event: MouseEvent) {
  if (step.value === 'test') return

  // Record the click
  emit('calibrationClick', event.clientX, event.clientY)
  
  // Track clicks per target
  if (!clicksPerTarget.value[target.id]) {
    clicksPerTarget.value[target.id] = 0
  }
  clicksPerTarget.value[target.id]++
  
  // Mark as clicked after minimum clicks
  if (clicksPerTarget.value[target.id] >= MIN_CLICKS_PER_TARGET) {
    clickedTargets.value.add(target.id)
    
    // Move to next target
    if (currentTarget.value < calibrationTargets.length - 1) {
      currentTarget.value++
    } else {
      // Finished all targets - move to test phase
      startTestPhase()
    }
  }
}

/**
 * Start the test phase
 */
function startTestPhase() {
  step.value = 'test'
  testResult.value = null
  testComplete.value = false
  testSamples.value = []
  startTestingTarget()
}

/**
 * Start testing the center target
 */
function startTestingTarget() {
  isTestingTarget.value = true
  testStartTime.value = Date.now()
  testSamples.value = []
  testElapsed.value = 0
  
  // Start timer to track elapsed time
  testTimer = setInterval(() => {
    if (!testStartTime.value) return
    testElapsed.value = Date.now() - testStartTime.value
    
    if (testElapsed.value >= TEST_DURATION_MS) {
      finishTestingTarget()
    }
  }, 100)
}

/**
 * Finish testing and calculate accuracy
 */
function finishTestingTarget() {
  if (testTimer) {
    clearInterval(testTimer)
    testTimer = null
  }
  
  isTestingTarget.value = false
  testComplete.value = true
  
  // Calculate average distance
  const samples = testSamples.value
  
  if (samples.length > 0) {
    const avgDistance = samples.reduce((sum, d) => sum + d, 0) / samples.length
    const accuracy = Math.max(0, Math.round(100 - (avgDistance / 2)))
    testResult.value = { avgDistance, accuracy }
  } else {
    testResult.value = { avgDistance: 200, accuracy: 0 }
  }
}

/**
 * Collect gaze samples during test
 */
watch(() => props.gazePosition, (pos) => {
  if (step.value !== 'test' || !isTestingTarget.value || !pos) return
  
  const targetX = (testTarget.x / 100) * window.innerWidth
  const targetY = (testTarget.y / 100) * window.innerHeight
  
  const distance = Math.sqrt(
    Math.pow(pos.x - targetX, 2) + 
    Math.pow(pos.y - targetY, 2)
  )
  
  testSamples.value.push(distance)
})

/**
 * Retry calibration
 */
function retryCalibration() {
  step.value = 'train'
  clickedTargets.value.clear()
  currentTarget.value = 0
  clicksPerTarget.value = {}
  testResult.value = null
  testComplete.value = false
  testSamples.value = []
  isTestingTarget.value = false
  if (testTimer) {
    clearInterval(testTimer)
    testTimer = null
  }
}

/**
 * Complete calibration
 */
function completeCalibration() {
  emit('complete')
}

/**
 * Cancel calibration
 */
function cancelCalibration() {
  if (testTimer) {
    clearInterval(testTimer)
    testTimer = null
  }
  emit('cancel')
}

// Reset state when calibration starts
watch(() => props.isCalibrating, (isCalibrating) => {
  if (isCalibrating) {
    retryCalibration()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (testTimer) {
    clearInterval(testTimer)
    testTimer = null
  }
})
</script>

<template>
  <div v-if="isCalibrating" class="calibration-overlay">
    <!-- Header with status -->
    <div class="calibration-header">
      <div class="calibration-status">
        <div class="status-indicators">
          <!-- WebGazer Status -->
          <div class="status-item">
            <span
              :class="[
                'status-dot',
                webgazerReady ? 'status-dot--success' : 'status-dot--warning'
              ]"
            />
            <span>{{ webgazerReady ? 'WebGazer Ready' : 'Loading WebGazer...' }}</span>
          </div>
          
          <!-- Video Feed Status -->
          <div class="status-item">
            <span
              :class="[
                'status-dot',
                videoFeedActive ? 'status-dot--success' : 'status-dot--error'
              ]"
            />
            <span>{{ videoFeedActive ? 'Camera Active' : 'No Camera' }}</span>
          </div>
          
          <!-- Mode Indicator -->
          <div class="status-item">
            <span
              :class="[
                'status-dot',
                useMouseFallback ? 'status-dot--warning' : 'status-dot--success'
              ]"
            />
            <span>{{ useMouseFallback ? 'Mouse Mode (Fallback)' : 'Eye Tracking Mode' }}</span>
          </div>
        </div>
      </div>
      
      <h1 class="calibration-title">
        {{ step === 'train' ? '👁️ Calibration Training' : '🎯 Accuracy Test' }}
      </h1>
      
      <p class="calibration-subtitle">
        {{ step === 'train' 
          ? `Click on each circle ${MIN_CLICKS_PER_TARGET} times while looking at it`
          : 'Stare at the highlighted target for 3 seconds' 
        }}
      </p>
    </div>

    <!-- Progress bar -->
    <div class="calibration-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${progress * 100}%` }"
        />
      </div>
      <span class="progress-text">
        <template v-if="step === 'train'">
          {{ calibrationPoints }} / {{ TOTAL_REQUIRED_CLICKS }} clicks
        </template>
        <template v-else>
          {{ testComplete ? 'Complete' : 'Measuring accuracy...' }}
        </template>
        ({{ Math.round(progress * 100) }}%)
      </span>
    </div>

    <!-- Calibration targets (Training) -->
    <div v-if="step === 'train'" class="calibration-targets">
      <button
        v-for="target in calibrationTargets"
        :key="target.id"
        :class="[
          'calibration-target',
          {
            'calibration-target--active': currentTrainTarget?.id === target.id,
            'calibration-target--completed': clickedTargets.has(target.id),
            'calibration-target--clicked': (clicksPerTarget[target.id] || 0) > 0,
          }
        ]"
        :style="{
          left: `${target.x}%`,
          top: `${target.y}%`,
        }"
        @click="handleTargetClick(target, $event)"
      >
        <span class="target-inner">
          {{ clickedTargets.has(target.id) ? '✓' : (clicksPerTarget[target.id] || 0) }}
        </span>
        <span 
          v-if="currentTrainTarget?.id === target.id" 
          class="target-pulse"
        />
      </button>
    </div>

    <!-- Single Center Test Target -->
    <div v-else class="calibration-targets">
      <button
        :class="[
          'calibration-target',
          'calibration-target--test-active',
          {
            'test-good': testResult && testResult.avgDistance <= 50,
            'test-acceptable': testResult && testResult.avgDistance > 50 && testResult.avgDistance <= 100,
            'test-poor': testResult && testResult.avgDistance > 100,
          }
        ]"
        :style="{
          left: `${testTarget.x}%`,
          top: `${testTarget.y}%`,
        }"
        disabled
      >
        <span class="target-inner">
          <template v-if="testComplete && testResult">
            {{ testResult.accuracy }}%
          </template>
          <template v-else>
            👁️
          </template>
        </span>
        <span v-if="isTestingTarget" class="target-pulse" />
      </button>
    </div>

    <!-- Gaze indicator (shows where WebGazer thinks you're looking) -->
    <div
      v-if="gazePosition && !useMouseFallback"
      class="gaze-preview"
      :style="{
        left: `${gazePosition.x}px`,
        top: `${gazePosition.y}px`,
      }"
    />

    <!-- Instructions -->
    <div class="calibration-instructions">
      <template v-if="step === 'train'">
        <template v-if="currentTrainTarget">
          <p class="instruction-main">
            👆 Click the <strong>pulsing circle</strong> at {{ currentTrainTarget.label }}
          </p>
          <p class="instruction-sub">
            Click {{ MIN_CLICKS_PER_TARGET - (clicksPerTarget[currentTrainTarget.id] || 0) }} more times
          </p>
        </template>
      </template>
      <template v-else>
        <template v-if="isTestingTarget">
          <p class="instruction-main text-blue-400">
            👀 Stare at the <strong>center target</strong>
          </p>
          <div class="test-feedback">
            <div class="test-timer">
              <div 
                class="test-timer-fill" 
                :style="{ width: `${(testElapsed / TEST_DURATION_MS) * 100}%` }"
              />
            </div>
            <p v-if="currentGazeDistance !== null" class="instruction-sub">
              Gaze deviation: <strong :class="currentGazeDistance <= 50 ? 'text-green-400' : currentGazeDistance <= 100 ? 'text-yellow-400' : 'text-red-400'">{{ currentGazeDistance }}px</strong>
            </p>
          </div>
        </template>
        <template v-else-if="testComplete && testResult">
          <p class="instruction-main text-green-400">
            ✓ Test Complete!
          </p>
          <p class="instruction-sub text-lg">
            Accuracy: <strong :class="testResult.accuracy >= 70 ? 'text-green-400' : testResult.accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'">{{ testResult.accuracy }}%</strong>
          </p>
        </template>
      </template>
    </div>

    <!-- Control buttons -->
    <div class="calibration-controls">
      <button
        class="control-btn control-btn--secondary"
        @click="step === 'test' ? retryCalibration() : cancelCalibration()"
      >
        {{ step === 'train' ? '✕ Cancel' : '↺ Retrain' }}
      </button>
      
      <button
        v-if="step === 'test' && testComplete"
        class="control-btn control-btn--primary"
        @click="completeCalibration"
      >
        ✓ Finish & Start
      </button>
      
      <button
        v-else-if="step === 'train' && calibrationPoints >= 9"
        class="control-btn control-btn--warning"
        @click="startTestPhase"
      >
        Skip to Test →
      </button>
    </div>
  </div>
</template>

<style scoped>
.calibration-overlay {
  @apply fixed inset-0 bg-aac-bg z-[60] flex flex-col;
}

.calibration-header {
  @apply text-center pt-8 pb-4;
}

.calibration-status {
  @apply mb-4;
}

.status-indicators {
  @apply flex justify-center gap-6 flex-wrap;
}

.status-item {
  @apply flex items-center gap-2 text-sm text-aac-muted;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-dot--success {
  @apply bg-green-500;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.status-dot--warning {
  @apply bg-yellow-500;
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.5);
}

.status-dot--error {
  @apply bg-red-500;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.calibration-title {
  @apply text-3xl font-bold text-aac-text;
}

.calibration-subtitle {
  @apply text-lg text-aac-muted mt-2;
}

.calibration-progress {
  @apply px-8 py-4 flex items-center gap-4;
}

.progress-bar {
  @apply flex-1 h-3 bg-aac-card rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300;
}

.progress-text {
  @apply text-sm text-aac-muted whitespace-nowrap;
}

.calibration-targets {
  @apply flex-1 relative;
}

.calibration-target {
  @apply absolute w-16 h-16 -ml-8 -mt-8
         flex items-center justify-center
         rounded-full
         bg-aac-surface border-4 border-aac-card
         text-aac-text font-bold text-lg
         cursor-pointer
         transition-all duration-200;
}

.calibration-target:hover:not(:disabled) {
  @apply scale-110;
}

.calibration-target--active {
  @apply border-primary-400 bg-primary-500/20 scale-125;
}

.calibration-target--clicked {
  @apply border-yellow-400 bg-yellow-500/20;
}

.calibration-target--completed {
  @apply border-green-400 bg-green-500/20;
}

/* Test phase styles */
.calibration-target--test-active {
  @apply border-blue-400 bg-blue-500/30 scale-150;
  box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
  animation: pulse-glow 1s ease-in-out infinite;
}

.calibration-target--test-waiting {
  @apply border-gray-600 bg-gray-800/50 opacity-50;
}

.calibration-target.test-good {
  @apply border-green-400 bg-green-500/30;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
}

.calibration-target.test-acceptable {
  @apply border-yellow-400 bg-yellow-500/30;
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.4);
}

.calibration-target.test-poor {
  @apply border-red-400 bg-red-500/30;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
  50% { box-shadow: 0 0 60px rgba(59, 130, 246, 0.9); }
}

.target-inner {
  @apply z-10;
}

.target-pulse {
  @apply absolute inset-0 rounded-full border-4 border-primary-400 animate-ping;
}

.gaze-preview {
  @apply fixed w-6 h-6 rounded-full 
         bg-red-500/50 border-2 border-red-400
         pointer-events-none z-[70]
         transform -translate-x-1/2 -translate-y-1/2;
}

.calibration-instructions {
  @apply text-center py-4;
}

.instruction-main {
  @apply text-xl text-aac-text;
}

.instruction-sub {
  @apply text-aac-muted mt-1;
}

.test-feedback {
  @apply mt-3 flex flex-col items-center gap-2;
}

.test-timer {
  @apply w-48 h-2 bg-aac-card rounded-full overflow-hidden;
}

.test-timer-fill {
  @apply h-full bg-blue-500 transition-all duration-100;
}

.calibration-controls {
  @apply flex justify-center gap-4 pb-8;
}

.control-btn {
  @apply px-8 py-3 rounded-xl font-semibold text-lg transition-all;
}

.control-btn--primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white;
}

.control-btn--secondary {
  @apply bg-aac-card hover:bg-aac-surface text-aac-text;
}

.control-btn--warning {
  @apply bg-yellow-600 hover:bg-yellow-700 text-white;
}
</style>
