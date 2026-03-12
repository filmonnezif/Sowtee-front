/**
 * SOWTEE Eye-Gaze Tracking Composable
 * Handles eye-gaze input using WebGazer.js with sticky mouse and blink detection
 * Falls back to mouse simulation for testing when WebGazer fails
 */

export interface GazeState {
  isSupported: boolean
  isCalibrating: boolean
  isTracking: boolean
  isLoading: boolean
  error: string | null
  gazePosition: { x: number; y: number } | null
  smoothedPosition: { x: number; y: number } | null
  focusedElement: Element | null
  dwellTime: number
  dwellThreshold: number // ms before selection
  blinkDetected: boolean
  consecutiveBlinks: number
  useMouseFallback: boolean // Whether using mouse as fallback
  calibrationPoints: number // Number of calibration points clicked
  webgazerReady: boolean // Whether WebGazer is fully initialized
  videoFeedActive: boolean // Whether camera feed is active
  isImplicitCalibration: boolean
  lastUpdate: number
}

export interface GazeTarget {
  element: Element
  enterTime: number
}

// ==================== ADVANCED SMOOTHING CONFIGURATION ====================

// Base smoothing factor for sticky mouse (0-1, higher = faster response/less smoothing)
const SMOOTHING_FACTOR = 0.25

// Minimum movement threshold to update position (prevents jitter)
const JITTER_THRESHOLD = 5

// Outlier rejection threshold - jumps larger than this are smoothed aggressively
const OUTLIER_THRESHOLD = 200

// Smoothing factor when an outlier is detected (slower response)
const OUTLIER_SMOOTHING = 0.1

// Circular buffer size for weighted moving average
const SAMPLE_BUFFER_SIZE = 5

// WebGazer CDN URL with specific version
const WEBGAZER_CDN = 'https://cdn.jsdelivr.net/npm/webgazer@2.1.0/dist/webgazer.min.js'

// Circular buffer for gaze samples (weighted moving average)
interface GazeSample {
  x: number
  y: number
  timestamp: number
}
const gazeSampleBuffer: GazeSample[] = []

const state = reactive<GazeState>({
  isSupported: false,
  isCalibrating: false,
  isTracking: false,
  isLoading: false,
  error: null,
  gazePosition: null,
  smoothedPosition: null, // Internal smoothed value
  focusedElement: null,
  dwellTime: 0, // Time on current element (ms)
  dwellThreshold: 1500, // 1.5 seconds default
  blinkDetected: false,
  consecutiveBlinks: 0,
  useMouseFallback: false, // Whether using mouse as fallback
  calibrationPoints: 0, // Number of calibration points clicked
  webgazerReady: false, // Whether WebGazer is fully initialized
  videoFeedActive: false, // Whether camera feed is active
  isImplicitCalibration: false, // Whether in implicit calibration mode (learning from clicks)
  lastUpdate: 0,
})

// Module-scoped singleton variables
let webgazer: any = null
let currentTarget: GazeTarget | null = null
let dwellTimer: ReturnType<typeof setInterval> | null = null
let lastRawPosition: { x: number; y: number } | null = null
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null

// Callbacks (using refs to allow updates)
const onDwellSelect = ref<((element: Element) => void) | null>(null)
const onBlinkSelect = ref<((element: Element) => void) | null>(null)

/**
 * Load WebGazer.js dynamically from CDN
 */
async function loadWebGazer(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if ((window as any).webgazer) {
    webgazer = (window as any).webgazer
    return true
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = WEBGAZER_CDN
    script.async = true

    script.onload = () => {
      webgazer = (window as any).webgazer
      if (webgazer) {
        state.isSupported = true
        resolve(true)
      } else {
        console.warn('WebGazer loaded but not available, using mouse fallback')
        resolve(false)
      }
    }

    script.onerror = () => {
      console.warn('Failed to load WebGazer, using mouse fallback')
      resolve(false)
    }

    document.head.appendChild(script)
  })
}

/**
 * Initialize mouse fallback for testing
 */
function initMouseFallback() {
  state.useMouseFallback = true
  state.isSupported = true
  state.webgazerReady = true // Consider it "ready" in fallback mode
  console.log('Eye gaze: Using mouse position as fallback for testing')
}

/**
 * Handle gaze position updates from WebGazer
 * Implements weighted moving average with outlier rejection for stability
 */
function handleGazeUpdate(data: { x: number; y: number } | null) {
  if (!data) return

  if (!data) return

  const now = Date.now()
  state.lastUpdate = now

  // Store raw position
  lastRawPosition = { x: data.x, y: data.y }

  // Add to circular buffer
  gazeSampleBuffer.push({ x: data.x, y: data.y, timestamp: now })
  if (gazeSampleBuffer.length > SAMPLE_BUFFER_SIZE) {
    gazeSampleBuffer.shift()
  }

  // Check for outlier (sudden large jump)
  let isOutlier = false
  if (state.smoothedPosition) {
    const dx = data.x - state.smoothedPosition.x
    const dy = data.y - state.smoothedPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    isOutlier = distance > OUTLIER_THRESHOLD
  }

  // Calculate weighted moving average from buffer
  // More recent samples get higher weight
  if (gazeSampleBuffer.length >= 3) {
    let weightedX = 0
    let weightedY = 0
    let totalWeight = 0

    for (let i = 0; i < gazeSampleBuffer.length; i++) {
      // Exponential weighting - newer samples have higher weight
      const recency = (i + 1) / gazeSampleBuffer.length
      const weight = Math.pow(recency, 2) // Quadratic weighting

      weightedX += gazeSampleBuffer[i].x * weight
      weightedY += gazeSampleBuffer[i].y * weight
      totalWeight += weight
    }

    const avgX = weightedX / totalWeight
    const avgY = weightedY / totalWeight

    // Apply smoothing based on whether this is an outlier
    const smoothFactor = isOutlier ? OUTLIER_SMOOTHING : SMOOTHING_FACTOR

    if (state.smoothedPosition) {
      const dx = avgX - state.smoothedPosition.x
      const dy = avgY - state.smoothedPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Only update if movement exceeds jitter threshold
      if (distance > JITTER_THRESHOLD) {
        state.smoothedPosition = {
          x: state.smoothedPosition.x + dx * smoothFactor,
          y: state.smoothedPosition.y + dy * smoothFactor,
        }
      }
    } else {
      state.smoothedPosition = { x: avgX, y: avgY }
    }
  } else if (!state.smoothedPosition) {
    state.smoothedPosition = { x: data.x, y: data.y }
  }

  // Use smoothed position for gaze
  state.gazePosition = state.smoothedPosition

  // Find element at gaze position
  const element = document.elementFromPoint(
    state.smoothedPosition!.x,
    state.smoothedPosition!.y
  )
  updateFocusedElement(element)
}

/**
 * Start mouse tracking as fallback
 */
function startMouseTracking() {
  if (mouseMoveHandler) return

  mouseMoveHandler = (e: MouseEvent) => {
    handleGazeUpdate({ x: e.clientX, y: e.clientY })
  }

  window.addEventListener('mousemove', mouseMoveHandler)
}

/**
 * Stop mouse tracking
 */
function stopMouseTracking() {
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler)
    mouseMoveHandler = null
  }
}

/**
 * Trigger a dwell selection
 */
function triggerDwellSelect(element: Element) {
  // Dispatch custom event
  element.dispatchEvent(new CustomEvent('gaze-select', {
    bubbles: true,
    detail: { dwellTime: state.dwellTime },
  }))

  // Call callback if registered
  if (onDwellSelect.value) {
    onDwellSelect.value(element)
  }
}

/**
 * Start monitoring dwell time for selection
 */
function startDwellMonitor() {
  if (dwellTimer) return

  dwellTimer = setInterval(() => {
    if (currentTarget && state.gazePosition) {
      const dwellTime = Date.now() - currentTarget.enterTime
      state.dwellTime = dwellTime

      if (dwellTime >= state.dwellThreshold) {
        // Trigger selection
        triggerDwellSelect(currentTarget.element)
        // Reset
        currentTarget.enterTime = Date.now()
        state.dwellTime = 0
      }
    } else {
      state.dwellTime = 0
    }
  }, 50) // Update every 50ms
}

/**
 * Stop dwell monitoring
 */
function stopDwellMonitor() {
  if (dwellTimer) {
    clearInterval(dwellTimer)
    dwellTimer = null
  }
}

/**
 * Update the currently focused element for dwell selection
 */
function updateFocusedElement(element: Element | null) {
  // Check if it's a gaze-selectable element
  const selectableElement = element?.closest('[data-gaze-selectable]')

  if (selectableElement !== state.focusedElement) {
    // Focus changed
    state.focusedElement = selectableElement || null
    state.dwellTime = 0

    if (selectableElement) {
      currentTarget = {
        element: selectableElement,
        enterTime: Date.now(),
      }
    } else {
      currentTarget = null
    }
  }
}

export function useEyeGaze() {
  /**
   * Initialize eye-gaze tracking
   */
  async function initialize() {
    if (state.isTracking) return

    state.isLoading = true
    state.error = null

    try {
      const webgazerLoaded = await loadWebGazer()

      if (webgazerLoaded && webgazer) {
        try {
          // Configure WebGazer with CDN paths for models
          webgazer
            .setRegression('ridge')
            .setGazeListener(handleGazeUpdate)
            .showVideoPreview(false)
            .showPredictionPoints(false)
            .applyKalmanFilter(true)

          state.isSupported = true
          state.webgazerReady = true
        } catch (configError) {
          console.warn('WebGazer config failed, using mouse fallback:', configError)
          initMouseFallback()
        }
      } else {
        // Fall back to mouse tracking for testing
        initMouseFallback()
      }
    } catch (err) {
      const error = err as Error
      console.warn('Eye-gaze init error, using mouse fallback:', error)
      initMouseFallback()
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Start eye-gaze tracking (or mouse fallback)
   */
  async function startTracking() {
    if (state.isTracking) return

    if (!state.isSupported) {
      await initialize()
    }

    try {
      if (state.useMouseFallback) {
        // Use mouse position as gaze position for testing
        startMouseTracking()
        state.isTracking = true
        startDwellMonitor()
      } else if (webgazer) {
        await webgazer.begin()
        state.isTracking = true
        startDwellMonitor()
      } else {
        // Fallback to mouse if webgazer failed
        initMouseFallback()
        startMouseTracking()
        state.isTracking = true
        startDwellMonitor()
      }
    } catch (err) {
      const error = err as Error
      console.warn('WebGazer start failed, using mouse fallback:', error)
      // Fallback to mouse tracking
      initMouseFallback()
      startMouseTracking()
      state.isTracking = true
      startDwellMonitor()
    }
  }

  /**
   * Stop eye-gaze tracking
   */
  function stopTracking() {
    if (state.useMouseFallback) {
      stopMouseTracking()
    } else if (webgazer && state.isTracking) {
      try {
        webgazer.end()
      } catch (e) {
        console.warn('Error stopping webgazer:', e)
      }
    }

    state.isTracking = false
    state.gazePosition = null
    state.smoothedPosition = null
    stopDwellMonitor()
  }

  /**
   * Start calibration mode
   */
  function startCalibration() {
    state.isCalibrating = true
    state.calibrationPoints = 0

    if (webgazer) {
      // Clear previous calibration data for a fresh start
      try {
        if (webgazer.clearData) {
          webgazer.clearData()
          console.log('[EyeGaze] Cleared previous calibration data')
        }
      } catch (e) {
        console.warn('Could not clear webgazer data:', e)
      }

      // Show WebGazer's video preview during calibration
      try {
        webgazer.showVideoPreview(true)
        webgazer.showPredictionPoints(true)
        state.videoFeedActive = true
      } catch (e) {
        console.warn('Could not show video preview:', e)
      }
    }
  }

  /**
   * End calibration mode
   */
  function endCalibration() {
    state.isCalibrating = false

    if (webgazer) {
      // Hide video preview after calibration
      try {
        webgazer.showVideoPreview(false)
        webgazer.showPredictionPoints(false)
      } catch (e) {
        console.warn('Could not hide video preview:', e)
      }
    }

  }

  /**
   * Start implicit calibration mode
   * In this mode, we track gaze but don't show video, and we learn from user clicks
   */
  function startImplicitCalibration() {
    state.isImplicitCalibration = true
    state.calibrationPoints = 0
    state.isCalibrating = true // reuse isCalibrating for some logic if needed, or keep separate

    if (webgazer) {
      // Clear previous data? Maybe yes, to start fresh
      try {
        if (webgazer.clearData) {
          webgazer.clearData()
        }
      } catch (e) {
        console.warn('Could not clear webgazer data:', e)
      }
    }
  }

  /**
   * Stop implicit calibration mode
   */
  function stopImplicitCalibration() {
    state.isImplicitCalibration = false
    state.isCalibrating = false
  }

  /**
   * Record a calibration click at a specific position
   */
  function recordCalibrationClick(x: number, y: number) {
    if (webgazer && state.isCalibrating) {
      try {
        // WebGazer records clicks automatically, but we can also manually record
        webgazer.recordScreenPosition(x, y, 'click')
        state.calibrationPoints++
      } catch (e) {
        console.warn('Could not record calibration point:', e)
        // Still increment for UI feedback
        state.calibrationPoints++
      }
    } else {
      // For mouse fallback, just count clicks
      state.calibrationPoints++
    }
  }

  /**
   * Check if WebGazer has video feed
   */
  function checkVideoFeed(): boolean {
    if (webgazer) {
      try {
        const video = webgazer.getVideoElement()
        if (video && video.srcObject) {
          state.videoFeedActive = true
          return true
        }
      } catch (e) {
        console.warn('Could not check video feed:', e)
      }
    }
    state.videoFeedActive = false
    return false
  }

  /**
   * Get WebGazer instance for advanced usage
   */
  function getWebGazer() {
    return webgazer
  }

  /**
   * Set the dwell threshold
   */
  function setDwellThreshold(ms: number) {
    state.dwellThreshold = Math.max(500, Math.min(ms, 5000))
  }

  /**
   * Register a callback for dwell selection
   */
  function onSelect(callback: (element: Element) => void) {
    onDwellSelect.value = callback
  }

  /**
   * Register a callback for blink selection
   */
  function onBlink(callback: (element: Element) => void) {
    onBlinkSelect.value = callback
  }

  /**
   * Simulate blink detection (can be triggered externally or via keyboard)
   */
  function triggerBlink() {
    state.blinkDetected = true
    state.consecutiveBlinks++

    // If focused on an element, trigger selection
    if (state.focusedElement) {
      if (onBlinkSelect.value) {
        onBlinkSelect.value(state.focusedElement)
      }
      triggerDwellSelect(state.focusedElement)
    }

    // Reset blink state after short delay
    setTimeout(() => {
      state.blinkDetected = false
    }, 200)

    // Reset consecutive blink counter after 1 second of no blinks
    setTimeout(() => {
      state.consecutiveBlinks = 0
    }, 1000)
  }

  /**
   * Reset smoothed position (useful when overlay opens)
   */
  function resetSmoothing() {
    state.smoothedPosition = null
    lastRawPosition = null
  }

  /**
   * Get dwell progress (0-1)
   */
  const dwellProgress = computed(() => {
    if (!currentTarget || state.dwellTime === 0) return 0
    return Math.min(state.dwellTime / state.dwellThreshold, 1)
  })

  // Cleanup on unmount - NO, this is a singleton now, shouldn't stop on unmount of consumer!
  // But we might want to stop if NO components are using it?
  // For now, let's leave cleanup manual via stopTracking
  // onUnmounted(() => {
  //   stopTracking()
  //   stopMouseTracking()
  //   stopDwellMonitor()
  // })

  return {
    state: readonly(state),
    dwellProgress,
    initialize,
    startTracking,
    stopTracking,
    startCalibration,
    endCalibration,
    startImplicitCalibration,
    stopImplicitCalibration,
    recordCalibrationClick,
    checkVideoFeed,
    getWebGazer,
    setDwellThreshold,
    onSelect,
    onBlink,
    triggerBlink,
    resetSmoothing,
  }
}
