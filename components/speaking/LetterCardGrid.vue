<script setup lang="ts">
/**
 * SOWTEE Letter Card Grid Component
 * Displays 5 letter cards or spread letters in a grid layout.
 */

import type { LetterCard as LetterCardType, SpreadLetter } from '~/stores/speaking'

interface Props {
  cards?: LetterCardType[]
  spreadLetters?: SpreadLetter[]
  level: 'cards' | 'letters'
  highlightedIndex: number | null
  dwellProgress?: number // For highlighted item
}

const props = withDefaults(defineProps<Props>(), {
  cards: () => [],
  spreadLetters: () => [],
  dwellProgress: 0,
})

const emit = defineEmits<{
  selectCard: [index: number]
  selectLetter: [index: number]
  highlight: [index: number | null]
}>()

// Computed items based on level
const items = computed(() => {
  if (props.level === 'cards') {
    return props.cards.map(card => ({
      index: card.index,
      label: card.label,
      letters: card.letters,
      isGrouped: false,
    }))
  } else {
    return props.spreadLetters.map(letter => ({
      index: letter.index,
      label: letter.display,
      letters: [letter.letter],
      isGrouped: letter.isGrouped,
    }))
  }
})

function handleSelect(index: number) {
  if (props.level === 'cards') {
    emit('selectCard', index)
  } else {
    emit('selectLetter', index)
  }
}

function handleHover(index: number) {
  emit('highlight', index)
}

function handleLeave() {
  // Don't clear highlight on leave for accessibility
}
</script>

<template>
  <div class="letter-grid" :class="`letter-grid--${level}`">
    <!-- Top row: 3 items -->
    <div class="letter-grid__row letter-grid__row--top">
      <SpeakingLetterCard
        v-for="item in items.slice(0, 3)"
        :key="item.index"
        :index="item.index"
        :label="item.label"
        :letters="item.letters"
        :is-highlighted="highlightedIndex === item.index"
        :dwell-progress="highlightedIndex === item.index ? dwellProgress : 0"
        @select="handleSelect"
        @hover="handleHover"
        @leave="handleLeave"
      />
    </div>
    
    <!-- Bottom row: 2 items centered -->
    <div class="letter-grid__row letter-grid__row--bottom">
      <SpeakingLetterCard
        v-for="item in items.slice(3, 5)"
        :key="item.index"
        :index="item.index"
        :label="item.label"
        :letters="item.letters"
        :is-highlighted="highlightedIndex === item.index"
        :dwell-progress="highlightedIndex === item.index ? dwellProgress : 0"
        @select="handleSelect"
        @hover="handleHover"
        @leave="handleLeave"
      />
    </div>
  </div>
</template>

<style scoped>
.letter-grid {
  @apply flex flex-col gap-4;
  @apply w-full max-w-3xl mx-auto;
  @apply p-4;
}

.letter-grid__row {
  @apply flex gap-4 justify-center;
}

.letter-grid__row--top {
  @apply grid grid-cols-3;
}

.letter-grid__row--bottom {
  @apply grid grid-cols-2;
  @apply max-w-[66%] mx-auto;
}

/* Animation for level change */
.letter-grid--letters {
  animation: fadeSlideIn 0.2s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
