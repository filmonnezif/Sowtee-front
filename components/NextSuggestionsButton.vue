<script setup lang="ts">
/**
 * NextSuggestionsButton Component
 * Button to cycle through word suggestions (Shift key equivalent)
 */

const props = defineProps<{
  hasMore?: boolean
  isEyeGazeMode?: boolean
}>()

const emit = defineEmits<{
  next: []
}>()
</script>

<template>
  <button
    class="next-suggestions-btn"
    :class="{ 'next-suggestions-btn--gaze': isEyeGazeMode }"
    title="Next suggestions (Shift)"
    @click="$emit('next')"
  >
    <span class="btn-icon">🔄</span>
    <span class="btn-text">More Words</span>
  </button>
</template>

<style scoped>
.next-suggestions-btn {
  @apply fixed left-4 top-1/2 -translate-y-1/2 z-40;
  @apply flex flex-col items-center justify-center gap-2;
  @apply w-20 h-24 lg:w-24 lg:h-28;
  @apply bg-accent-600 hover:bg-accent-700 text-white;
  @apply rounded-2xl shadow-xl;
  @apply transition-all duration-200;
}

.next-suggestions-btn:hover {
  @apply scale-110;
}

.next-suggestions-btn--gaze {
  @apply w-28 h-32 lg:w-32 lg:h-36;
}

.btn-icon {
  @apply text-3xl;
}

.btn-text {
  @apply text-xs lg:text-sm font-medium text-center;
}
</style>
