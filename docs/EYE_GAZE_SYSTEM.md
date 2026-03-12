# SOWTEE Eye Gaze Control System

## Technical Documentation

This document provides a deep technical overview of the eye gaze interaction system implemented in SOWTEE, an Augmentative and Alternative Communication (AAC) platform. The system enables users to control the interface using eye movements, with automatic fallback to mouse simulation for development/testing.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Data Flow](#data-flow)
4. [Detailed Component Breakdown](#detailed-component-breakdown)
   - [useEyeGaze Composable](#1-useeyegaze-composable)
   - [useGazeController Composable](#2-usegazecontroller-composable)
   - [GazeCursor Component](#3-gazecursor-component)
   - [EyeGazeCalibration Component](#4-eyegazecalibration-component)
5. [Signal Processing Pipeline](#signal-processing-pipeline)
6. [Dwell Selection Algorithm](#dwell-selection-algorithm)
7. [Target Snapping System](#target-snapping-system)
8. [Calibration Process](#calibration-process)
9. [State Management](#state-management)
10. [Implementation Guide](#implementation-guide)
11. [Configuration Parameters](#configuration-parameters)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The eye gaze system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   GazeCursor    │  │ EyeGazeCalibration│ │  Target Cards   │ │
│  │   (Visual)      │  │   (Setup)        │  │  (Selectable)   │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                     │          │
├───────────┼────────────────────┼─────────────────────┼──────────┤
│           │         Control Layer                    │          │
│           │    ┌───────────────────────────┐         │          │
│           └────┤    useGazeController      ├─────────┘          │
│                │  (Snapping, Dwell Logic)  │                    │
│                └─────────────┬─────────────┘                    │
│                              │                                  │
├──────────────────────────────┼──────────────────────────────────┤
│                    Input Layer                                  │
│                ┌─────────────┴─────────────┐                    │
│                │       useEyeGaze          │                    │
│                │  (Raw Tracking, Smoothing)│                    │
│                └─────────────┬─────────────┘                    │
│                              │                                  │
├──────────────────────────────┼──────────────────────────────────┤
│                   Hardware Layer                                │
│     ┌────────────────────────┴────────────────────────┐        │
│     │  WebGazer.js (Eye Tracking) │ Mouse (Fallback)  │        │
│     │  - MediaPipe FaceMesh       │ - mousemove event │        │
│     │  - Ridge Regression         │                   │        │
│     │  - Kalman Filter            │                   │        │
│     └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

| Component | Type | Responsibility |
|-----------|------|----------------|
| `useEyeGaze` | Composable | Raw eye tracking, WebGazer integration, signal smoothing |
| `useGazeController` | Composable | Target registration, snap-to-element, dwell selection |
| `GazeCursor` | Vue Component | Visual cursor with dwell progress indicator |
| `EyeGazeCalibration` | Vue Component | 9-point calibration UI for WebGazer training |

---

## Data Flow

```
[WebGazer/Mouse] 
       │
       ▼ Raw (x, y) @ ~30-60fps
┌──────────────────────┐
│     useEyeGaze       │
│  ┌────────────────┐  │
│  │ Jitter Filter  │──┼── JITTER_THRESHOLD = 5px
│  │ (5px deadzone) │  │
│  └───────┬────────┘  │
│          ▼           │
│  ┌────────────────┐  │
│  │   Smoothing    │──┼── SMOOTHING_FACTOR = 0.15
│  │ (Exponential)  │  │   newPos = oldPos + (raw - oldPos) * 0.15
│  └───────┬────────┘  │
│          ▼           │
│   state.gazePosition │
└──────────┬───────────┘
           │
           ▼ Smoothed (x, y)
┌──────────────────────┐
│  useGazeController   │
│  ┌────────────────┐  │
│  │ Target Lookup  │──┼── findNearestTarget()
│  │ (Hit Testing)  │  │   Uses hitBounds for detection
│  └───────┬────────┘  │
│          ▼           │
│  ┌────────────────┐  │
│  │  Hysteresis    │──┼── HYSTERESIS_THRESHOLD = 100px
│  │  (Sticky)      │  │   Prevents rapid target switching
│  └───────┬────────┘  │
│          ▼           │
│  ┌────────────────┐  │
│  │ Snap to Center │──┼── LOCK_SMOOTHING = 0.5
│  │ (Lock Cursor)  │  │   Cursor locks to target center
│  └───────┬────────┘  │
│          ▼           │
│  ┌────────────────┐  │
│  │ Dwell Timer    │──┼── dwellThreshold (default 1500ms)
│  │ (Selection)    │  │   Progress: elapsed / threshold
│  └───────┬────────┘  │
│          ▼           │
│  state.snappedPosition│
│  state.dwellProgress  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     GazeCursor       │
│  - Position display  │
│  - Progress ring SVG │
│  - Selection feedback│
└──────────────────────┘
```

---

## Detailed Component Breakdown

### 1. useEyeGaze Composable

**File:** `composables/useEyeGaze.ts`

**Purpose:** Handles raw eye tracking input from WebGazer.js with automatic mouse fallback. Implements signal smoothing to reduce jitter.

#### State Interface

```typescript
interface GazeState {
  isSupported: boolean        // WebGazer available
  isCalibrating: boolean      // Calibration mode active
  isTracking: boolean         // Actively tracking
  isLoading: boolean          // Loading WebGazer
  error: string | null        // Error message
  gazePosition: { x: number; y: number } | null    // Smoothed position
  smoothedPosition: { x: number; y: number } | null // Internal smoothed value
  focusedElement: Element | null  // DOM element at gaze
  dwellTime: number           // Time on current element (ms)
  dwellThreshold: number      // Selection threshold (ms)
  blinkDetected: boolean      // Blink event flag
  consecutiveBlinks: number   // Blink counter
  useMouseFallback: boolean   // Using mouse instead of eyes
  calibrationPoints: number   // Calibration clicks recorded
  webgazerReady: boolean      // WebGazer initialized
  videoFeedActive: boolean    // Camera streaming
}
```

#### Key Constants

```typescript
const SMOOTHING_FACTOR = 0.15    // Exponential smoothing (0-1, lower = smoother)
const JITTER_THRESHOLD = 5       // Minimum movement in pixels to register
const WEBGAZER_CDN = 'https://cdn.jsdelivr.net/npm/webgazer@2.1.0/dist/webgazer.min.js'
```

#### Smoothing Algorithm (Sticky Mouse Effect)

The smoothing algorithm uses exponential moving average with a jitter deadzone:

```typescript
function handleGazeUpdate(data: { x: number; y: number }) {
  // Store raw position
  lastRawPosition = { x: data.x, y: data.y }

  if (state.smoothedPosition) {
    // Calculate delta from current smoothed position
    const dx = data.x - state.smoothedPosition.x
    const dy = data.y - state.smoothedPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Only update if movement exceeds jitter threshold
    if (distance > JITTER_THRESHOLD) {
      // Apply exponential smoothing
      state.smoothedPosition = {
        x: state.smoothedPosition.x + dx * SMOOTHING_FACTOR,
        y: state.smoothedPosition.y + dy * SMOOTHING_FACTOR,
      }
    }
    // If distance <= JITTER_THRESHOLD, position stays the same (deadzone)
  } else {
    // First position - no smoothing needed
    state.smoothedPosition = { x: data.x, y: data.y }
  }

  state.gazePosition = state.smoothedPosition
}
```

**Mathematical Formula:**
```
smoothed_t = smoothed_(t-1) + (raw_t - smoothed_(t-1)) × α

Where:
- α = SMOOTHING_FACTOR = 0.15
- Only applied when |raw_t - smoothed_(t-1)| > JITTER_THRESHOLD
```

#### WebGazer Configuration

```typescript
webgazer
  .setRegression('ridge')        // Ridge regression for gaze prediction
  .setGazeListener(handleGazeUpdate)  // Callback for gaze data
  .showVideoPreview(false)       // Hide webcam preview (except calibration)
  .showPredictionPoints(false)   // Hide prediction dots
  .applyKalmanFilter(true)       // Enable Kalman filter for additional smoothing
```

#### Mouse Fallback

When WebGazer fails to load or initialize, the system automatically falls back to mouse tracking:

```typescript
function startMouseTracking() {
  mouseMoveHandler = (e: MouseEvent) => {
    handleGazeUpdate({ x: e.clientX, y: e.clientY })
  }
  window.addEventListener('mousemove', mouseMoveHandler)
}
```

---

### 2. useGazeController Composable

**File:** `composables/useGazeController.ts`

**Purpose:** Manages target registration, implements snap-to-element behavior, and handles dwell-based selection. The cursor LOCKS to targets—there is no free-floating cursor.

#### Key Constants

```typescript
const SNAP_THRESHOLD = 500      // Always find nearest target (large value)
const HYSTERESIS_THRESHOLD = 100  // Extra distance needed to switch targets
const LOCK_SMOOTHING = 0.5      // Transition speed between targets (0-1)
```

#### Target Interface

```typescript
interface GazeTarget {
  id: string                     // Unique identifier
  element: HTMLElement | null    // DOM element
  bounds: DOMRect | null         // Visual bounds (for snapping center)
  hitBounds: DOMRect | { top, left, width, height } | null  // Detection area
  priority: number               // Higher = preferred when overlapping
}
```

**Why separate `bounds` and `hitBounds`?**

- `bounds`: The visual element rectangle—cursor snaps to its CENTER
- `hitBounds`: The detection area—can be LARGER than the visual element

This allows creating "magnet zones" where a small card can dominate a large portion of the screen:

```typescript
// Example: Speaking card dominates left 60% of screen
gazeController.registerTarget('speaking-card', element, 100, {
  hitBounds: {
    top: 0,
    left: 0,
    width: window.innerWidth * 0.6,
    height: window.innerHeight
  }
})
```

#### Target Finding with Hysteresis

The algorithm prevents rapid switching between nearby targets:

```typescript
function findNearestTarget(x: number, y: number): GazeTarget | null {
  let nearestTarget: GazeTarget | null = null
  let minDistance = Infinity

  // Calculate distance to current target (for hysteresis)
  const currentTarget = state.currentTargetId 
    ? targets.value.get(state.currentTargetId) 
    : null
  let currentTargetDistance = Infinity

  if (currentTarget?.bounds) {
    const centerX = currentTarget.bounds.left + currentTarget.bounds.width / 2
    const centerY = currentTarget.bounds.top + currentTarget.bounds.height / 2
    currentTargetDistance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
  }

  targets.value.forEach((target) => {
    const detectionBounds = target.hitBounds || target.bounds
    if (!detectionBounds) return

    // Check if point is inside hit bounds
    const isInside =
      x >= detectionBounds.left &&
      x <= detectionBounds.left + detectionBounds.width &&
      y >= detectionBounds.top &&
      y <= detectionBounds.top + detectionBounds.height

    if (isInside) {
      // Direct hit - prefer higher priority
      if (!nearestTarget || target.priority > nearestTarget.priority) {
        nearestTarget = target
        minDistance = 0
      }
    }
  })

  // HYSTERESIS: Only switch if new target is significantly closer
  if (currentTarget && nearestTarget && nearestTarget.id !== currentTarget.id) {
    if (currentTargetDistance - minDistance < HYSTERESIS_THRESHOLD) {
      return currentTarget  // Stay on current target
    }
  }

  return nearestTarget
}
```

#### Main Update Loop

Runs on `requestAnimationFrame` (~60fps):

```typescript
function updateLoop() {
  if (!state.isActive) return

  const gazePos = eyeGaze.state.gazePosition
  if (!gazePos) {
    animationFrameId = requestAnimationFrame(updateLoop)
    return
  }

  // Update DOM bounds
  updateTargetBounds()

  // Find target
  const nearestTarget = findNearestTarget(gazePos.x, gazePos.y)

  if (nearestTarget) {
    const targetCenter = getTargetCenter(nearestTarget)

    if (targetCenter) {
      state.isLocked = true

      // Snap cursor to target center
      if (state.currentTargetId === nearestTarget.id) {
        // Already on this target - lock exactly
        state.snappedPosition = { ...targetCenter }
      } else {
        // Transitioning - smooth interpolation
        if (state.snappedPosition) {
          state.snappedPosition = {
            x: state.snappedPosition.x + (targetCenter.x - state.snappedPosition.x) * LOCK_SMOOTHING,
            y: state.snappedPosition.y + (targetCenter.y - state.snappedPosition.y) * LOCK_SMOOTHING,
          }
        } else {
          state.snappedPosition = { ...targetCenter }
        }
      }

      // Handle target change
      if (state.currentTargetId !== nearestTarget.id) {
        if (state.currentTargetId && onTargetLeave.value) {
          onTargetLeave.value(state.currentTargetId)
        }
        state.currentTargetId = nearestTarget.id
        state.dwellStartTime = Date.now()
        state.dwellProgress = 0
        if (onTargetEnter.value) {
          onTargetEnter.value(nearestTarget.id)
        }
      }

      // Update dwell progress
      if (state.dwellStartTime && !state.isSelecting) {
        const elapsed = Date.now() - state.dwellStartTime
        state.dwellProgress = Math.min(elapsed / appStore.dwellThreshold, 1)

        if (state.dwellProgress >= 1) {
          triggerSelection(nearestTarget.id)
        }
      }
    }
  }

  animationFrameId = requestAnimationFrame(updateLoop)
}
```

---

### 3. GazeCursor Component

**File:** `components/GazeCursor.vue`

**Purpose:** Visual representation of gaze position with dwell progress indicator.

#### Props

```typescript
interface Props {
  position: { x: number; y: number } | null  // Cursor position
  dwellProgress: number    // 0-1 progress
  isOnTarget: boolean      // Hovering over target
  isSelecting: boolean     // Selection animation playing
  visible: boolean         // Show/hide cursor
  isLocked: boolean        // Locked to target
}
```

#### SVG Progress Ring

The progress ring uses SVG stroke-dasharray animation:

```vue
<svg viewBox="0 0 80 80">
  <!-- Background ring -->
  <circle
    cx="40" cy="40" r="34"
    fill="none" stroke-width="6"
    stroke="rgba(255,255,255,0.2)"
  />
  <!-- Progress ring -->
  <circle
    cx="40" cy="40" r="34"
    fill="none" stroke-width="6"
    stroke="#3b82f6"
    :stroke-dasharray="circumference"
    :stroke-dashoffset="circumference * (1 - dwellProgress)"
  />
</svg>
```

**Circumference calculation:**
```typescript
const ringRadius = 34
const circumference = 2 * Math.PI * ringRadius  // ≈ 213.6

// Progress visualization:
// - dasharray = 213.6 (full circle)
// - dashoffset = 213.6 * (1 - progress)
// - At progress=0: offset=213.6 (empty)
// - At progress=1: offset=0 (full)
```

---

### 4. EyeGazeCalibration Component

**File:** `components/EyeGazeCalibration.vue`

**Purpose:** 9-point calibration interface for WebGazer training.

#### Calibration Grid

```typescript
const calibrationTargets = [
  { id: 1, x: 10, y: 10, label: 'Top Left' },
  { id: 2, x: 50, y: 10, label: 'Top Center' },
  { id: 3, x: 90, y: 10, label: 'Top Right' },
  { id: 4, x: 10, y: 50, label: 'Middle Left' },
  { id: 5, x: 50, y: 50, label: 'Center' },
  { id: 6, x: 90, y: 50, label: 'Middle Right' },
  { id: 7, x: 10, y: 90, label: 'Bottom Left' },
  { id: 8, x: 50, y: 90, label: 'Bottom Center' },
  { id: 9, x: 90, y: 90, label: 'Bottom Right' },
]

const MIN_CLICKS_PER_TARGET = 3
const TOTAL_REQUIRED_CLICKS = 27  // 9 targets × 3 clicks
```

#### Calibration Flow

```
1. User clicks target while LOOKING at it
2. WebGazer correlates eye position with screen position
3. After 3 clicks per target, move to next
4. After all 27 clicks, calibration complete
5. User can skip early with partial calibration (9+ clicks)
```

---

## Signal Processing Pipeline

```
Raw Eye Data (30-60 Hz, noisy)
          │
          ▼
┌─────────────────────────────────┐
│ WebGazer Internal Processing    │
│ ├─ MediaPipe FaceMesh           │
│ ├─ Eye corner detection         │
│ ├─ Ridge regression prediction  │
│ └─ Kalman filter smoothing      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ useEyeGaze Smoothing            │
│ ├─ Jitter deadzone (5px)        │
│ │   if (distance < 5) ignore    │
│ └─ Exponential smoothing (α=0.15)│
│     pos = pos + (raw - pos)*0.15│
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ useGazeController Processing    │
│ ├─ Hit test against targets     │
│ ├─ Hysteresis (100px threshold) │
│ └─ Snap to target center        │
│     pos = targetCenter          │
└────────────┬────────────────────┘
             │
             ▼
    Final Cursor Position
    (Stable, locked to targets)
```

---

## Dwell Selection Algorithm

```typescript
// State
let dwellStartTime: number | null = null
let dwellProgress: number = 0
const dwellThreshold = 1500  // ms (configurable: 500-5000ms)

// On each frame:
function updateDwell() {
  if (currentTarget && !isSelecting) {
    const elapsed = Date.now() - dwellStartTime
    dwellProgress = Math.min(elapsed / dwellThreshold, 1.0)

    if (dwellProgress >= 1.0) {
      // SELECTION!
      triggerSelection(currentTarget.id)
    }
  }
}

// On target change:
function onTargetChange(newTarget) {
  dwellStartTime = Date.now()  // Reset timer
  dwellProgress = 0
}
```

**Visual feedback during dwell:**
- 0-100%: Progress ring fills
- 100%: Green glow, checkmark appears
- Post-selection: 300ms cooldown before next selection

---

## Target Snapping System

### Why Snapping?

Eye trackers have inherent noise (~1-2° visual angle ≈ 50-100px). Free cursor movement would cause:
- Jittery, frustrating user experience
- Difficulty selecting small targets
- Fatigue from constant correction

### Solution: Lock-to-Target

```
                Without Snapping              With Snapping
                ─────────────────             ───────────────
                      
        ████                                        ████
        ██░░████                                    ████
          ░░░░ ─ raw gaze              ████ ─ cursor locked
        ████ ░░░░                                   ████
        ████   ░░
               ░░░░ ─ cursor jumps     Clean, stable selection!
                 ████
```

### Snapping Algorithm

```typescript
// Cursor ONLY exists on targets
if (nearestTarget) {
  const center = getTargetCenter(nearestTarget)
  
  if (sameAsCurrentTarget) {
    // Lock exactly to center - no jitter
    snappedPosition = center
  } else {
    // Smooth transition to new target
    snappedPosition = lerp(snappedPosition, center, 0.5)
  }
  isLocked = true
} else {
  // No targets - hide cursor entirely
  snappedPosition = null
  isLocked = false
}
```

---

## Calibration Process

### Why Calibrate?

WebGazer needs to learn the relationship between:
- Facial features (eye position, head pose)
- Screen coordinates

Each user's face geometry and camera position is different.

### Recording a Calibration Point

```typescript
function recordCalibrationClick(x: number, y: number) {
  if (webgazer && state.isCalibrating) {
    // Tell WebGazer: "When my eyes look like THIS, I'm at (x, y)"
    webgazer.recordScreenPosition(x, y, 'click')
    state.calibrationPoints++
  }
}
```

### Calibration Quality

| Clicks | Quality | Notes |
|--------|---------|-------|
| 0-8 | Invalid | Cannot use |
| 9-17 | Poor | Basic functionality |
| 18-26 | Good | Recommended minimum |
| 27 | Excellent | Full calibration |

---

## State Management

### App Store (Pinia)

```typescript
// stores/app.ts
{
  interactionMode: 'touch' | 'eye_gaze' | 'switch',
  eyeGazeCalibrationActive: boolean,
  eyeGazeCalibrated: boolean,
  dwellThreshold: number,  // 500-5000ms
  blinkDetectionEnabled: boolean,
}
```

### State Flow

```
User selects Eye Gaze mode
          │
          ▼
Is calibrated? ─── No ──▶ Start calibration
          │                     │
         Yes                    ▼
          │              Complete calibration
          │                     │
          ▼◀────────────────────┘
Start tracking + gaze controller
          │
          ▼
Register interactive targets
          │
          ▼
Begin main loop (requestAnimationFrame)
```

---

## Implementation Guide

### Step 1: Setup Composables

```typescript
// In your page/component
const eyeGaze = useEyeGaze()
const gazeController = useGazeController()
const appStore = useAppStore()
```

### Step 2: Handle Mode Changes

```typescript
watch(() => appStore.interactionMode, async (mode) => {
  if (mode === 'eye_gaze') {
    await eyeGaze.initialize()
    
    if (!appStore.eyeGazeCalibrated && !eyeGaze.state.useMouseFallback) {
      // Need calibration
      appStore.startCalibration()
      eyeGaze.startCalibration()
      await eyeGaze.startTracking()
    } else {
      // Ready to go
      await eyeGaze.startTracking()
      gazeController.start()
    }
  } else {
    eyeGaze.stopTracking()
    gazeController.stop()
  }
})
```

### Step 3: Register Targets

```typescript
// Get reference to interactive element
const buttonRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (buttonRef.value) {
    gazeController.registerTarget(
      'my-button',      // Unique ID
      buttonRef.value,  // DOM element
      100,              // Priority (higher = preferred)
      {
        hitBounds: {    // Optional: custom detection area
          top: 0,
          left: 0,
          width: 500,
          height: 300
        }
      }
    )
  }
})
```

### Step 4: Handle Selection

```typescript
gazeController.onSelect((targetId) => {
  if (targetId === 'my-button') {
    doSomething()
  }
})
```

### Step 5: Add Visual Components

```vue
<template>
  <!-- Calibration overlay -->
  <EyeGazeCalibration
    v-if="appStore.eyeGazeCalibrationActive"
    :is-calibrating="appStore.eyeGazeCalibrationActive"
    :calibration-points="eyeGaze.state.calibrationPoints"
    :webgazer-ready="eyeGaze.state.webgazerReady"
    :video-feed-active="eyeGaze.state.videoFeedActive"
    :use-mouse-fallback="eyeGaze.state.useMouseFallback"
    :gaze-position="eyeGaze.state.gazePosition"
    @calibration-click="handleCalibrationClick"
    @complete="handleCalibrationComplete"
    @cancel="handleCalibrationCancel"
  />

  <!-- Gaze cursor -->
  <GazeCursor
    :position="gazeController.state.snappedPosition"
    :dwell-progress="gazeController.state.dwellProgress"
    :is-on-target="gazeController.state.currentTargetId !== null"
    :is-selecting="gazeController.state.isSelecting"
    :is-locked="gazeController.state.isLocked"
    :visible="appStore.interactionMode === 'eye_gaze' && !appStore.eyeGazeCalibrationActive"
  />

  <!-- Your interactive element -->
  <button ref="buttonRef" class="my-button">
    Click Me
  </button>
</template>
```

---

## Configuration Parameters

### useEyeGaze

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `SMOOTHING_FACTOR` | 0.15 | 0.05-0.5 | Lower = smoother, slower response |
| `JITTER_THRESHOLD` | 5px | 2-20 | Minimum movement to register |
| `dwellThreshold` | 1500ms | 500-5000 | Time to select element |

### useGazeController

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `SNAP_THRESHOLD` | 500px | - | Distance to find nearest target |
| `HYSTERESIS_THRESHOLD` | 100px | 50-200 | Extra distance to switch targets |
| `LOCK_SMOOTHING` | 0.5 | 0.1-1.0 | Transition speed (higher = faster) |

### WebGazer

| Setting | Value | Description |
|---------|-------|-------------|
| Regression | `'ridge'` | Ridge regression (more stable than `'weightedRidge'`) |
| Kalman Filter | `true` | Additional temporal smoothing |
| Video Preview | `false` | Hidden except during calibration |

---

## Troubleshooting

### Problem: WebGazer fails to load

**Symptoms:** Console shows "Failed to load WebGazer, using mouse fallback"

**Solutions:**
1. Check network connectivity
2. Verify CDN URL is accessible
3. Check browser console for CORS errors
4. System automatically uses mouse fallback

### Problem: Cursor jumps around

**Solutions:**
1. Complete full calibration (27 clicks)
2. Ensure good lighting on face
3. Position camera at eye level
4. Increase `SMOOTHING_FACTOR` (e.g., 0.1)
5. Increase `HYSTERESIS_THRESHOLD` (e.g., 150)

### Problem: Selection triggers too fast/slow

**Solutions:**
1. Adjust `dwellThreshold` in settings (500-5000ms)
2. Default 1500ms is recommended starting point
3. Users with motor difficulties may prefer 2000-3000ms

### Problem: Target not detected

**Solutions:**
1. Ensure element has `ref` bound correctly
2. Check `registerTarget` is called after mount
3. Verify element is visible in viewport
4. Check `hitBounds` covers expected area
5. Add console logs to verify registration

### Problem: Camera access denied

**Symptoms:** "No Camera" status in calibration

**Solutions:**
1. Check browser permissions
2. Ensure HTTPS (required for camera access)
3. Try different browser
4. System falls back to mouse mode

---

## Performance Considerations

| Operation | Frequency | Cost |
|-----------|-----------|------|
| WebGazer prediction | 30-60 Hz | High (ML inference) |
| Smoothing calculation | 60 Hz | Low |
| Target hit testing | 60 Hz | Low-Medium (depends on target count) |
| DOM rect queries | 60 Hz | Medium (trigger reflow if not cached) |

**Recommendations:**
- Limit targets to <20 for optimal performance
- Use `hitBounds` instead of many small targets
- Cache element references
- Avoid registering off-screen elements

---

## License

This eye gaze system is part of the SOWTEE AAC platform.

---

*Last updated: February 2026*
