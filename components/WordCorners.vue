<script setup lang="ts">
/**
 * WordCorners Component
 * Displays 4 word suggestions in the corners of the screen
 * Supports arrow key navigation and click/gaze selection
 */

import type { WordSuggestion } from '~/types/api'

const props = defineProps<{
  suggestions: WordSuggestion[]
  highlightedIndex: number | null
  showArabic?: boolean
}>()

const emit = defineEmits<{
  select: [word: WordSuggestion]
  highlight: [index: number | null]
}>()

// Corner positions mapping
const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
type CornerPosition = typeof corners[number]

const cornerClasses: Record<CornerPosition, string> = {
  'top-left': 'top-[25%] left-[18%] -translate-x-1/2 -translate-y-1/2',
  'top-right': 'top-[25%] left-[82%] -translate-x-1/2 -translate-y-1/2',
  'bottom-left': 'top-[75%] left-[18%] -translate-x-1/2 -translate-y-1/2',
  'bottom-right': 'top-[75%] left-[82%] -translate-x-1/2 -translate-y-1/2',
}

const arrowIcons: Record<CornerPosition, string> = {
  'top-left': '↖',
  'top-right': '↗',
  'bottom-left': '↙',
  'bottom-right': '↘',
}

function getSuggestion(index: number): WordSuggestion | null {
  return props.suggestions[index] || null
}

function handleSelect(index: number) {
  const suggestion = getSuggestion(index)
  if (suggestion) {
    emit('select', suggestion)
  }
}

function handleHover(index: number) {
  emit('highlight', index)
}

function handleLeave() {
  emit('highlight', null)
}
</script>

<template>
  <div class="word-corners">
    <div
      v-for="(corner, index) in corners"
      :key="corner"
      :class="[
        'corner-zone',
        cornerClasses[corner],
        {
          'corner-zone--highlighted': highlightedIndex === index,
          'corner-zone--empty': !getSuggestion(index),
        }
      ]"
      @click="handleSelect(index)"
      @mouseenter="handleHover(index)"
      @mouseleave="handleLeave"
    >
      <template v-if="getSuggestion(index)">
        <span class="corner-arrow">{{ arrowIcons[corner] }}</span>
        <div class="corner-content">
          <span class="corner-word">{{ getSuggestion(index)!.word }}</span>
          <span v-if="showArabic && getSuggestion(index)!.word_arabic" class="corner-arabic">
            {{ getSuggestion(index)!.word_arabic }}
          </span>
        </div>
        <span class="corner-category">{{ getSuggestion(index)!.category }}</span>
      </template>
      <template v-else>
        <span class="text-aac-muted">—</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.word-corners {
  @apply fixed inset-0 pointer-events-none z-30;
}

.corner-zone {
  @apply absolute pointer-events-auto;
  @apply w-56 h-40 lg:w-72 lg:h-48;
  @apply flex flex-col items-center justify-center gap-2;
  @apply bg-aac-surface/95 border-4 border-aac-card;
  @apply rounded-3xl cursor-pointer;
  @apply transition-all duration-200;
}

.corner-zone:hover,
.corner-zone--highlighted {
  @apply border-primary-500 bg-primary-600/20 scale-110;
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
}

.corner-zone--empty {
  @apply opacity-40 cursor-default;
}

.corner-arrow {
  @apply text-xs text-aac-muted;
}

.corner-content {
  @apply text-center;
}

.corner-word {
  @apply block text-2xl lg:text-3xl font-bold text-aac-text;
}

.corner-arabic {
  @apply block text-sm text-aac-muted font-arabic mt-1;
  direction: rtl;
}

.corner-category {
  @apply text-xs text-aac-muted capitalize mt-1;
}
</style>
