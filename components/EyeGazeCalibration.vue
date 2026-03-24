<script setup lang="ts">
interface CalibrationTarget {
  id: string
  x: number
  y: number
  label: string
  group: 'card' | 'suggestion' | 'action'
}

const props = defineProps<{
  isCalibrating: boolean
  webgazerReady: boolean
  videoFeedActive: boolean
  useMouseFallback: boolean
  statusText: string
  targets: CalibrationTarget[]
}>()

const emit = defineEmits<{
  calibrationClick: [{ x: number; y: number; targetId: string }]
  complete: []
  cancel: []
}>()

const MIN_TAPS_PER_TARGET = 3
const currentTargetIndex = ref(0)
const tapsByTarget = ref<Record<string, number>>({})

const currentTarget = computed(() => props.targets[currentTargetIndex.value] ?? null)
const shouldShowArrowBelow = computed(() => {
  if (!currentTarget.value) return false
  return currentTarget.value.y <= 26
})

const completedTargets = computed(() => {
  return props.targets.filter((target) => (tapsByTarget.value[target.id] || 0) >= MIN_TAPS_PER_TARGET).length
})

const arrowStyle = computed(() => {
  if (!currentTarget.value) return {}

  return {
    left: `${currentTarget.value.x}%`,
    top: `${shouldShowArrowBelow.value
      ? Math.min(92, currentTarget.value.y + 12)
      : Math.max(8, currentTarget.value.y - 12)}%`,
  }
})

const currentTargetTapCount = computed(() => {
  if (!currentTarget.value) return 0
  return tapsByTarget.value[currentTarget.value.id] || 0
})

const tapsRemainingForCurrentTarget = computed(() => {
  return Math.max(0, MIN_TAPS_PER_TARGET - currentTargetTapCount.value)
})

const circlesLeft = computed(() => {
  return Math.max(0, props.targets.length - completedTargets.value)
})

const guideStatus = computed(() => {
  if (!props.webgazerReady) {
    return 'Loading camera...'
  }

  if (props.useMouseFallback) {
    return 'Mouse fallback mode is active'
  }

  if (isDone.value) {
    return 'All circles complete'
  }

  return `Circles left: ${circlesLeft.value}`
})

const isDone = computed(() => {
  return props.targets.length > 0 && completedTargets.value >= props.targets.length
})

function resetProgress() {
  currentTargetIndex.value = 0
  tapsByTarget.value = {}
}

function isTargetComplete(targetId: string) {
  return (tapsByTarget.value[targetId] || 0) >= MIN_TAPS_PER_TARGET
}

function isTargetActive(targetId: string) {
  return currentTarget.value?.id === targetId && !isDone.value
}

function handleTargetClick(target: CalibrationTarget, event: MouseEvent) {
  if (!isTargetActive(target.id)) {
    return
  }

  emit('calibrationClick', {
    x: event.clientX,
    y: event.clientY,
    targetId: target.id,
  })

  const currentTaps = tapsByTarget.value[target.id] || 0
  const nextTaps = Math.min(MIN_TAPS_PER_TARGET, currentTaps + 1)
  tapsByTarget.value[target.id] = nextTaps

  if (nextTaps >= MIN_TAPS_PER_TARGET && currentTargetIndex.value < props.targets.length - 1) {
    currentTargetIndex.value += 1
  }
}

function finishCalibration() {
  if (!isDone.value) return
  emit('complete')
}

watch(
  () => props.isCalibrating,
  (value) => {
    if (value) {
      resetProgress()
    }
  },
  { immediate: true }
)

watch(
  () => props.targets,
  () => {
    resetProgress()
  },
  { deep: true }
)
</script>

<template>
  <div v-if="isCalibrating" class="calibration-screen">
    <section class="calibration-zone" aria-label="Eye gaze calibration zone">
      <div
        class="guide-arrow"
        :class="{ 'guide-arrow--below': shouldShowArrowBelow }"
        v-if="currentTarget && !isDone"
        :style="arrowStyle"
      >
        <div class="guide-arrow__label">
          <span class="guide-arrow__look">Look here</span>
          <span class="guide-arrow__meta">{{ guideStatus }}</span>
          <span class="guide-arrow__meta">Taps left on this circle: {{ tapsRemainingForCurrentTarget }}</span>
        </div>
        <span class="guide-arrow__shaft" />
        <span class="guide-arrow__tip" />
      </div>

      <button
        v-for="target in targets"
        :key="target.id"
        class="target-dot"
        :class="{
          'target-dot--active': isTargetActive(target.id),
          'target-dot--done': isTargetComplete(target.id),
          'target-dot--locked': !isTargetActive(target.id) && !isTargetComplete(target.id)
        }"
        :style="{ left: `${target.x}%`, top: `${target.y}%` }"
        :aria-label="target.label"
        @click="handleTargetClick(target, $event)"
      >
        <span class="target-dot__count">
          {{ isTargetComplete(target.id) ? '✓' : (tapsByTarget[target.id] || 0) }}
        </span>
      </button>
    </section>

    <footer class="calibration-footer">
      <button class="calibration-btn calibration-btn--ghost" @click="emit('cancel')">
        Cancel
      </button>
      <button
        class="calibration-btn calibration-btn--primary"
        :disabled="!isDone"
        @click="finishCalibration"
      >
        Complete calibration
      </button>
    </footer>
  </div>
</template>

<style scoped>
.calibration-screen {
  @apply fixed inset-0 text-aac-text;
  @apply flex flex-col;
  @apply bg-aac-bg;
  overflow: hidden;
}

.calibration-zone {
  @apply absolute inset-0 z-0 overflow-hidden;
}

.guide-arrow {
  @apply absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none;
  transition: left 280ms ease, top 280ms ease;
  animation: arrow-bob 1s ease-in-out infinite;
}

.guide-arrow--below {
  @apply flex-col-reverse;
}

.guide-arrow__label {
  @apply mb-2 px-3 py-2 rounded-xl;
  @apply border border-aac-surface bg-aac-card/95;
  @apply flex flex-col items-center;
  @apply text-center;
  @apply max-w-[230px];
}

.guide-arrow--below .guide-arrow__label {
  @apply mt-2 mb-0;
}

.guide-arrow__look {
  @apply text-sm font-semibold text-aac-highlight;
}

.guide-arrow__meta {
  @apply text-[11px] leading-tight text-aac-muted;
}

.guide-arrow__shaft {
  @apply block w-1 h-12 rounded-full;
  background: linear-gradient(180deg, rgba(251, 191, 36, 0.2), #fbbf24);
}

.guide-arrow--below .guide-arrow__shaft {
  background: linear-gradient(180deg, #fbbf24, rgba(251, 191, 36, 0.2));
}

.guide-arrow__tip {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 18px solid #fbbf24;
}

.guide-arrow--below .guide-arrow__tip {
  border-top: 0;
  border-bottom: 18px solid #fbbf24;
}

.target-dot {
  @apply absolute z-10 -translate-x-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full border border-white/30;
  @apply flex items-center justify-center font-bold text-xs md:text-sm text-white;
  background: rgba(31, 41, 55, 0.85);
  transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease;
}

.target-dot__count {
  @apply leading-none;
}

.target-dot--active {
  background: rgba(234, 179, 8, 0.22);
  border-color: #facc15;
  transform: translate(-50%, -50%) scale(1.06);
  box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.14);
}

.target-dot--done {
  background: rgba(16, 185, 129, 0.25);
  border-color: #34d399;
}

.target-dot--locked {
  opacity: 0.25;
  transform: translate(-50%, -50%) scale(0.82);
}

.calibration-footer {
  @apply relative z-20 mx-auto w-full max-w-5xl flex items-center justify-end gap-3;
  @apply px-6 pb-5 pt-4 mt-auto;
}

.calibration-btn {
  @apply rounded-xl px-4 py-2 text-sm font-semibold transition;
}

.calibration-btn--ghost {
  @apply border border-white/20 text-aac-text hover:bg-white/10;
}

.calibration-btn--primary {
  @apply bg-aac-highlight text-black hover:brightness-95 disabled:opacity-45 disabled:cursor-not-allowed;
}

@keyframes arrow-bob {
  0%,
  100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(6px);
  }
}
</style>
