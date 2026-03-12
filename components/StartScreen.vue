<script setup lang="ts">
/**
 * StartScreen Component
 * Initial idle screen with camera preview and start button
 */

const props = defineProps<{
  cameraActive?: boolean
}>()

const emit = defineEmits<{
  start: []
}>()

// Handle space key
function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space') {
    e.preventDefault()
    emit('start')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="start-screen">
    <!-- Camera preview background -->
    <slot name="camera" />

    <!-- Centered start button -->
    <div class="start-content">
      <!-- Logo -->
      <img 
        src="~/assets/css/logo/sowteeLogo.png" 
        alt="SOWTEE"
        class="w-48 h-auto mb-8 mx-auto"
      />
      
      <button
        class="start-button"
        @click="$emit('start')"
      >
        <svg class="start-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span class="start-text">Start Conversation</span>
        <span class="start-hint">Press Space to begin</span>
      </button>
    </div>

    <!-- Subtle camera status -->
    <div class="camera-status">
      <div
        :class="[
          'status-dot',
          cameraActive ? 'status-dot--active' : 'status-dot--inactive'
        ]"
      />
      <span class="status-text">
        {{ cameraActive ? 'Camera Ready' : 'Initializing...' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.start-screen {
  @apply relative w-full h-full min-h-[70vh] flex items-center justify-center;
  @apply bg-aac-bg;
}

.start-content {
  @apply relative z-10 text-center;
}

.start-button {
  @apply flex flex-col items-center gap-4 px-16 py-12;
  @apply bg-primary-600 hover:bg-primary-700 rounded-3xl;
  @apply transition-all duration-300 shadow-2xl;
  @apply hover:scale-105 hover:shadow-primary-500/30;
}

.start-icon {
  @apply text-white w-12 h-12;
}

.start-text {
  @apply text-2xl lg:text-3xl font-bold text-white;
}

.start-hint {
  @apply text-sm text-white/70;
}

.camera-status {
  @apply absolute bottom-6 left-1/2 -translate-x-1/2;
  @apply flex items-center gap-2 px-4 py-2 rounded-full;
  @apply bg-aac-surface/80 backdrop-blur;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-dot--active {
  @apply bg-green-500 animate-pulse;
}

.status-dot--inactive {
  @apply bg-gray-500;
}

.status-text {
  @apply text-sm text-aac-muted;
}
</style>
