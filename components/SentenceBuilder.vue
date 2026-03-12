<script setup lang="ts">
/**
 * SentenceBuilder Component
 * Displays the sentence being built word by word with speak button
 */

const props = defineProps<{
  sentence: string[]
  isSpeaking?: boolean
}>()

const emit = defineEmits<{
  speak: []
  removeWord: []
  clear: []
}>()

const sentenceText = computed(() => props.sentence.join(' '))
const hasContent = computed(() => props.sentence.length > 0)
</script>

<template>
  <div class="sentence-builder">
    <!-- Sentence display area -->
    <div class="sentence-display">
      <template v-if="hasContent">
        <span
          v-for="(word, index) in sentence"
          :key="index"
          class="sentence-word"
        >
          {{ word }}
        </span>
        <span class="cursor">|</span>
      </template>
      <span v-else class="placeholder">
        Select words to build your sentence...
      </span>
    </div>

    <!-- Action buttons -->
    <div class="sentence-actions">
      <button
        v-if="hasContent"
        class="action-btn action-btn--secondary"
        title="Remove last word (Backspace)"
        @click="$emit('removeWord')"
      >
        ⌫
      </button>
      
      <button
        v-if="hasContent"
        class="action-btn action-btn--secondary"
        title="Clear all"
        @click="$emit('clear')"
      >
        ✕
      </button>
      
      <button
        class="speak-btn"
        :class="{ 'speak-btn--speaking': isSpeaking, 'speak-btn--disabled': !hasContent }"
        :disabled="!hasContent"
        title="Speak sentence (Enter)"
        @click="$emit('speak')"
      >
        <span class="speak-icon">🔊</span>
        <span>Speak</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sentence-builder {
  @apply flex flex-col items-center gap-4 p-6 bg-aac-surface rounded-2xl;
}

.sentence-display {
  @apply min-h-[60px] px-6 py-4 bg-aac-bg rounded-xl w-full text-center;
  @apply text-2xl lg:text-3xl font-semibold text-aac-text;
}

.sentence-word {
  @apply inline-block mr-2;
}

.cursor {
  @apply animate-pulse text-primary-500;
}

.placeholder {
  @apply text-aac-muted text-lg;
}

.sentence-actions {
  @apply flex items-center gap-3;
}

.action-btn {
  @apply w-12 h-12 rounded-full text-xl transition-all;
  @apply flex items-center justify-center;
}

.action-btn--secondary {
  @apply bg-aac-card text-aac-muted hover:bg-aac-card/80;
}

.speak-btn {
  @apply px-8 py-4 rounded-full text-lg font-bold transition-all;
  @apply flex items-center gap-3;
  @apply bg-accent-600 text-white hover:bg-accent-700;
}

.speak-btn--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.speak-btn--speaking {
  @apply bg-green-500 animate-pulse;
}

.speak-icon {
  @apply text-2xl;
}
</style>
