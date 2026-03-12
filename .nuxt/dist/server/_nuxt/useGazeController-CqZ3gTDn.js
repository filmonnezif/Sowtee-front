import { reactive, ref, readonly, computed } from "vue";
import { a as useAppStore } from "../server.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/hookable/dist/index.mjs";
function useCamera() {
  const state2 = reactive({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    availableDevices: [],
    selectedDeviceId: null
  });
  const videoRef = ref(null);
  const canvasRef = ref(null);
  async function getAvailableDevices() {
    try {
      const devices = await (void 0).mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "videoinput").map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        kind: device.kind
      }));
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
      return [];
    }
  }
  async function refreshDevices() {
    state2.availableDevices = await getAvailableDevices();
  }
  async function startCamera(facingMode = "environment", deviceId) {
    if (state2.isActive) return;
    state2.isLoading = true;
    state2.error = null;
    try {
      await refreshDevices();
      const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
        state2.selectedDeviceId = deviceId;
      } else {
        videoConstraints.facingMode = facingMode;
      }
      const constraints = {
        video: videoConstraints,
        audio: false
      };
      const stream = await (void 0).mediaDevices.getUserMedia(constraints);
      state2.stream = stream;
      state2.isActive = true;
      if (videoRef.value) {
        videoRef.value.srcObject = stream;
        await videoRef.value.play();
      }
    } catch (err) {
      const error = err;
      state2.error = `Camera access failed: ${error.message}`;
      console.error("Camera error:", error);
    } finally {
      state2.isLoading = false;
    }
  }
  async function selectCamera(deviceId) {
    if (state2.isActive) {
      stopCamera();
    }
    await startCamera("environment", deviceId);
  }
  function stopCamera() {
    if (state2.stream) {
      state2.stream.getTracks().forEach((track) => track.stop());
      state2.stream = null;
    }
    state2.isActive = false;
    state2.selectedDeviceId = null;
    if (videoRef.value) {
      videoRef.value.srcObject = null;
    }
  }
  function captureFrame() {
    if (!videoRef.value || !canvasRef.value) {
      console.warn("Video or canvas ref not available");
      return null;
    }
    const video = videoRef.value;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8);
  }
  function setVideoRef(el) {
    videoRef.value = el;
    if (el && state2.stream) {
      el.srcObject = state2.stream;
    }
  }
  function setCanvasRef(el) {
    canvasRef.value = el;
  }
  return {
    state: readonly(state2),
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    selectCamera,
    captureFrame,
    setVideoRef,
    setCanvasRef,
    refreshDevices,
    getAvailableDevices
  };
}
const intervalError = "[nuxt] `setInterval` should not be used on the server. Consider wrapping it with an `onNuxtReady`, `onBeforeMount` or `onMounted` lifecycle hook, or ensure you only call it in the browser by checking `false`.";
const setInterval = (() => {
  console.error(intervalError);
});
const SMOOTHING_FACTOR = 0.25;
const JITTER_THRESHOLD = 5;
const OUTLIER_THRESHOLD = 200;
const OUTLIER_SMOOTHING = 0.1;
const SAMPLE_BUFFER_SIZE = 5;
const gazeSampleBuffer = [];
const state$1 = reactive({
  isSupported: false,
  isCalibrating: false,
  isTracking: false,
  isLoading: false,
  error: null,
  gazePosition: null,
  smoothedPosition: null,
  // Internal smoothed value
  focusedElement: null,
  dwellTime: 0,
  // Time on current element (ms)
  dwellThreshold: 1500,
  // 1.5 seconds default
  blinkDetected: false,
  consecutiveBlinks: 0,
  useMouseFallback: false,
  // Whether using mouse as fallback
  calibrationPoints: 0,
  // Number of calibration points clicked
  webgazerReady: false,
  // Whether WebGazer is fully initialized
  videoFeedActive: false,
  // Whether camera feed is active
  isImplicitCalibration: false,
  // Whether in implicit calibration mode (learning from clicks)
  lastUpdate: 0
});
let webgazer = null;
let currentTarget = null;
let dwellTimer = null;
let mouseMoveHandler = null;
const onDwellSelect = ref(null);
const onBlinkSelect = ref(null);
async function loadWebGazer() {
  return false;
}
function initMouseFallback() {
  state$1.useMouseFallback = true;
  state$1.isSupported = true;
  state$1.webgazerReady = true;
  console.log("Eye gaze: Using mouse position as fallback for testing");
}
function handleGazeUpdate(data) {
  if (!data) return;
  if (!data) return;
  const now = Date.now();
  state$1.lastUpdate = now;
  ({ x: data.x, y: data.y });
  gazeSampleBuffer.push({ x: data.x, y: data.y, timestamp: now });
  if (gazeSampleBuffer.length > SAMPLE_BUFFER_SIZE) {
    gazeSampleBuffer.shift();
  }
  let isOutlier = false;
  if (state$1.smoothedPosition) {
    const dx = data.x - state$1.smoothedPosition.x;
    const dy = data.y - state$1.smoothedPosition.y;
    const distance2 = Math.sqrt(dx * dx + dy * dy);
    isOutlier = distance2 > OUTLIER_THRESHOLD;
  }
  if (gazeSampleBuffer.length >= 3) {
    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    for (let i = 0; i < gazeSampleBuffer.length; i++) {
      const recency = (i + 1) / gazeSampleBuffer.length;
      const weight = Math.pow(recency, 2);
      weightedX += gazeSampleBuffer[i].x * weight;
      weightedY += gazeSampleBuffer[i].y * weight;
      totalWeight += weight;
    }
    const avgX = weightedX / totalWeight;
    const avgY = weightedY / totalWeight;
    const smoothFactor = isOutlier ? OUTLIER_SMOOTHING : SMOOTHING_FACTOR;
    if (state$1.smoothedPosition) {
      const dx = avgX - state$1.smoothedPosition.x;
      const dy = avgY - state$1.smoothedPosition.y;
      const distance2 = Math.sqrt(dx * dx + dy * dy);
      if (distance2 > JITTER_THRESHOLD) {
        state$1.smoothedPosition = {
          x: state$1.smoothedPosition.x + dx * smoothFactor,
          y: state$1.smoothedPosition.y + dy * smoothFactor
        };
      }
    } else {
      state$1.smoothedPosition = { x: avgX, y: avgY };
    }
  } else if (!state$1.smoothedPosition) {
    state$1.smoothedPosition = { x: data.x, y: data.y };
  }
  state$1.gazePosition = state$1.smoothedPosition;
  const element = (void 0).elementFromPoint(
    state$1.smoothedPosition.x,
    state$1.smoothedPosition.y
  );
  updateFocusedElement(element);
}
function startMouseTracking() {
  if (mouseMoveHandler) return;
  mouseMoveHandler = (e) => {
    handleGazeUpdate({ x: e.clientX, y: e.clientY });
  };
  (void 0).addEventListener("mousemove", mouseMoveHandler);
}
function stopMouseTracking() {
  if (mouseMoveHandler) {
    (void 0).removeEventListener("mousemove", mouseMoveHandler);
    mouseMoveHandler = null;
  }
}
function triggerDwellSelect(element) {
  element.dispatchEvent(new CustomEvent("gaze-select", {
    bubbles: true,
    detail: { dwellTime: state$1.dwellTime }
  }));
  if (onDwellSelect.value) {
    onDwellSelect.value(element);
  }
}
function startDwellMonitor() {
  if (dwellTimer) return;
  dwellTimer = setInterval();
}
function stopDwellMonitor() {
  if (dwellTimer) {
    clearInterval(dwellTimer);
    dwellTimer = null;
  }
}
function updateFocusedElement(element) {
  const selectableElement = element?.closest("[data-gaze-selectable]");
  if (selectableElement !== state$1.focusedElement) {
    state$1.focusedElement = selectableElement || null;
    state$1.dwellTime = 0;
    if (selectableElement) {
      currentTarget = {
        element: selectableElement,
        enterTime: Date.now()
      };
    } else {
      currentTarget = null;
    }
  }
}
function useEyeGaze() {
  async function initialize() {
    if (state$1.isTracking) return;
    state$1.isLoading = true;
    state$1.error = null;
    try {
      const webgazerLoaded = await loadWebGazer();
      if (webgazerLoaded && webgazer) ;
      else {
        initMouseFallback();
      }
    } catch (err) {
      const error = err;
      console.warn("Eye-gaze init error, using mouse fallback:", error);
      initMouseFallback();
    } finally {
      state$1.isLoading = false;
    }
  }
  async function startTracking() {
    if (state$1.isTracking) return;
    if (!state$1.isSupported) {
      await initialize();
    }
    try {
      if (state$1.useMouseFallback) {
        startMouseTracking();
        state$1.isTracking = true;
        startDwellMonitor();
      } else if (webgazer) ;
      else {
        initMouseFallback();
        startMouseTracking();
        state$1.isTracking = true;
        startDwellMonitor();
      }
    } catch (err) {
      const error = err;
      console.warn("WebGazer start failed, using mouse fallback:", error);
      initMouseFallback();
      startMouseTracking();
      state$1.isTracking = true;
      startDwellMonitor();
    }
  }
  function stopTracking() {
    if (state$1.useMouseFallback) {
      stopMouseTracking();
    }
    state$1.isTracking = false;
    state$1.gazePosition = null;
    state$1.smoothedPosition = null;
    stopDwellMonitor();
  }
  function startCalibration() {
    state$1.isCalibrating = true;
    state$1.calibrationPoints = 0;
  }
  function endCalibration() {
    state$1.isCalibrating = false;
  }
  function startImplicitCalibration() {
    state$1.isImplicitCalibration = true;
    state$1.calibrationPoints = 0;
    state$1.isCalibrating = true;
  }
  function stopImplicitCalibration() {
    state$1.isImplicitCalibration = false;
    state$1.isCalibrating = false;
  }
  function recordCalibrationClick(x, y) {
    {
      state$1.calibrationPoints++;
    }
  }
  function checkVideoFeed() {
    state$1.videoFeedActive = false;
    return false;
  }
  function getWebGazer() {
    return webgazer;
  }
  function setDwellThreshold(ms) {
    state$1.dwellThreshold = Math.max(500, Math.min(ms, 5e3));
  }
  function onSelect(callback) {
    onDwellSelect.value = callback;
  }
  function onBlink(callback) {
    onBlinkSelect.value = callback;
  }
  function triggerBlink() {
    state$1.blinkDetected = true;
    state$1.consecutiveBlinks++;
    if (state$1.focusedElement) {
      if (onBlinkSelect.value) {
        onBlinkSelect.value(state$1.focusedElement);
      }
      triggerDwellSelect(state$1.focusedElement);
    }
    setTimeout(() => {
      state$1.blinkDetected = false;
    }, 200);
    setTimeout(() => {
      state$1.consecutiveBlinks = 0;
    }, 1e3);
  }
  function resetSmoothing() {
    state$1.smoothedPosition = null;
  }
  const dwellProgress = computed(() => {
    if (!currentTarget || state$1.dwellTime === 0) return 0;
    return Math.min(state$1.dwellTime / state$1.dwellThreshold, 1);
  });
  return {
    state: readonly(state$1),
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
    resetSmoothing
  };
}
const BASE_PADDING = 120;
const MIN_PADDING = 40;
const MAX_PADDING = 200;
const SIZE_INFLUENCE_FACTOR = 0.5;
const REFERENCE_SIZE = 200;
const MIN_DWELL_BEFORE_SWITCH = 300;
const SWITCH_CONFIDENCE_THRESHOLD = 0.6;
const FAR_DISTANCE_MULTIPLIER = 2.2;
const SUSTAINED_AWAY_TIME = 300;
const LOCK_SMOOTHING = 0.7;
const FREE_CURSOR_SMOOTHING = 0.6;
const VELOCITY_SMOOTHING = 0.8;
const PREDICTION_FACTOR = 8;
const RECENCY_DECAY = 2e3;
const SELECTION_WEIGHT_BOOST = 0.01;
const MAX_SELECTION_BONUS = 0.05;
const LETTER_FREQUENCY = {
  "e": 0.127,
  "t": 0.091,
  "a": 0.082,
  "o": 0.075,
  "i": 0.07,
  "n": 0.067,
  "s": 0.063,
  "h": 0.061,
  "r": 0.06,
  "d": 0.043,
  "l": 0.04,
  "c": 0.028,
  "u": 0.028,
  "m": 0.024,
  "w": 0.024,
  "f": 0.022,
  "g": 0.02,
  "y": 0.02,
  "p": 0.019,
  "b": 0.015,
  "v": 0.01,
  "k": 8e-3,
  "j": 2e-3,
  "x": 2e-3,
  "q": 1e-3,
  "z": 1e-3
};
const CARD_LETTERS = {
  "card-0": ["a", "b", "c", "d", "e"],
  // Contains E (most common)
  "card-1": ["f", "g", "h", "i", "j"],
  // Contains I, H
  "card-2": ["k", "l", "m", "n", "o"],
  // Contains O, N
  "card-3": ["p", "q", "r", "s", "t"],
  // Contains T, S, R (very common!)
  "card-4": ["u", "v", "w", "x", "y", "z"]
  // Less common letters
};
function getCardFrequencyWeight(targetId) {
  const lowerId = targetId.toLowerCase();
  if (lowerId.includes("backspace") || lowerId.includes("delete")) return 0.15;
  if (lowerId.includes("space")) return 0.15;
  if (lowerId.includes("enter") || lowerId.includes("speak")) return 0.08;
  const letters = CARD_LETTERS[targetId];
  if (!letters) return 0;
  const totalFreq = letters.reduce((sum, letter) => {
    return sum + (LETTER_FREQUENCY[letter.toLowerCase()] || 0);
  }, 0);
  return totalFreq / letters.length * 2;
}
const state = reactive({
  isActive: false,
  isPaused: false,
  currentTargetId: null,
  currentTargetBounds: null,
  snappedPosition: null,
  dwellProgress: 0,
  dwellStartTime: null,
  isSelecting: false,
  isLocked: false,
  lockConfidence: 0,
  gazeStability: 1
});
const gazeHistory = [];
const GAZE_HISTORY_LENGTH = 20;
let lastGazePos = null;
let velocity = { x: 0, y: 0 };
let velocityMagnitude = 0;
let candidateTarget = null;
const targets = ref(/* @__PURE__ */ new Map());
let animationFrameId = null;
const onTargetSelect = ref(null);
const onTargetEnter = ref(null);
const onTargetLeave = ref(null);
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
function isPointInExpandedBounds(x, y, bounds, padding = BASE_PADDING) {
  return x >= bounds.left - padding && x <= bounds.left + bounds.width + padding && y >= bounds.top - padding && y <= bounds.top + bounds.height + padding;
}
function isPointInCoreBounds(x, y, bounds) {
  return x >= bounds.left && x <= bounds.left + bounds.width && y >= bounds.top && y <= bounds.top + bounds.height;
}
function getTargetCenter(target) {
  if (!target.bounds) return null;
  return {
    x: target.bounds.left + target.bounds.width / 2,
    y: target.bounds.top + target.bounds.height / 2
  };
}
function getTargetSize(target) {
  if (!target.bounds) return 100;
  return (target.bounds.width + target.bounds.height) / 2;
}
function getDynamicPadding(size) {
  const sizeDiff = REFERENCE_SIZE - size;
  const padding = BASE_PADDING + sizeDiff * SIZE_INFLUENCE_FACTOR;
  return Math.max(MIN_PADDING, Math.min(padding, MAX_PADDING));
}
function calculateGazeStability() {
  if (gazeHistory.length < 5) return 0.5;
  const recent = gazeHistory.slice(-10);
  let totalDeviation = 0;
  const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
  const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
  for (const point of recent) {
    totalDeviation += distance(point.x, point.y, avgX, avgY);
  }
  const avgDeviation = totalDeviation / recent.length;
  const stability = Math.max(0, Math.min(1, 1 - avgDeviation / 150));
  return stability;
}
function calculateTargetWeight(target) {
  let weight = target.weight;
  if (target.lastSelectedTime > 0) {
    const timeSinceSelection = Date.now() - target.lastSelectedTime;
    const recencyBonus = Math.exp(-timeSinceSelection / RECENCY_DECAY) * 0.02;
    weight += recencyBonus;
  }
  const selectionBonus = Math.min(target.selectionCount * SELECTION_WEIGHT_BOOST, MAX_SELECTION_BONUS);
  weight += selectionBonus;
  const frequencyBonus = getCardFrequencyWeight(target.id);
  weight += frequencyBonus;
  return weight;
}
function calculateTargetScore(target, gazeX, gazeY, isCurrentTarget) {
  const detectionBounds = target.hitBounds || target.bounds;
  if (!detectionBounds || !target.bounds) return 0;
  const center = getTargetCenter(target);
  if (!center) return 0;
  const dist = distance(gazeX, gazeY, center.x, center.y);
  const size = getTargetSize(target);
  const padding = getDynamicPadding(size);
  const effectiveDimension = size + padding;
  const normalizedDist = dist / effectiveDimension;
  const distanceScore = Math.max(0, 1 - normalizedDist * 0.8);
  const insideCore = isPointInCoreBounds(gazeX, gazeY, detectionBounds);
  const insideBonus = insideCore ? 0.25 : 0;
  const weightScore = calculateTargetWeight(target) * 0.15;
  const priorityScore = Math.min(target.priority / 10, 1) * 0.15;
  let currentBonus = 0;
  if (isCurrentTarget && state.dwellStartTime) {
    const dwellTime = Date.now() - state.dwellStartTime;
    currentBonus = Math.min(dwellTime / 300, 1) * 0.15;
  }
  const stabilityMultiplier = 0.7 + state.gazeStability * 0.3;
  const totalScore = (distanceScore + insideBonus + weightScore + priorityScore + currentBonus) * stabilityMultiplier;
  return totalScore;
}
function registerTarget(id, element, priority = 0, options = {}) {
  if (!element) {
    targets.value.delete(id);
    console.log(`[GazeController] Unregistered target ${id}. Total targets: ${targets.value.size}`);
    return;
  }
  const existing = targets.value.get(id);
  targets.value.set(id, {
    id,
    element,
    bounds: element.getBoundingClientRect(),
    hitBounds: options.hitBounds || element.getBoundingClientRect(),
    priority,
    weight: options.weight ?? existing?.weight ?? 1,
    lastSelectedTime: existing?.lastSelectedTime ?? 0,
    selectionCount: existing?.selectionCount ?? 0
  });
}
function unregisterTarget(id) {
  targets.value.delete(id);
  if (state.currentTargetId === id) {
    state.currentTargetId = null;
    state.currentTargetBounds = null;
    state.dwellProgress = 0;
    state.dwellStartTime = null;
  }
}
function updateTargetBounds() {
  targets.value.forEach((target) => {
    if (target.element) {
      target.bounds = target.element.getBoundingClientRect();
    }
  });
}
function boostTargetWeight(targetId, amount = 0.1) {
  const target = targets.value.get(targetId);
  if (target) {
    target.weight = Math.min(target.weight + amount, 3);
    target.selectionCount++;
    target.lastSelectedTime = Date.now();
  }
}
function findBestTarget(x, y) {
  if (state.isPaused) return { target: null, confidence: 0 };
  gazeHistory.push({ x, y, timestamp: Date.now(), targetId: state.currentTargetId });
  if (gazeHistory.length > GAZE_HISTORY_LENGTH) {
    gazeHistory.shift();
  }
  state.gazeStability = calculateGazeStability();
  if (lastGazePos) {
    const dx = x - lastGazePos.x;
    const dy = y - lastGazePos.y;
    velocity = {
      x: velocity.x * VELOCITY_SMOOTHING + dx * (1 - VELOCITY_SMOOTHING),
      y: velocity.y * VELOCITY_SMOOTHING + dy * (1 - VELOCITY_SMOOTHING)
    };
    velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  }
  lastGazePos = { x, y };
  const projectedX = x + velocity.x * PREDICTION_FACTOR;
  const projectedY = y + velocity.y * PREDICTION_FACTOR;
  const scoredTargets = [];
  targets.value.forEach((target) => {
    const detectionBounds = target.hitBounds || target.bounds;
    if (!detectionBounds || !target.bounds) return;
    const size = getTargetSize(target);
    const dynamicPadding = getDynamicPadding(size);
    if (!isPointInExpandedBounds(projectedX, projectedY, detectionBounds, dynamicPadding)) return;
    const isCurrentTarget = target.id === state.currentTargetId;
    const score = calculateTargetScore(target, projectedX, projectedY, isCurrentTarget);
    if (score > 0) {
      scoredTargets.push({ target, score });
    }
  });
  if (scoredTargets.length === 0) {
    return { target: null, confidence: 0 };
  }
  scoredTargets.sort((a, b) => b.score - a.score);
  const bestCandidate = scoredTargets[0];
  let confidence = bestCandidate.score;
  if (scoredTargets.length > 1) {
    const gap = bestCandidate.score - scoredTargets[1].score;
    confidence = Math.min(1, bestCandidate.score + gap * 0.5);
  }
  const currentTarget2 = state.currentTargetId ? targets.value.get(state.currentTargetId) : null;
  if (currentTarget2 && bestCandidate.target.id !== state.currentTargetId) {
    const currentCenter = getTargetCenter(currentTarget2);
    const currentSize = getTargetSize(currentTarget2);
    if (currentCenter) {
      const distFromCurrent = distance(projectedX, projectedY, currentCenter.x, currentCenter.y);
      const dwellTime = state.dwellStartTime ? Date.now() - state.dwellStartTime : 0;
      const isFarFromCurrent = distFromCurrent > currentSize * FAR_DISTANCE_MULTIPLIER;
      const hasMinDwell = dwellTime >= MIN_DWELL_BEFORE_SWITCH;
      if (!candidateTarget || candidateTarget.id !== bestCandidate.target.id) {
        candidateTarget = {
          id: bestCandidate.target.id,
          firstSeen: Date.now(),
          confidence
        };
      } else {
        candidateTarget.confidence = candidateTarget.confidence * 0.8 + confidence * 0.2;
      }
      const candidateDuration = Date.now() - candidateTarget.firstSeen;
      const sustainedConfidence = candidateDuration >= SUSTAINED_AWAY_TIME;
      const shouldSwitch = (
        // Fast switch: far away AND moving fast (scanning away)
        isFarFromCurrent && velocityMagnitude > 15 || // Deliberate switch: enough dwell on current, sustained gaze on new, high confidence
        hasMinDwell && sustainedConfidence && candidateTarget.confidence >= SWITCH_CONFIDENCE_THRESHOLD
      );
      if (!shouldSwitch) {
        return {
          target: currentTarget2,
          confidence: state.lockConfidence
        };
      }
    }
  }
  if (bestCandidate.target.id !== candidateTarget?.id) {
    candidateTarget = null;
  }
  return { target: bestCandidate.target, confidence };
}
function triggerSelection(targetId) {
  if (state.isSelecting) return;
  state.isSelecting = true;
  boostTargetWeight(targetId);
  setTimeout(() => {
    if (onTargetSelect.value) {
      onTargetSelect.value(targetId);
    }
    setTimeout(() => {
      state.isSelecting = false;
      state.dwellProgress = 0;
      state.dwellStartTime = Date.now();
    }, 300);
  }, 100);
}
function useGazeController() {
  const eyeGaze = useEyeGaze();
  const appStore = useAppStore();
  function updateLoop() {
    if (!state.isActive) return;
    const gazePos = eyeGaze.state.gazePosition;
    const lastUpdate = eyeGaze.state.lastUpdate || 0;
    const isStale = Date.now() - lastUpdate > 500;
    if (!gazePos || isStale) {
      state.snappedPosition = null;
      state.currentTargetId = null;
      state.currentTargetBounds = null;
      state.dwellProgress = 0;
      state.dwellStartTime = null;
      state.isLocked = false;
      state.lockConfidence = 0;
      lastGazePos = null;
      animationFrameId = requestAnimationFrame(updateLoop);
      return;
    }
    updateTargetBounds();
    const { target: bestTarget, confidence } = findBestTarget(gazePos.x, gazePos.y);
    if (bestTarget) {
      const targetCenter = getTargetCenter(bestTarget);
      if (targetCenter) {
        state.isLocked = true;
        state.lockConfidence = confidence;
        if (state.currentTargetId === bestTarget.id) {
          state.snappedPosition = { ...targetCenter };
        } else {
          if (state.snappedPosition) {
            state.snappedPosition = {
              x: state.snappedPosition.x + (targetCenter.x - state.snappedPosition.x) * LOCK_SMOOTHING,
              y: state.snappedPosition.y + (targetCenter.y - state.snappedPosition.y) * LOCK_SMOOTHING
            };
          } else {
            state.snappedPosition = { ...targetCenter };
          }
        }
        if (state.currentTargetId !== bestTarget.id) {
          if (state.currentTargetId && onTargetLeave.value) {
            onTargetLeave.value(state.currentTargetId);
          }
          state.currentTargetId = bestTarget.id;
          state.currentTargetBounds = bestTarget.bounds;
          state.dwellStartTime = Date.now();
          state.dwellProgress = 0;
          if (onTargetEnter.value) {
            onTargetEnter.value(bestTarget.id);
          }
        } else if (!state.currentTargetBounds && bestTarget.bounds) {
          state.currentTargetBounds = bestTarget.bounds;
        }
        if (state.dwellStartTime && !state.isSelecting) {
          const elapsed = Date.now() - state.dwellStartTime;
          const adjustedElapsed = elapsed * (0.5 + confidence * 0.5);
          state.dwellProgress = Math.min(adjustedElapsed / appStore.dwellThreshold, 1);
          if (state.dwellProgress >= 1) {
            triggerSelection(bestTarget.id);
          }
        }
      }
    } else {
      state.isLocked = false;
      state.lockConfidence = 0;
      if (state.snappedPosition) {
        state.snappedPosition = {
          x: state.snappedPosition.x + (gazePos.x - state.snappedPosition.x) * FREE_CURSOR_SMOOTHING,
          y: state.snappedPosition.y + (gazePos.y - state.snappedPosition.y) * FREE_CURSOR_SMOOTHING
        };
      } else {
        state.snappedPosition = { x: gazePos.x, y: gazePos.y };
      }
      if (state.currentTargetId) {
        if (onTargetLeave.value) {
          onTargetLeave.value(state.currentTargetId);
        }
        state.currentTargetId = null;
        state.currentTargetBounds = null;
        state.dwellProgress = 0;
        state.dwellStartTime = null;
      }
    }
    animationFrameId = requestAnimationFrame(updateLoop);
  }
  function start() {
    if (state.isActive) return;
    state.isActive = true;
    state.isPaused = false;
    state.snappedPosition = null;
    state.currentTargetId = null;
    state.currentTargetBounds = null;
    state.dwellProgress = 0;
    state.lockConfidence = 0;
    state.gazeStability = 1;
    gazeHistory.length = 0;
    lastGazePos = null;
    velocity = { x: 0, y: 0 };
    candidateTarget = null;
    animationFrameId = requestAnimationFrame(updateLoop);
    (void 0).addEventListener("resize", updateTargetBounds);
    (void 0).addEventListener("scroll", updateTargetBounds, true);
  }
  function stop() {
    state.isActive = false;
    state.isPaused = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    (void 0).removeEventListener("resize", updateTargetBounds);
    (void 0).removeEventListener("scroll", updateTargetBounds, true);
    state.currentTargetId = null;
    state.currentTargetBounds = null;
    state.snappedPosition = null;
    state.dwellProgress = 0;
    state.dwellStartTime = null;
    state.isLocked = false;
    state.lockConfidence = 0;
    state.gazeStability = 1;
  }
  function setPaused(paused) {
    state.isPaused = paused;
    if (paused) {
      state.isLocked = false;
      state.snappedPosition = null;
      state.currentTargetId = null;
      state.currentTargetBounds = null;
      state.dwellProgress = 0;
      state.dwellStartTime = null;
      state.lockConfidence = 0;
    }
  }
  function clearTargets() {
    targets.value.clear();
    state.currentTargetId = null;
    state.dwellProgress = 0;
  }
  function onSelect(callback) {
    onTargetSelect.value = callback;
  }
  function onEnter(callback) {
    onTargetEnter.value = callback;
  }
  function onLeave(callback) {
    onTargetLeave.value = callback;
  }
  function selectCurrent() {
    if (state.currentTargetId) {
      triggerSelection(state.currentTargetId);
    }
  }
  function setTargetWeight(targetId, weight) {
    const target = targets.value.get(targetId);
    if (target) {
      target.weight = Math.max(0.1, Math.min(weight, 5));
    }
  }
  const gazeStability = computed(() => state.gazeStability);
  const lockConfidence = computed(() => state.lockConfidence);
  return {
    state: readonly(state),
    targets: readonly(targets),
    gazeStability,
    lockConfidence,
    registerTarget,
    unregisterTarget,
    updateTargetBounds,
    boostTargetWeight,
    setTargetWeight,
    start,
    stop,
    clearTargets,
    onSelect,
    onEnter,
    onLeave,
    selectCurrent,
    setPaused
  };
}
export {
  useEyeGaze as a,
  useGazeController as b,
  useCamera as u
};
//# sourceMappingURL=useGazeController-CqZ3gTDn.js.map
