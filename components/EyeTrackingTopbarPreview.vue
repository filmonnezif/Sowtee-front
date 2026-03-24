<script setup lang="ts">
import { Eye, Loader2 } from 'lucide-vue-next'

const appStore = useAppStore()
const eyeGaze = useEyeGaze()
const route = useRoute()

const previewHostRef = ref<HTMLElement | null>(null)
let attachInterval: number | null = null
let domObserver: MutationObserver | null = null

const isSpeakingRoute = computed(() => route.path === '/speaking')
const isCalibrationRoute = computed(() => route.path === '/calibration')

const shouldShow = computed(() => {
  return (
    appStore.interactionMode === 'eye_gaze' &&
    (isSpeakingRoute.value ||
      (isCalibrationRoute.value &&
        (appStore.eyeGazeCalibrationActive || eyeGaze.state.isImplicitCalibration))) &&
    !eyeGaze.state.useMouseFallback
  )
})

const isReady = computed(() => {
  return eyeGaze.state.webgazerReady && eyeGaze.state.videoFeedActive
})

function setWebgazerPreviewEnabled(enabled: boolean) {
  const webgazer = eyeGaze.getWebGazer()
  if (!webgazer) return

  try {
    if (webgazer.showVideoPreview) {
      webgazer.showVideoPreview(enabled)
    }
    if (webgazer.showFaceOverlay) {
      webgazer.showFaceOverlay(enabled)
    }
    if (webgazer.showFaceFeedbackBox) {
      webgazer.showFaceFeedbackBox(enabled)
    }
    if (webgazer.showPredictionPoints) {
      webgazer.showPredictionPoints(false)
    }
  } catch (error) {
    console.warn('[EyeTrackingTopbarPreview] Could not toggle webgazer preview:', error)
  }
}

function styleWebgazerElement(el: HTMLElement, id: string) {
  el.style.position = 'absolute'
  el.style.top = '0'
  el.style.left = '0'
  el.style.width = '100%'
  el.style.height = '100%'
  el.style.maxWidth = 'none'
  el.style.maxHeight = 'none'
  el.style.margin = '0'
  el.style.pointerEvents = 'none'
  el.style.border = '0'
  el.style.borderRadius = '0.75rem'
  el.style.zIndex = id === 'webgazerVideoFeed' ? '1' : '2'

  if (id === 'webgazerVideoFeed') {
    const videoEl = el as HTMLVideoElement
    videoEl.autoplay = true
    videoEl.muted = true
    videoEl.playsInline = true
    videoEl.style.objectFit = 'cover'
    videoEl.style.transform = 'scaleX(-1)'
  }
}

function attachWebgazerPreview() {
  if (!import.meta.client || !previewHostRef.value || !shouldShow.value) return false

  const host = previewHostRef.value
  const elementIds = ['webgazerVideoFeed', 'webgazerFaceOverlay', 'webgazerFaceFeedbackBox']
  let attachedAny = false

  for (const id of elementIds) {
    const element = document.getElementById(id) as HTMLElement | null
    if (!element) continue

    attachedAny = true
    if (element.parentElement !== host) {
      host.appendChild(element)
    }
    styleWebgazerElement(element, id)
    element.style.display = 'block'
    element.style.visibility = 'visible'
  }

  const gazeDot = document.getElementById('webgazerGazeDot') as HTMLElement | null
  if (gazeDot) {
    gazeDot.style.display = 'none'
  }

  if (attachedAny) {
    eyeGaze.checkVideoFeed()
  }

  return attachedAny
}

function stopAttachLoop() {
  if (attachInterval !== null) {
    window.clearInterval(attachInterval)
    attachInterval = null
  }
}

function startAttachLoop() {
  if (!import.meta.client || !shouldShow.value) return

  stopAttachLoop()
  setWebgazerPreviewEnabled(true)
  attachWebgazerPreview()

  attachInterval = window.setInterval(() => {
    if (!shouldShow.value) {
      stopAttachLoop()
      return
    }

    const attached = attachWebgazerPreview()
    if (attached && eyeGaze.state.videoFeedActive) {
      stopAttachLoop()
    }
  }, 300)
}

watch(
  shouldShow,
  async (active) => {
    if (!import.meta.client) return

    if (active) {
      await nextTick()
      startAttachLoop()
      return
    }

    stopAttachLoop()
    setWebgazerPreviewEnabled(false)
  },
  { immediate: true }
)

onMounted(() => {
  if (!import.meta.client) return

  domObserver = new MutationObserver(() => {
    if (shouldShow.value) {
      attachWebgazerPreview()
    }
  })

  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })

  if (shouldShow.value) {
    startAttachLoop()
  }
})

onUnmounted(() => {
  stopAttachLoop()
  setWebgazerPreviewEnabled(false)
  domObserver?.disconnect()
  domObserver = null
})
</script>

<template>
  <div v-show="shouldShow" class="eye-preview-topbar" aria-live="polite">
    <div class="eye-preview-topbar__label">
      <Eye :size="14" />
      <span>Eye tracking</span>
    </div>

    <div class="eye-preview-topbar__video-shell">
      <div ref="previewHostRef" class="eye-preview-topbar__video-host" />

      <div v-if="!isReady" class="eye-preview-topbar__loading">
        <Loader2 :size="12" class="animate-spin" />
        <span>Connecting camera</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.eye-preview-topbar {
  @apply inline-flex items-center gap-2;
  @apply h-10 px-2.5 rounded-xl;
  @apply border border-aac-surface bg-aac-card/95;
  @apply text-aac-muted;
}

.eye-preview-topbar__label {
  @apply inline-flex items-center gap-1 text-xs font-semibold;
  @apply text-aac-highlight;
}

.eye-preview-topbar__video-shell {
  @apply relative w-48 h-14 rounded-lg overflow-hidden;
  @apply border border-aac-surface;
  background-color: rgb(var(--aac-surface) / 0.8);
}

.eye-preview-topbar__video-host {
  @apply absolute inset-0;
}

.eye-preview-topbar__loading {
  @apply absolute inset-0;
  @apply flex items-center justify-center gap-1;
  @apply text-[10px] text-aac-muted;
  background-color: rgb(var(--aac-bg) / 0.68);
}
</style>
