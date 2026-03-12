<script setup lang="ts">
/**
 * PhraseCard Component
 * Displays a predicted phrase with confidence and selection support
 */

import type { PhraseCandidate } from '~/types/api'

const props = defineProps<{
  phrase: PhraseCandidate
  index: number
  isSelected?: boolean
  isFocused?: boolean
  dwellProgress?: number
  showArabic?: boolean
}>()

const emit = defineEmits<{
  select: [phrase: PhraseCandidate]
}>()

const confidenceColor = computed(() => {
  const c = props.phrase.confidence
  if (c >= 0.8) return 'text-green-400'
  if (c >= 0.6) return 'text-yellow-400'
  return 'text-orange-400'
})

const sourceIcon = computed(() => {
  switch (props.phrase.source) {
    case 'memory': return '🧠'
    case 'vision': return '👁️'
    case 'rules': return '📋'
    default: return '💡'
  }
})

function handleSelect() {
  emit('select', props.phrase)
}

// Handle gaze selection
function handleGazeSelect(event: Event) {
  event.preventDefault()
  handleSelect()
}
</script>

<template>
  <button
    :class="[
      'phrase-card relative w-full text-left',
      index === 0 ? 'phrase-card--primary' : '',
      isSelected ? 'aac-button--selected' : '',
      isFocused ? 'aac-button--gaze-focus' : '',
    ]"
    data-gaze-selectable
    @click="handleSelect"
    @gaze-select="handleGazeSelect"
    @keydown.enter="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <!-- Dwell progress indicator -->
    <div
      v-if="dwellProgress && dwellProgress > 0"
      class="absolute inset-0 bg-accent-500/30 rounded-2xl transition-all duration-100"
      :style="{ width: `${dwellProgress * 100}%` }"
    />
    
    <div class="relative z-10">
      <!-- Main phrase -->
      <p class="text-aac-lg font-semibold text-aac-text">
        {{ phrase.phrase }}
      </p>
      
      <!-- Arabic translation -->
      <p
        v-if="showArabic && phrase.phrase_arabic"
        class="text-aac-base font-arabic text-aac-muted rtl mt-1"
      >
        {{ phrase.phrase_arabic }}
      </p>
      
      <!-- Metadata row -->
      <div class="flex items-center gap-4 mt-3 text-sm text-aac-muted">
        <!-- Confidence -->
        <span :class="confidenceColor" class="font-medium">
          {{ Math.round(phrase.confidence * 100) }}%
        </span>
        
        <!-- Source -->
        <span class="flex items-center gap-1">
          <span>{{ sourceIcon }}</span>
          <span class="capitalize">{{ phrase.source }}</span>
        </span>
        
        <!-- Related objects -->
        <span v-if="phrase.related_objects.length > 0" class="text-xs">
          {{ phrase.related_objects.slice(0, 2).join(', ') }}
        </span>
      </div>
    </div>
    
    <!-- Selection index badge -->
    <div
      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-lg font-bold"
    >
      {{ index + 1 }}
    </div>
  </button>
</template>
