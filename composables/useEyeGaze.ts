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

// Base smoothing factor for stable conditions (0-1, higher = faster response)
const BASE_SMOOTHING_FACTOR = 0.34

// Smoothing factor when signal is noisy (darker room / weaker webcam signal)
const NOISY_SMOOTHING_FACTOR = 0.2

// Smoothing factor when outlier jump is detected
const OUTLIER_SMOOTHING_FACTOR = 0.12

// Minimum interval between filtered output updates (ms)
const MIN_FILTER_INTERVAL_MS = 12

// Minimum movement threshold to update position (prevents jitter)
const BASE_JITTER_THRESHOLD = 2.2

// Outlier rejection threshold - jumps larger than this are smoothed aggressively
const OUTLIER_THRESHOLD = 160

// Max cursor speed (px/s) to enforce deliberate movement
const MAX_CURSOR_SPEED_STABLE = 1700
const MAX_CURSOR_SPEED_NOISY = 800

// Dynamic noise normalization reference (px spread)
const NOISE_REFERENCE_SPREAD = 26

// Blend between robust median and weighted moving average
const MEDIAN_BLEND = 0.55
const WEIGHTED_BLEND = 0.45

// Circular buffer size for weighted moving average
const SAMPLE_BUFFER_SIZE = 6

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
let lastFilteredUpdate = 0
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
 * Implements robust aggregated filtering:
 * - weighted moving average + median blend
 * - adaptive smoothing for noisy environments
 * - deliberate movement rate limiting
 */
function handleGazeUpdate(data: { x: number; y: number } | null) {
  if (!data) return

  const now = Date.now()
  state.lastUpdate = now

  // Throttle filtering updates slightly to prevent micro-oscillation
  if (now - lastFilteredUpdate < MIN_FILTER_INTERVAL_MS) {
    return
  }

  // Store raw position
  lastRawPosition = { x: data.x, y: data.y }

  // Add to circular buffer
  gazeSampleBuffer.push({ x: data.x, y: data.y, timestamp: now })
  if (gazeSampleBuffer.length > SAMPLE_BUFFER_SIZE) {
    gazeSampleBuffer.shift()
  }

  // Need enough samples for robust aggregate
  if (gazeSampleBuffer.length < 3 && !state.smoothedPosition) {
    state.smoothedPosition = { x: data.x, y: data.y }
    state.gazePosition = state.smoothedPosition
    lastFilteredUpdate = now
    const initElement = document.elementFromPoint(data.x, data.y)
    updateFocusedElement(initElement)
    return
  }

  // --- Robust aggregate: median + weighted average ---
  const xValues = gazeSampleBuffer.map(s => s.x).sort((a, b) => a - b)
  const yValues = gazeSampleBuffer.map(s => s.y).sort((a, b) => a - b)
  const mid = Math.floor(gazeSampleBuffer.length / 2)

  const medianX = gazeSampleBuffer.length % 2 === 0
    ? (xValues[mid - 1] + xValues[mid]) / 2
    : xValues[mid]
  const medianY = gazeSampleBuffer.length % 2 === 0
    ? (yValues[mid - 1] + yValues[mid]) / 2
    : yValues[mid]

  let weightedX = 0
  let weightedY = 0
  let totalWeight = 0

  for (let i = 0; i < gazeSampleBuffer.length; i++) {
    const recency = (i + 1) / gazeSampleBuffer.length
    const weight = Math.pow(recency, 2.2)
    weightedX += gazeSampleBuffer[i].x * weight
    weightedY += gazeSampleBuffer[i].y * weight
    totalWeight += weight
  }

  const avgX = weightedX / totalWeight
  const avgY = weightedY / totalWeight

  const aggregatedX = medianX * MEDIAN_BLEND + avgX * WEIGHTED_BLEND
  const aggregatedY = medianY * MEDIAN_BLEND + avgY * WEIGHTED_BLEND

  // Measure noise level from spread around robust median
  let spreadAccum = 0
  for (const sample of gazeSampleBuffer) {
    const dx = sample.x - medianX
    const dy = sample.y - medianY
    spreadAccum += Math.sqrt(dx * dx + dy * dy)
  }
  const avgSpread = spreadAccum / gazeSampleBuffer.length
  const noiseLevel = Math.max(0, Math.min(1, avgSpread / NOISE_REFERENCE_SPREAD))

  // Dynamic jitter threshold: larger when noisy
  const jitterThreshold = BASE_JITTER_THRESHOLD + noiseLevel * 6

  // Check for outlier (sudden large jump)
  let isOutlier = false
  if (state.smoothedPosition) {
    const dx = aggregatedX - state.smoothedPosition.x
    const dy = aggregatedY - state.smoothedPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    isOutlier = distance > OUTLIER_THRESHOLD
  }

  if (state.smoothedPosition) {
    const dx = aggregatedX - state.smoothedPosition.x
    const dy = aggregatedY - state.smoothedPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > jitterThreshold) {
      const adaptiveSmooth = NOISY_SMOOTHING_FACTOR + (1 - noiseLevel) * (BASE_SMOOTHING_FACTOR - NOISY_SMOOTHING_FACTOR)
      const smoothFactor = isOutlier ? Math.min(adaptiveSmooth, OUTLIER_SMOOTHING_FACTOR) : adaptiveSmooth

      // Movement speed cap: noisier signal => slower allowed cursor movement
      const dt = Math.max(16, now - lastFilteredUpdate)
      const maxSpeed = MAX_CURSOR_SPEED_NOISY + (1 - noiseLevel) * (MAX_CURSOR_SPEED_STABLE - MAX_CURSOR_SPEED_NOISY)
      const maxStep = (maxSpeed * dt) / 1000

      const desiredStep = distance * smoothFactor
      const clampedStep = Math.min(desiredStep, maxStep)
      const stepScale = clampedStep / distance

      state.smoothedPosition = {
        x: state.smoothedPosition.x + dx * stepScale,
        y: state.smoothedPosition.y + dy * stepScale,
      }
    }
  } else {
    state.smoothedPosition = { x: aggregatedX, y: aggregatedY }
  }

  // Keep output in viewport bounds
  if (state.smoothedPosition) {
    const maxX = Math.max(0, window.innerWidth - 1)
    const maxY = Math.max(0, window.innerHeight - 1)
    state.smoothedPosition.x = Math.max(0, Math.min(maxX, state.smoothedPosition.x))
    state.smoothedPosition.y = Math.max(0, Math.min(maxY, state.smoothedPosition.y))
  }

  // Use smoothed position for gaze
  state.gazePosition = state.smoothedPosition
  lastFilteredUpdate = now

  // Find element at gaze position
  if (state.smoothedPosition) {
    const element = document.elementFromPoint(
      state.smoothedPosition.x,
      state.smoothedPosition.y
    )
    updateFocusedElement(element)
  }
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
    gazeSampleBuffer.length = 0
    lastFilteredUpdate = 0
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

      try {
        if (webgazer.showVideoPreview) {
          webgazer.showVideoPreview(true)
        }
        if (webgazer.showFaceOverlay) {
          webgazer.showFaceOverlay(true)
        }
        if (webgazer.showFaceFeedbackBox) {
          webgazer.showFaceFeedbackBox(true)
        }
        if (webgazer.showPredictionPoints) {
          webgazer.showPredictionPoints(false)
        }
        state.videoFeedActive = true
      } catch (e) {
        console.warn('Could not enable implicit calibration preview:', e)
      }
    }
  }

  /**
   * Stop implicit calibration mode
   */
  function stopImplicitCalibration() {
    state.isImplicitCalibration = false
    state.isCalibrating = false

    if (webgazer) {
      try {
        if (webgazer.showVideoPreview) {
          webgazer.showVideoPreview(false)
        }
        if (webgazer.showFaceOverlay) {
          webgazer.showFaceOverlay(false)
        }
        if (webgazer.showFaceFeedbackBox) {
          webgazer.showFaceFeedbackBox(false)
        }
      } catch (e) {
        console.warn('Could not disable implicit calibration preview:', e)
      }
    }

    state.videoFeedActive = false
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
    gazeSampleBuffer.length = 0
    lastFilteredUpdate = 0
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
