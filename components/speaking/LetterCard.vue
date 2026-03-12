<script setup lang="ts">
/**
 * SOWTEE Letter Card Component
 * Individual card showing a group of letters (e.g., "ABCDE").
 */

interface Props {
  label: string
  letters: string[]
  index: number
  isHighlighted: boolean
  dwellProgress?: number // 0-1 for eye gaze dwell
}

const props = withDefaults(defineProps<Props>(), {
  dwellProgress: 0,
})

const emit = defineEmits<{
  select: [index: number]
  hover: [index: number]
  leave: []
}>()

function handleClick() {
  emit('select', props.index)
}

function handleMouseEnter() {
  emit('hover', props.index)
}

function handleMouseLeave() {
  emit('leave')
}

// Calculate dwell progress style
const dwellStyle = computed(() => {
  if (props.dwellProgress <= 0) return {}
  return {
    '--dwell-progress': `${props.dwellProgress * 100}%`,
  }
})
</script>

<template>
  <button
    class="letter-card"
    :class="{ 
      'letter-card--highlighted': isHighlighted,
      'letter-card--dwelling': dwellProgress > 0,
    }"
    :style="dwellStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="letter-card__letters">
      {{ label }}
    </div>
    
    <!-- Dwell progress indicator -->
    <div 
      v-if="dwellProgress > 0"
      class="letter-card__dwell-ring"
    />
  </button>
</template>

<style scoped>
.letter-card {
  @apply relative;
  @apply w-full aspect-[3/2] min-h-[80px];
  @apply bg-aac-surface rounded-2xl;
  @apply border-2 border-aac-card;
  @apply flex items-center justify-center;
  @apply cursor-pointer;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.letter-card:hover {
  @apply bg-aac-card border-primary-500;
  @apply scale-[1.02];
}

.letter-card--highlighted {
  @apply bg-primary-600/20 border-primary-500;
  @apply ring-2 ring-primary-400;
  @apply scale-105;
}

.letter-card--dwelling {
  @apply border-accent-500;
}

.letter-card__letters {
  @apply text-2xl md:text-3xl font-bold;
  @apply text-aac-text tracking-wider;
  @apply select-none;
}

.letter-card--highlighted .letter-card__letters {
  @apply text-primary-400;
}

/* Dwell progress ring */
.letter-card__dwell-ring {
  @apply absolute inset-0;
  @apply rounded-2xl;
  @apply pointer-events-none;
  background: conic-gradient(
    from 0deg,
    rgb(var(--color-accent-500)) var(--dwell-progress, 0%),
    transparent var(--dwell-progress, 0%)
  );
  mask: radial-gradient(
    closest-side,
    transparent calc(100% - 4px),
    black calc(100% - 4px)
  );
  -webkit-mask: radial-gradient(
    closest-side,
    transparent calc(100% - 4px),
    black calc(100% - 4px)
  );
}
</style>
