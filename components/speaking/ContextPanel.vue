<script setup lang="ts">
/**
 * SOWTEE Context Panel Component
 * Displays scene context and conversation history.
 */

interface ConversationTurn {
  speaker: 'user' | 'other'
  text: string
}

interface Props {
  sceneImage?: string | null
  sceneDescription?: string | null
  conversationHistory: ConversationTurn[]
  isListening?: boolean
  canCapture?: boolean
  currentTranscript?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  sceneImage: null,
  sceneDescription: null,
  conversationHistory: () => [],
  isListening: false,
  canCapture: false,
  currentTranscript: null,
})

const emit = defineEmits<{
  (e: 'capture'): void
}>()

// Get last 6 conversation turns for better context
const recentConversation = computed(() => {
  return props.conversationHistory.slice(-6)
})

const hasContext = computed(() => {
  return props.sceneImage || props.sceneDescription || recentConversation.value.length > 0 || props.canCapture
})
</script>

<template>
  <div v-if="hasContext" class="context-panel">
    <!-- Scene Preview -->
    <div v-if="sceneImage || sceneDescription || canCapture" class="context-panel__scene">
      <div class="context-panel__scene-content">
        <div v-if="sceneImage" class="relative group">
          <img 
            :src="sceneImage"
            alt="Current scene"
            class="context-panel__scene-image"
          />
          <!-- Retake button -->
          <button 
            v-if="canCapture"
            class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            @click="$emit('capture')"
            title="Retake photo"
          >
            <span class="text-white text-lg">📷</span>
          </button>
        </div>
        
        <button 
          v-else-if="canCapture" 
          class="context-panel__scene-placeholder hover:bg-aac-card/80 transition-colors"
          @click="$emit('capture')"
          title="Capture scene"
        >
          <span class="text-2xl">📷</span>
        </button>
        
        <div v-else class="context-panel__scene-placeholder">
          <span class="text-2xl">🖼️</span>
        </div>
        
        <p v-if="sceneDescription" class="context-panel__scene-text">
          {{ sceneDescription }}
        </p>
      </div>
    </div>
    
    <!-- Conversation History - Transcribed Text -->
    <div v-if="recentConversation.length > 0 || isListening" class="context-panel__conversation">
      <div class="context-panel__conversation-header">
        <span class="context-panel__conversation-title">💬 Surrounding Conversation</span>
        <span v-if="isListening" class="context-panel__listening-inline">
          <span class="context-panel__listening-dot" />
          Listening
        </span>
      </div>
      
      <!-- Real-time transcript (what's being heard right now) -->
      <div v-if="currentTranscript" class="context-panel__current-transcript">
        <span class="context-panel__current-label">👂 Hearing:</span>
        <span class="context-panel__current-text">{{ currentTranscript }}</span>
      </div>
      
      <div v-if="recentConversation.length > 0" class="context-panel__conversation-list">
        <div 
          v-for="(turn, index) in recentConversation"
          :key="index"
          class="context-panel__turn"
          :class="[
            `context-panel__turn--${turn.speaker}`,
            { 'context-panel__turn--latest': index === recentConversation.length - 1 }
          ]"
        >
          <span class="context-panel__speaker">
            {{ turn.speaker === 'user' ? '🗣️ You said' : '👂 Heard' }}:
          </span>
          <span class="context-panel__text">{{ turn.text }}</span>
        </div>
      </div>
      
      <!-- Show placeholder when listening but no history yet -->
      <div v-else-if="isListening && !currentTranscript" class="context-panel__empty">
        <span class="text-aac-muted text-xs">Waiting for speech...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-panel {
  @apply flex items-start gap-4;
  @apply bg-aac-surface/90 backdrop-blur-sm;
  @apply rounded-xl px-4 py-3;
  @apply border border-aac-card;
  @apply max-w-2xl;
}

.context-panel__scene {
  @apply flex-shrink-0;
}

.context-panel__scene-content {
  @apply flex flex-col items-center gap-1;
}

.context-panel__scene-image {
  @apply w-16 h-16 rounded-lg object-cover;
  @apply border-2 border-aac-card;
}

.context-panel__scene-placeholder {
  @apply w-16 h-16 rounded-lg;
  @apply bg-aac-card;
  @apply flex items-center justify-center;
  @apply cursor-pointer;
}

.context-panel__scene-text {
  @apply text-xs text-aac-muted text-center;
  @apply max-w-20 line-clamp-2;
}

.context-panel__conversation {
  @apply flex flex-col gap-1;
  @apply flex-1 min-w-0;
}

.context-panel__conversation-header {
  @apply flex items-center justify-between gap-2;
  @apply mb-1;
}

.context-panel__conversation-title {
  @apply text-xs font-semibold text-aac-text;
}

.context-panel__listening-inline {
  @apply flex items-center gap-1;
  @apply text-xs text-green-400;
}

.context-panel__current-transcript {
  @apply flex items-center gap-1;
  @apply text-sm text-green-400;
  @apply bg-green-500/10 rounded px-2 py-1 mb-1;
  @apply animate-pulse;
}

.context-panel__current-label {
  @apply text-xs opacity-75;
}

.context-panel__current-text {
  @apply italic;
}

.context-panel__empty {
  @apply py-2;
}

.context-panel__conversation-list {
  @apply flex flex-col gap-1;
  @apply max-h-24 overflow-y-auto;
  @apply pr-1;
}

.context-panel__turn {
  @apply text-sm leading-tight;
  @apply py-0.5;
}

.context-panel__turn--user {
  @apply text-primary-400;
}

.context-panel__turn--other {
  @apply text-aac-text;
}

.context-panel__turn--latest {
  @apply font-medium;
  @apply bg-aac-card/50 rounded px-1 -mx-1;
}

.context-panel__speaker {
  @apply text-xs opacity-75 mr-1;
}

.context-panel__text {
  @apply break-words;
}

.context-panel__listening {
  @apply flex items-center gap-2;
  @apply py-2;
}

.context-panel__listening-dot {
  @apply w-2 h-2 rounded-full bg-green-500;
  animation: pulse 1.5s infinite;
}

.context-panel__listening-text {
  @apply text-sm text-green-400;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Custom scrollbar for conversation list */
.context-panel__conversation-list::-webkit-scrollbar {
  width: 4px;
}

.context-panel__conversation-list::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.context-panel__conversation-list::-webkit-scrollbar-thumb {
  @apply bg-aac-card rounded-full;
}
</style>
