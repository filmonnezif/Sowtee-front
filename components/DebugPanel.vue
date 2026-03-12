<script setup lang="ts">
/**
 * DebugPanel Component
 * Shows reasoning trace and agent state for debugging
 */

import { Search, Brain, Target, BookOpen } from 'lucide-vue-next'

const appStore = useAppStore()

const phaseIcons: Record<string, typeof Search> = {
  perceive: Search,
  reason: Brain,
  act: Target,
  learn: BookOpen,
}
</script>

<template>
  <div
    v-if="appStore.showDebugInfo"
    class="bg-[#1c1c21] rounded-2xl p-5 space-y-4 max-h-80 overflow-y-auto no-scrollbar border border-[#2a2a30]"
  >
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-100">Agent Debug</h3>
      <span :class="['px-2 py-1 rounded-full text-xs flex items-center gap-1', appStore.isProcessing ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400']">
        <component :is="phaseIcons[appStore.currentPhase]" :size="12" />
        {{ appStore.currentPhase.toUpperCase() }}
      </span>
    </div>
    
    <!-- Visual Context -->
    <div v-if="appStore.visualContext">
      <h4 class="text-sm text-gray-400 mb-2">Scene Analysis</h4>
      <p class="text-sm text-gray-200">{{ appStore.visualContext.scene_description }}</p>
      <div class="flex flex-wrap gap-2 mt-2">
        <span
          v-for="obj in appStore.visualContext.detected_objects"
          :key="obj.label"
          class="text-xs px-2 py-1 bg-[#252529] text-gray-300 rounded-full"
        >
          {{ obj.label }} ({{ Math.round(obj.confidence * 100) }}%)
        </span>
      </div>
    </div>
    
    <!-- Reasoning Trace -->
    <div v-if="appStore.reasoningTrace.length">
      <h4 class="text-sm text-gray-400 mb-2">Reasoning Trace</h4>
      <div class="space-y-1 text-xs font-mono">
        <p
          v-for="(line, i) in appStore.reasoningTrace"
          :key="i"
          class="text-gray-300"
        >
          {{ line }}
        </p>
      </div>
    </div>
    
    <!-- Session Info -->
    <div class="pt-4 border-t border-[#2a2a30] text-xs text-gray-500">
      <p>Session: {{ appStore.sessionId || 'None' }}</p>
    </div>
  </div>
</template>
