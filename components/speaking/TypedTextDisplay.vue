<script setup lang="ts">
/**
 * SOWTEE Typed Text Display Component
 * Shows the currently typed abbreviation text with actions.
 */

interface Props {
  text: string
  isExpanding: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  isExpanding: false,
})

const emit = defineEmits<{
  expand: []
  backspace: []
  clear: []
  addSpace: []
}>()

// Format text for display (space-separated letters)
const displayText = computed(() => {
  return props.text.split('').join(' ').toUpperCase()
})

const hasText = computed(() => props.text.length > 0)
</script>

<template>
  <div class="typed-text">
    <!-- Text display area -->
    <div class="typed-text__display">
      <span v-if="hasText" class="typed-text__letters">
        {{ displayText }}
      </span>
      <span v-else class="typed-text__placeholder">
        Type abbreviations...
      </span>
      
      <!-- Cursor -->
      <span class="typed-text__cursor" />
    </div>
    
    <!-- Action buttons -->
    <div class="typed-text__actions">
      <button
        v-if="hasText"
        class="typed-text__action typed-text__action--backspace"
        title="Backspace"
        @click="() => { console.log('Backspace clicked'); emit('backspace') }"
      >
        ⌫
      </button>
      
      <button
        v-if="hasText"
        class="typed-text__action typed-text__action--space"
        title="Add space"
        @click="emit('addSpace')"
      >
        ␣
      </button>
      
      <button
        v-if="hasText"
        class="typed-text__action typed-text__action--clear"
        title="Clear all"
        @click="() => { console.log('Clear clicked'); emit('clear') }"
      >
        ✕
      </button>
      
      <button
        v-if="hasText"
        class="typed-text__action typed-text__action--expand"
        :disabled="isExpanding"
        title="Expand abbreviation (Enter)"
        @click="emit('expand')"
      >
        <span v-if="isExpanding" class="animate-spin">⟳</span>
        <span v-else>→ Expand</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.typed-text {
  @apply flex items-center gap-4;
  @apply bg-aac-surface rounded-2xl;
  @apply border-2 border-aac-card;
  @apply px-6 py-4;
  @apply w-full max-w-2xl mx-auto;
}

.typed-text__display {
  @apply flex-1;
  @apply flex items-center;
  @apply min-h-[2rem];
}

.typed-text__letters {
  @apply text-2xl font-mono font-bold;
  @apply text-primary-400;
  @apply tracking-widest;
}

.typed-text__placeholder {
  @apply text-lg text-aac-muted;
}

.typed-text__cursor {
  @apply w-0.5 h-6 bg-primary-500;
  @apply ml-1;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.typed-text__actions {
  @apply flex items-center gap-2;
}

.typed-text__action {
  @apply px-3 py-2;
  @apply rounded-lg;
  @apply text-sm;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.typed-text__action--backspace,
.typed-text__action--space,
.typed-text__action--clear {
  @apply bg-aac-card text-aac-muted;
  @apply hover:bg-aac-surface hover:text-aac-text;
}

.typed-text__action--expand {
  @apply bg-primary-600 text-white;
  @apply hover:bg-primary-500;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
