<script setup lang="ts">
/**
 * SOWTEE Sentence Suggestions Component
 * Shows expanded abbreviation options with gaze-optimized navigation.
 * Layout: Up (Prev), Down (Next), Left (Discard), Right (Speak).
 */

import { ChevronUp, ChevronDown, ArrowLeft, Volume2 } from 'lucide-vue-next'
import { useGazeController } from '@/composables/useGazeController'

const { t } = useI18n()

interface Props {
  primary: string
  alternatives: string[]
  selectedIndex: number
  isSpeaking: boolean
  highlightedAction: 'speak' | 'discard' | null
}

const props = withDefaults(defineProps<Props>(), {
  primary: '',
  alternatives: () => [],
  selectedIndex: 0,
  isSpeaking: false,
  highlightedAction: null,
})

const emit = defineEmits<{
  speak: []
  discard: []
  selectAlternative: [index: number]
}>()

const gazeController = useGazeController()

// Refs for gaze targets
const upBtnRef = ref<HTMLElement | null>(null)
const downBtnRef = ref<HTMLElement | null>(null)
const speakBtnRef = ref<HTMLElement | null>(null)
const discardBtnRef = ref<HTMLElement | null>(null)
const altItemRefs = ref<(HTMLElement | null)[]>([])

// Currently displayed sentence (from selected index)
const currentSentence = computed(() => {
  if (props.selectedIndex === 0) return props.primary
  return props.alternatives[props.selectedIndex - 1] || props.primary
})

function handleSpeak() {
  emit('speak')
}

function handleDiscard() {
  emit('discard')
}

function handleSelectAlternative(index: number) {
  emit('selectAlternative', index + 1)
}

function handleUp() {
  // Bubbled up via gaze controller or handled by parent store
  // But for click handlers in UI:
  // We don't have direct access to store actions here, we rely on parent/gaze
  // However, for the click binding, we might need to emit or we assume parent handles gaze only?
  // Actually parent `handleSuggestionGaze` handles gaze.
  // We need click handlers too for mouse interaction?
  // The user didn't explicitly ask for click handlers, but good practice.
  // But we don't have 'prev' event defined.
  // Let's rely on Gaze for now or emit new events. 
  // Given limitations of modifying parent significantly, I'll rely on the Store being accessible via Gaze Controller logic 
  // or simply define new events if needed.
  // Wait, I can't emit 'prev' if it's not defined.
  // I will just use the gaze target IDs which are handled by parent.
}

// Register gaze targets on mount
onMounted(() => {
  registerTargets()
})

// Cleanup on unmount
onUnmounted(() => {
  clearTargets()
})

// Re-register if elements change (unlikely with this structure but good safety)
watch([upBtnRef, downBtnRef, speakBtnRef, discardBtnRef], () => {
    registerTargets()
})
// Watch alternatives length to update alt refs
watch(() => props.alternatives, async () => {
    await nextTick()
    registerTargets()
})

function registerTargets() {
  if (!gazeController) return

  // Register main navigation
  if (upBtnRef.value) gazeController.registerTarget('suggestion-up', upBtnRef.value, 2)
  if (downBtnRef.value) gazeController.registerTarget('suggestion-down', downBtnRef.value, 2)
  if (speakBtnRef.value) gazeController.registerTarget('suggestion-speak', speakBtnRef.value, 8) // High priority
  if (discardBtnRef.value) gazeController.registerTarget('suggestion-discard', discardBtnRef.value, 6)
  
  // Register alternative items if visible
  altItemRefs.value.forEach((el, index) => {
    if (el) {
       gazeController.registerTarget(`suggestion-alt-${index + 1}`, el, 5)
    }
  })
}

function clearTargets() {
  if (!gazeController) return
  gazeController.unregisterTarget('suggestion-up')
  gazeController.unregisterTarget('suggestion-down')
  gazeController.unregisterTarget('suggestion-speak')
  gazeController.unregisterTarget('suggestion-discard')
  
  // Clear alts
  // We don't know exactly how many, but we can loop a safe amount or track them
  // Basic cleanup:
  for(let i=1; i<20; i++) {
      gazeController.unregisterTarget(`suggestion-alt-${i}`)
  }
}
</script>

<template>
  <div class="suggestions-panel">
    <!-- Top: Alternatives List & Up Button -->
    <div class="suggestions-panel__top-section">
      <!-- Up Arrow for changing selection -->
      <button 
        ref="upBtnRef"
        class="nav-btn nav-btn--up"
        :class="{ 'nav-btn--active': gazeController.state.currentTargetId === 'suggestion-up' }"
        data-suggestion="up"
      >
        <ChevronUp :size="40" />
      </button>

      <!-- Alternatives List (Compact) -->
      <div v-if="alternatives.length > 0" class="suggestions-panel__alternatives">
        <button
          v-for="(alt, index) in alternatives.slice(0, 3)"
          :key="index"
          :ref="el => altItemRefs[index] = el as HTMLElement"
          class="suggestions-panel__alt-item"
          :class="{ 
            'suggestions-panel__alt-item--selected': selectedIndex === index + 1,
            'suggestions-panel__alt-item--active': gazeController.state.currentTargetId === `suggestion-alt-${index + 1}`
          }"
          :data-suggestion-alt="index"
          @click="handleSelectAlternative(index)"
        >
          {{ alt }}
        </button>
      </div>
    </div>
    
    <!-- Middle: Discard - Card - Speak -->
    <div class="suggestions-panel__main">
      <!-- Discard (Left) -->
      <button
        ref="discardBtnRef"
        class="suggestions-panel__action suggestions-panel__action--discard"
        :class="{ 
          'suggestions-panel__action--highlighted': highlightedAction === 'discard',
          'suggestions-panel__action--active': gazeController.state.currentTargetId === 'suggestion-discard'
        }"
        data-suggestion="discard"
        @click="handleDiscard"
      >
        <ArrowLeft :size="32" />
        <span class="text-sm mt-2">{{ t('speaking.suggestions.back') }}</span>
      </button>
      
      <!-- Primary sentence (Center) -->
      <div class="suggestions-panel__primary">
        <p class="suggestions-panel__sentence">
          {{ currentSentence }}
        </p>
        
        <!-- Speaking indicator -->
        <div v-if="isSpeaking" class="suggestions-panel__speaking">
          <span class="suggestions-panel__speaking-dot" />
          <span class="suggestions-panel__speaking-dot" />
          <span class="suggestions-panel__speaking-dot" />
        </div>
      </div>
      
      <!-- Speak (Right) -->
      <button
        ref="speakBtnRef"
        class="suggestions-panel__action suggestions-panel__action--speak"
        :class="{ 
          'suggestions-panel__action--highlighted': highlightedAction === 'speak',
          'suggestions-panel__action--active': gazeController.state.currentTargetId === 'suggestion-speak'
        }"
        :disabled="isSpeaking"
        data-suggestion="speak"
        @click="handleSpeak"
      >
        <Volume2 :size="32" />
        <span class="text-sm mt-2">{{ t('speaking.suggestions.speak') }}</span>
      </button>
    </div>
    
    <!-- Bottom: Down Button -->
    <div class="suggestions-panel__bottom-section">
      <button 
        ref="downBtnRef"
        class="nav-btn nav-btn--down"
        :class="{ 'nav-btn--active': gazeController.state.currentTargetId === 'suggestion-down' }"
        data-suggestion="down"
      >
        <ChevronDown :size="40" />
      </button>
    </div>
    
    <!-- Hints -->
    <div class="suggestions-panel__hints">
      <span>{{ t('speaking.suggestions.hintCycle') }}</span>
      <span>{{ t('speaking.suggestions.hintActions') }}</span>
    </div>
  </div>
</template>

<style scoped>
.suggestions-panel {
  @apply flex flex-col gap-12;
  @apply w-full max-w-6xl mx-auto;
  @apply p-8 h-full justify-between;
}

.suggestions-panel__top-section {
  @apply flex flex-col items-center gap-6;
  @apply mb-4;
}

.suggestions-panel__bottom-section {
  @apply flex justify-center mt-4;
}

.suggestions-panel__alternatives {
  @apply flex gap-4;
  @apply items-center justify-center;
}

.suggestions-panel__alt-item {
  @apply px-4 py-2;
  @apply bg-aac-card rounded-full;
  @apply text-sm text-aac-muted;
  @apply border border-aac-surface;
  @apply transition-all duration-200;
  @apply max-w-[150px] truncate;
}

.suggestions-panel__alt-item--selected {
  @apply border-aac-highlight text-aac-highlight;
  background-color: rgb(var(--aac-highlight) / 0.2);
}

.suggestions-panel__alt-item--active {
  @apply ring-2 ring-aac-highlight scale-105;
}

.suggestions-panel__main {
  @apply flex items-stretch gap-12;
  @apply justify-between h-64;
}

.suggestions-panel__action {
  @apply flex flex-col items-center justify-center;
  @apply w-32;
  @apply rounded-2xl;
  @apply border-2;
  @apply transition-all duration-200;
  @apply focus:outline-none;
}

.suggestions-panel__action--discard {
  @apply bg-aac-card border-aac-surface;
  @apply text-aac-muted;
  @apply hover:bg-red-600/20 hover:border-red-500 hover:text-red-400;
}

.suggestions-panel__action--speak {
  background-color: rgb(var(--aac-highlight) / 0.2);
  @apply border-aac-highlight;
  @apply text-aac-highlight;
}

.suggestions-panel__action--speak:hover {
  background-color: rgb(var(--aac-highlight) / 0.4);
}

.suggestions-panel__action--active {
  @apply ring-4 ring-white/50 scale-105;
}

.suggestions-panel__primary {
  @apply flex-[2];
  @apply bg-aac-card rounded-2xl;
  @apply border-2 border-aac-highlight;
  @apply p-6;
  @apply flex items-center justify-center;
  @apply relative;
}

.suggestions-panel__sentence {
  @apply text-2xl md:text-4xl font-bold;
  @apply text-aac-text;
  @apply text-center leading-tight;
}

.nav-btn {
  @apply w-24 h-16;
  @apply bg-aac-card border border-aac-surface;
  @apply rounded-xl;
  @apply flex items-center justify-center;
  @apply text-aac-muted;
  @apply transition-all duration-200;
}

.nav-btn--active {
  @apply bg-aac-highlight text-white scale-110 border-aac-highlight;
}

.suggestions-panel__speaking {
  @apply absolute bottom-3 left-1/2 -translate-x-1/2;
  @apply flex gap-1;
}

.suggestions-panel__speaking-dot {
  @apply w-2 h-2 rounded-full bg-aac-highlight;
  animation: bounce 1s infinite;
}

.suggestions-panel__speaking-dot:nth-child(2) {
  animation-delay: 0.1s;
}

.suggestions-panel__speaking-dot:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.suggestions-panel__hints {
  @apply flex justify-center gap-8 mt-4;
  @apply text-xs text-aac-muted;
}
</style>
