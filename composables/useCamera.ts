/**
 * SOWTEE Camera Composable
 * Handles camera access and frame capture
 */

export interface CameraDevice {
  deviceId: string
  label: string
  kind: 'videoinput'
}

export interface CameraState {
  isActive: boolean
  isLoading: boolean
  error: string | null
  stream: MediaStream | null
  availableDevices: CameraDevice[]
  selectedDeviceId: string | null
}

export function useCamera() {
  const state = reactive<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    availableDevices: [],
    selectedDeviceId: null,
  })

  const videoRef = ref<HTMLVideoElement | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  /**
   * Get available camera devices
   */
  async function getAvailableDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'videoinput'
        }))
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
      return []
    }
  }

  /**
   * Refresh available devices list
   */
  async function refreshDevices() {
    state.availableDevices = await getAvailableDevices()
  }

  /**
   * Start the camera
   */
  async function startCamera(facingMode: 'user' | 'environment' = 'environment', deviceId?: string) {
    if (state.isActive) return

    state.isLoading = true
    state.error = null

    try {
      // First, refresh devices to get current list
      await refreshDevices()
      
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }

      // Use specific device ID if provided, otherwise use facing mode
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId }
        state.selectedDeviceId = deviceId
      } else {
        videoConstraints.facingMode = facingMode
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      state.stream = stream
      state.isActive = true

      // Attach to video element if available
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        await videoRef.value.play()
      }
    } catch (err) {
      const error = err as Error
      state.error = `Camera access failed: ${error.message}`
      console.error('Camera error:', error)
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Select a specific camera device
   */
  async function selectCamera(deviceId: string) {
    if (state.isActive) {
      stopCamera()
    }
    await startCamera('environment', deviceId)
  }

  /**
   * Stop the camera
   */
  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop())
      state.stream = null
    }
    state.isActive = false
    state.selectedDeviceId = null

    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
  }

  /**
   * Capture a frame as base64
   */
  function captureFrame(): string | null {
    if (!videoRef.value || !canvasRef.value) {
      console.warn('Video or canvas ref not available')
      return null
    }

    const video = videoRef.value
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current frame
    ctx.drawImage(video, 0, 0)

    // Return as base64 (JPEG for smaller size)
    return canvas.toDataURL('image/jpeg', 0.8)
  }

  /**
   * Set the video element ref
   */
  function setVideoRef(el: HTMLVideoElement | null) {
    videoRef.value = el
    if (el && state.stream) {
      el.srcObject = state.stream
    }
  }

  /**
   * Set the canvas element ref
   */
  function setCanvasRef(el: HTMLCanvasElement | null) {
    canvasRef.value = el
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopCamera()
  })

  return {
    state: readonly(state),
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    selectCamera,
    captureFrame,
    setVideoRef,
    setCanvasRef,
    refreshDevices,
    getAvailableDevices,
  }
}
