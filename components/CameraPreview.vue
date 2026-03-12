<script setup lang="ts">
/**
 * CameraPreview Component
 * Displays the camera feed with optional object detection overlay
 */

const props = defineProps<{
  showOverlay?: boolean
  detectedObjects?: Array<{
    label: string
    confidence: number
    bounding_box?: { x: number; y: number; width: number; height: number }
  }>
  purpose?: 'webgazer' | 'scene_capture' // Camera purpose for selection
}>()

const appStore = useAppStore()
const camera = useCamera()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Connect refs to camera composable
watch(videoRef, (el) => camera.setVideoRef(el))
watch(canvasRef, (el) => camera.setCanvasRef(el))

// Watch for camera selection changes and restart camera if needed
watch(
  () => props.purpose,
  async (newPurpose) => {
    if (newPurpose && camera.state.isActive) {
      const cameraId = appStore.getCameraForPurpose(newPurpose)
      await camera.selectCamera(cameraId || '')
    }
  }
)

// Watch for camera ID changes in app store
watch(
  () => [
    props.purpose === 'webgazer' ? appStore.webgazerCameraId : null,
    props.purpose === 'scene_capture' ? appStore.sceneCaptureCameraId : null,
  ],
  async ([cameraId]) => {
    if (props.purpose && cameraId !== camera.state.selectedDeviceId && camera.state.isActive) {
      await camera.selectCamera(cameraId || '')
    }
  }
)

onMounted(async () => {
  // Get the appropriate camera ID based on purpose
  const purpose = props.purpose || 'scene_capture'
  const cameraId = appStore.getCameraForPurpose(purpose)
  
  await camera.startCamera('environment', cameraId || undefined)
})

onUnmounted(() => {
  camera.stopCamera()
})
</script>

<template>
  <div class="camera-preview relative bg-aac-surface">
    <!-- Video element -->
    <video
      ref="videoRef"
      class="w-full h-full object-cover"
      autoplay
      playsinline
      muted
    />
    
    <!-- Hidden canvas for frame capture -->
    <canvas ref="canvasRef" class="hidden" />
    
    <!-- Loading state -->
    <div
      v-if="camera.state.isLoading"
      class="absolute inset-0 flex items-center justify-center bg-aac-bg/80"
    >
      <div class="text-center">
        <div class="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p class="text-aac-muted">Starting camera...</p>
      </div>
    </div>
    
    <!-- Error state -->
    <div
      v-if="camera.state.error"
      class="absolute inset-0 flex items-center justify-center bg-aac-bg/90"
    >
      <div class="text-center p-6">
        <p class="text-red-400 text-lg mb-4">📷 {{ camera.state.error }}</p>
        <button
          class="aac-button"
          @click="camera.startCamera('environment')"
        >
          Retry
        </button>
      </div>
    </div>
    
    <!-- Object detection overlay -->
    <div
      v-if="showOverlay && detectedObjects?.length"
      class="absolute inset-0 pointer-events-none"
    >
      <div
        v-for="(obj, i) in detectedObjects"
        :key="i"
        class="absolute bg-primary-500/20 border-2 border-primary-400 rounded-lg"
        :style="obj.bounding_box ? {
          left: `${obj.bounding_box.x * 100}%`,
          top: `${obj.bounding_box.y * 100}%`,
          width: `${obj.bounding_box.width * 100}%`,
          height: `${obj.bounding_box.height * 100}%`,
        } : {}"
      >
        <span class="absolute -top-6 left-0 text-xs bg-primary-600 px-2 py-1 rounded">
          {{ obj.label }} ({{ Math.round(obj.confidence * 100) }}%)
        </span>
      </div>
    </div>
    
    <!-- Status indicator -->
    <div class="absolute bottom-4 left-4 flex items-center gap-2">
      <div
        :class="[
          'w-3 h-3 rounded-full',
          camera.state.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
        ]"
      />
      <span class="text-sm text-aac-text">
        {{ camera.state.isActive ? 'Camera active' : 'Camera off' }}
      </span>
    </div>
  </div>
</template>
