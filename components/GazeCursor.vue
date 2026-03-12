<script setup lang="ts">
/**
 * GazeCursor Component
 * Simple gaze position indicator - just a small dot.
 * Dwell progress is shown on the target element itself, not on the cursor.
 */

const props = defineProps<{
  position: { x: number; y: number } | null
  dwellProgress: number
  isOnTarget: boolean
  isSelecting: boolean
  visible: boolean
  isLocked: boolean
}>()
</script>

<template>
  <Teleport to="body">
    <!-- Simple gaze dot indicator -->
    <div
      v-if="visible && position"
      class="gaze-dot"
      :class="{
        'gaze-dot--on-target': isOnTarget,
        'gaze-dot--selecting': isSelecting,
      }"
      :style="{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }"
    />
  </Teleport>
</template>

<style scoped>
.gaze-dot {
  @apply fixed pointer-events-none z-[9999];
  @apply w-4 h-4 rounded-full;
  @apply bg-white/80 border-2 border-aac-highlight;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgb(var(--aac-highlight) / 0.5);
  transition: all 0.15s ease-out;
}

.gaze-dot--on-target {
  @apply w-5 h-5 bg-aac-highlight border-white;
  box-shadow: 0 0 20px rgb(var(--aac-highlight) / 0.7);
}

.gaze-dot--selecting {
  @apply w-6 h-6 bg-green-400 border-green-300;
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.8);
  animation: select-pulse 0.3s ease-out;
}

@keyframes select-pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.5); }
  100% { transform: translate(-50%, -50%) scale(1); }
}
</style>
