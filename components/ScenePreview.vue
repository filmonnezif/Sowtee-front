<script setup lang="ts">
/**
 * ScenePreview Component
 * Small preview of the captured scene with action buttons
 */

const props = defineProps<{
  imageData: string | null
  sceneDescription?: string
  isCapturing?: boolean
}>()

const emit = defineEmits<{
  addScene: []
  close: []
}>()
</script>

<template>
  <div class="scene-preview">
    <!-- Scene thumbnail -->
    <div class="scene-thumbnail">
      <img
        v-if="imageData"
        :src="imageData"
        alt="Captured scene"
        class="w-full h-full object-cover"
      />
      <div v-else class="scene-placeholder">
        <span class="text-3xl">📷</span>
      </div>
      
      <!-- Capturing indicator -->
      <div v-if="isCapturing" class="capturing-overlay">
        <div class="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
      </div>
    </div>

    <!-- Add scene button -->
    <button
      class="add-scene-btn"
      title="Add another scene (Shift)"
      @click="$emit('addScene')"
    >
      ➕
    </button>

    <!-- Close button -->
    <button
      class="close-btn"
      title="End conversation"
      @click="$emit('close')"
    >
      ✕
    </button>

    <!-- Scene description tooltip -->
    <div v-if="sceneDescription" class="scene-tooltip">
      {{ sceneDescription }}
    </div>
  </div>
</template>

<style scoped>
.scene-preview {
  @apply relative flex items-center gap-2;
}

.scene-thumbnail {
  @apply w-20 h-14 lg:w-28 lg:h-20 rounded-lg overflow-hidden;
  @apply border-2 border-aac-card bg-aac-surface;
}

.scene-placeholder {
  @apply w-full h-full flex items-center justify-center bg-aac-card;
}

.capturing-overlay {
  @apply absolute inset-0 bg-black/50 flex items-center justify-center;
}

.add-scene-btn,
.close-btn {
  @apply w-8 h-8 lg:w-10 lg:h-10 rounded-full;
  @apply flex items-center justify-center text-sm;
  @apply transition-all;
}

.add-scene-btn {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}

.close-btn {
  @apply bg-aac-card text-aac-muted hover:bg-red-500 hover:text-white;
}

.scene-tooltip {
  @apply absolute top-full left-0 mt-2 px-3 py-2;
  @apply bg-aac-bg text-aac-text text-xs rounded-lg shadow-lg;
  @apply opacity-0 invisible transition-all;
  @apply max-w-xs;
}

.scene-preview:hover .scene-tooltip {
  @apply opacity-100 visible;
}
</style>
