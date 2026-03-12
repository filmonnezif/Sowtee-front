/**
 * SOWTEE Gaze Controller Composable - Enhanced Version
 * Implements intelligent target selection for uncertain gaze input from WebGazer.
 * 
 * Key features:
 * - Probabilistic scoring: combines proximity, usage frequency, and temporal stability
 * - Confidence-based switching: only switches when confidence threshold is met
 * - Letter/target weighting: frequently used letters get higher priority
 * - Temporal hysteresis: requires sustained gaze away before switching
 * - Momentum detection: distinguishes scanning vs focusing behavior
 */

import { reactive, ref, readonly, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useEyeGaze } from './useEyeGaze'

export interface SnapTarget {
  id: string
  element: HTMLElement | null
  bounds: DOMRect | null // Visual center for snapping
  hitBounds: DOMRect | { top: number, left: number, width: number, height: number } | null // Active hit area
  priority: number // Higher priority targets are preferred when overlapping
  weight: number // Usage/frequency weight (higher = more likely to select)
  lastSelectedTime: number // When this target was last selected
  selectionCount: number // How many times this target has been selected
}

export interface GazeControllerState {
  isActive: boolean
  isPaused: boolean // Temporary pause without clearing targets
  currentTargetId: string | null
  currentTargetBounds: DOMRect | null // For visual feedback (rectangular cursor)
  snappedPosition: { x: number; y: number } | null
  dwellProgress: number // 0-1
  dwellStartTime: number | null
  isSelecting: boolean // True during selection animation
  isLocked: boolean // True when cursor is locked to a target
  lockConfidence: number // 0-1, how confident we are in the current lock
  gazeStability: number // 0-1, how stable the gaze has been recently
}

// ==================== CONFIGURATION ====================

// Target detection
const BASE_PADDING = 120 // Base padding at reference size
const MIN_PADDING = 40 // Minimum padding for very large elements
const MAX_PADDING = 200 // Maximum padding for very small elements
const SIZE_INFLUENCE_FACTOR = 0.5 // How strongly size affects padding (inverse)
const REFERENCE_SIZE = 200 // Size at which padding equals BASE_PADDING

// Switching behavior - TUNED FOR EASIER SWITCHING
const MIN_DWELL_BEFORE_SWITCH = 300 // Reduced from 300ms - allows faster switching
const SWITCH_CONFIDENCE_THRESHOLD = 0.6 // Reduced from 0.6 - easier to switch
const FAR_DISTANCE_MULTIPLIER = 2.2 // Reduced from 2.5 - easier to escape current target
const SUSTAINED_AWAY_TIME = 300 // Reduced from 400ms - much faster response

// Smoothing and momentum
const LOCK_SMOOTHING = 0.7 // Faster snap to target center
const FREE_CURSOR_SMOOTHING = 0.6 // Faster free cursor movement
const VELOCITY_SMOOTHING = 0.8 // Less velocity smoothing for quicker response
const PREDICTION_FACTOR = 8 // Reduced prediction for more direct control

// Weighting system - REDUCED IMPACT
// Weighting system - REDUCED IMPACT
const RECENCY_DECAY = 2000 // Faster decay (2 seconds instead of 5)
const SELECTION_WEIGHT_BOOST = 0.01 // Reduced from 0.05 - minimal sticky effect after selection
const MAX_SELECTION_BONUS = 0.05 // Low cap on selection count bonus (reduced from 0.15)

// ==================== ENGLISH LETTER FREQUENCY ====================
// Based on standard English letter frequency analysis
// Values are relative frequencies (E is most common at 12.7%)
// We use these subtly - just a small boost, not a decisive factor
const LETTER_FREQUENCY: Record<string, number> = {
  'e': 0.127, 't': 0.091, 'a': 0.082, 'o': 0.075, 'i': 0.070,
  'n': 0.067, 's': 0.063, 'h': 0.061, 'r': 0.060, 'd': 0.043,
  'l': 0.040, 'c': 0.028, 'u': 0.028, 'm': 0.024, 'w': 0.024,
  'f': 0.022, 'g': 0.020, 'y': 0.020, 'p': 0.019, 'b': 0.015,
  'v': 0.010, 'k': 0.008, 'j': 0.002, 'x': 0.002, 'q': 0.001,
  'z': 0.001
}

// Card letter mappings (based on typical SOWTEE card layout)
// Each card contains these letter groups
const CARD_LETTERS: Record<string, string[]> = {
  'card-0': ['a', 'b', 'c', 'd', 'e'],     // Contains E (most common)
  'card-1': ['f', 'g', 'h', 'i', 'j'],     // Contains I, H
  'card-2': ['k', 'l', 'm', 'n', 'o'],     // Contains O, N
  'card-3': ['p', 'q', 'r', 's', 't'],     // Contains T, S, R (very common!)
  'card-4': ['u', 'v', 'w', 'x', 'y', 'z'] // Less common letters
}

// Calculate frequency weight for a card (average of its letters' frequencies)
// Calculate frequency weight for a target (card letters or common buttons)
function getCardFrequencyWeight(targetId: string): number {
  // Handle specific buttons that are frequently used
  // This allows them to have weight without relying on sticky selection history
  const lowerId = targetId.toLowerCase()
  if (lowerId.includes('backspace') || lowerId.includes('delete')) return 0.15 // Increased from 0.04 to match letter cards
  if (lowerId.includes('space')) return 0.15 // Increased for consistency
  if (lowerId.includes('enter') || lowerId.includes('speak')) return 0.08 // Increased from 0.03

  const letters = CARD_LETTERS[targetId]
  if (!letters) return 0

  const totalFreq = letters.reduce((sum, letter) => {
    return sum + (LETTER_FREQUENCY[letter.toLowerCase()] || 0)
  }, 0)

  // Return average frequency, scaled up to emphasize inherent probability
  // Increased multiplier to make frequency matter more than recency
  return (totalFreq / letters.length) * 2.0
}

// ==================== STATE ====================

// Module-scoped singleton state
const state = reactive<GazeControllerState>({
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
  gazeStability: 1,
})

// Gaze tracking history for stability analysis
interface GazeHistoryPoint {
  x: number
  y: number
  timestamp: number
  targetId: string | null
}

const gazeHistory: GazeHistoryPoint[] = []
const GAZE_HISTORY_LENGTH = 20 // Keep last 20 samples

// Velocity and momentum tracking
let lastGazePos: { x: number, y: number } | null = null
let velocity: { x: number, y: number } = { x: 0, y: 0 }
let velocityMagnitude = 0

// Target tracking for switch detection
let awayFromCurrentSince: number | null = null
let candidateTarget: { id: string, firstSeen: number, confidence: number } | null = null

// Registered snap targets
const targets = ref<Map<string, SnapTarget>>(new Map())

// Animation frame ref
let animationFrameId: number | null = null

// Callbacks
const onTargetSelect = ref<((targetId: string) => void) | null>(null)
const onTargetEnter = ref<((targetId: string) => void) | null>(null)
const onTargetLeave = ref<((targetId: string) => void) | null>(null)

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * Check if a point is within expanded bounds
 */
function isPointInExpandedBounds(
  x: number,
  y: number,
  bounds: DOMRect | { top: number, left: number, width: number, height: number },
  padding: number = BASE_PADDING
): boolean {
  return (
    x >= bounds.left - padding &&
    x <= bounds.left + bounds.width + padding &&
    y >= bounds.top - padding &&
    y <= bounds.top + bounds.height + padding
  )
}

/**
 * Check if point is inside core bounds (no padding)
 */
function isPointInCoreBounds(
  x: number,
  y: number,
  bounds: DOMRect | { top: number, left: number, width: number, height: number }
): boolean {
  return (
    x >= bounds.left &&
    x <= bounds.left + bounds.width &&
    y >= bounds.top &&
    y <= bounds.top + bounds.height
  )
}

/**
 * Get center position of a target
 */
function getTargetCenter(target: SnapTarget): { x: number; y: number } | null {
  if (!target.bounds) return null
  return {
    x: target.bounds.left + target.bounds.width / 2,
    y: target.bounds.top + target.bounds.height / 2,
  }
}

/**
 * Get the effective size of a target (average of width and height)
 */
function getTargetSize(target: SnapTarget): number {
  if (!target.bounds) return 100
  return (target.bounds.width + target.bounds.height) / 2
}

/**
 * Calculate dynamic padding based on target size
 * Inverse relationship: Smaller = Bigger Padding
 */
function getDynamicPadding(size: number): number {
  const sizeDiff = REFERENCE_SIZE - size
  const padding = BASE_PADDING + (sizeDiff * SIZE_INFLUENCE_FACTOR)
  return Math.max(MIN_PADDING, Math.min(padding, MAX_PADDING))
}

/**
 * Calculate gaze stability from history (0 = very unstable, 1 = very stable)
 */
function calculateGazeStability(): number {
  if (gazeHistory.length < 5) return 0.5

  const recent = gazeHistory.slice(-10)
  let totalDeviation = 0

  // Calculate average position
  const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length
  const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length

  // Calculate deviation from average
  for (const point of recent) {
    totalDeviation += distance(point.x, point.y, avgX, avgY)
  }

  const avgDeviation = totalDeviation / recent.length

  // Map deviation to stability (lower deviation = higher stability)
  // Typical screen has ~1000-2000px range, so deviation of 50-100px is "stable"
  const stability = Math.max(0, Math.min(1, 1 - (avgDeviation / 150)))
  return stability
}

/**
 * Calculate weight score for a target based on various factors
 * REDUCED IMPACT - weights are subtle, not decisive
 */
function calculateTargetWeight(target: SnapTarget): number {
  let weight = target.weight

  // Recency bonus: recently selected targets get a tiny boost (DRASTICALLY REDUCED)
  if (target.lastSelectedTime > 0) {
    const timeSinceSelection = Date.now() - target.lastSelectedTime
    const recencyBonus = Math.exp(-timeSinceSelection / RECENCY_DECAY) * 0.02 // Reduced from 0.1 to 0.02
    weight += recencyBonus
  }

  // Selection count bonus (heavily capped)
  const selectionBonus = Math.min(target.selectionCount * SELECTION_WEIGHT_BOOST, MAX_SELECTION_BONUS)
  weight += selectionBonus

  // English letter frequency bonus (subtle)
  // This gives common letters (E, T, A, etc.) a small advantage
  const frequencyBonus = getCardFrequencyWeight(target.id)
  weight += frequencyBonus

  return weight
}

/**
 * Calculate a comprehensive score for a target
 * Higher score = more likely to be the intended target
 */
function calculateTargetScore(
  target: SnapTarget,
  gazeX: number,
  gazeY: number,
  isCurrentTarget: boolean
): number {
  const detectionBounds = target.hitBounds || target.bounds
  if (!detectionBounds || !target.bounds) return 0

  const center = getTargetCenter(target)
  if (!center) return 0

  const dist = distance(gazeX, gazeY, center.x, center.y)
  const size = getTargetSize(target)
  const padding = getDynamicPadding(size)

  // Base score from distance (INCREASED IMPORTANCE - distance matters most)
  // We normalize distance relative to the effective "gravity well" size/padding
  // This helps small targets compete with large ones by giving them a flatter score curve
  const effectiveDimension = size + padding
  const normalizedDist = dist / effectiveDimension
  const distanceScore = Math.max(0, 1 - normalizedDist * 0.8) // Adjusted curve for larger effective dimensions

  // Bonus for being inside core bounds
  const insideCore = isPointInCoreBounds(gazeX, gazeY, detectionBounds)
  const insideBonus = insideCore ? 0.25 : 0

  // Weight score (REDUCED from 0.3 to 0.15 - less impactful)
  const weightScore = calculateTargetWeight(target) * 0.15

  // Priority score (normalized)
  const priorityScore = Math.min(target.priority / 10, 1) * 0.15

  // Current target gets SMALL stability bonus based on dwell time (REDUCED from 0.4 to 0.15)
  let currentBonus = 0
  if (isCurrentTarget && state.dwellStartTime) {
    const dwellTime = Date.now() - state.dwellStartTime
    // Smaller bonus, caps faster (300ms instead of 500ms)
    currentBonus = Math.min(dwellTime / 300, 1) * 0.15
  }

  // Gaze stability affects all scores (but less dramatically)
  const stabilityMultiplier = 0.7 + (state.gazeStability * 0.3)

  const totalScore = (distanceScore + insideBonus + weightScore + priorityScore + currentBonus) * stabilityMultiplier

  return totalScore
}

// ==================== TARGET MANAGEMENT ====================

/**
 * Register a snap target element
 */
function registerTarget(
  id: string,
  element: HTMLElement | null,
  priority: number = 0,
  options: {
    hitBounds?: { top: number, left: number, width: number, height: number },
    weight?: number
  } = {}
) {
  if (!element) {
    targets.value.delete(id)
    console.log(`[GazeController] Unregistered target ${id}. Total targets: ${targets.value.size}`)
    return
  }

  // Preserve existing stats if re-registering
  const existing = targets.value.get(id)

  targets.value.set(id, {
    id,
    element,
    bounds: element.getBoundingClientRect(),
    hitBounds: options.hitBounds || element.getBoundingClientRect(),
    priority,
    weight: options.weight ?? existing?.weight ?? 1,
    lastSelectedTime: existing?.lastSelectedTime ?? 0,
    selectionCount: existing?.selectionCount ?? 0,
  })
}

/**
 * Unregister a snap target
 */
function unregisterTarget(id: string) {
  targets.value.delete(id)
  if (state.currentTargetId === id) {
    state.currentTargetId = null
    state.currentTargetBounds = null
    state.dwellProgress = 0
    state.dwellStartTime = null
  }
}

/**
 * Update all target bounds (call on resize/scroll)
 */
function updateTargetBounds() {
  targets.value.forEach((target) => {
    if (target.element) {
      target.bounds = target.element.getBoundingClientRect()
    }
  })
}

/**
 * Update weight for a specific target (e.g., after selection)
 */
function boostTargetWeight(targetId: string, amount: number = 0.1) {
  const target = targets.value.get(targetId)
  if (target) {
    target.weight = Math.min(target.weight + amount, 3) // Cap at 3x weight
    target.selectionCount++
    target.lastSelectedTime = Date.now()
  }
}

// ==================== CORE SELECTION LOGIC ====================

/**
 * Find the best target using probabilistic scoring
 * Implements confidence-based switching with temporal hysteresis
 */
function findBestTarget(x: number, y: number): { target: SnapTarget | null, confidence: number } {
  if (state.isPaused) return { target: null, confidence: 0 }

  // Update gaze history
  gazeHistory.push({ x, y, timestamp: Date.now(), targetId: state.currentTargetId })
  if (gazeHistory.length > GAZE_HISTORY_LENGTH) {
    gazeHistory.shift()
  }

  // Update gaze stability
  state.gazeStability = calculateGazeStability()

  // Calculate velocity
  if (lastGazePos) {
    const dx = x - lastGazePos.x
    const dy = y - lastGazePos.y
    velocity = {
      x: velocity.x * VELOCITY_SMOOTHING + dx * (1 - VELOCITY_SMOOTHING),
      y: velocity.y * VELOCITY_SMOOTHING + dy * (1 - VELOCITY_SMOOTHING)
    }
    velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
  }
  lastGazePos = { x, y }

  // Project gaze position forward (reduced for stability)
  const projectedX = x + velocity.x * PREDICTION_FACTOR
  const projectedY = y + velocity.y * PREDICTION_FACTOR

  // Score all targets
  const scoredTargets: { target: SnapTarget, score: number }[] = []

  targets.value.forEach((target) => {
    const detectionBounds = target.hitBounds || target.bounds
    if (!detectionBounds || !target.bounds) return

    const size = getTargetSize(target)
    const dynamicPadding = getDynamicPadding(size)

    // Check if within detection range (using dynamic padding)
    if (!isPointInExpandedBounds(projectedX, projectedY, detectionBounds, dynamicPadding)) return

    const isCurrentTarget = target.id === state.currentTargetId
    const score = calculateTargetScore(target, projectedX, projectedY, isCurrentTarget)

    if (score > 0) {
      scoredTargets.push({ target, score })
    }
  })

  if (scoredTargets.length === 0) {
    return { target: null, confidence: 0 }
  }

  // Sort by score
  scoredTargets.sort((a, b) => b.score - a.score)
  const bestCandidate = scoredTargets[0]

  // Calculate confidence based on score gap with second best
  let confidence = bestCandidate.score
  if (scoredTargets.length > 1) {
    const gap = bestCandidate.score - scoredTargets[1].score
    // Larger gap = higher confidence
    confidence = Math.min(1, bestCandidate.score + gap * 0.5)
  }

  const currentTarget = state.currentTargetId ? targets.value.get(state.currentTargetId) : null

  // ==================== SWITCHING LOGIC ====================
  // This is where we implement intelligent switching behavior

  if (currentTarget && bestCandidate.target.id !== state.currentTargetId) {
    // We have a current target and the best candidate is different

    const currentCenter = getTargetCenter(currentTarget)
    const currentSize = getTargetSize(currentTarget)

    if (currentCenter) {
      const distFromCurrent = distance(projectedX, projectedY, currentCenter.x, currentCenter.y)
      const dwellTime = state.dwellStartTime ? Date.now() - state.dwellStartTime : 0

      // Check if gaze is significantly far from current target
      const isFarFromCurrent = distFromCurrent > currentSize * FAR_DISTANCE_MULTIPLIER

      // Check if we've dwelled on current long enough
      const hasMinDwell = dwellTime >= MIN_DWELL_BEFORE_SWITCH

      // Track how long we've been looking at the candidate
      if (!candidateTarget || candidateTarget.id !== bestCandidate.target.id) {
        candidateTarget = {
          id: bestCandidate.target.id,
          firstSeen: Date.now(),
          confidence: confidence
        }
      } else {
        // Update confidence with temporal averaging
        candidateTarget.confidence = candidateTarget.confidence * 0.8 + confidence * 0.2
      }

      const candidateDuration = Date.now() - candidateTarget.firstSeen
      const sustainedConfidence = candidateDuration >= SUSTAINED_AWAY_TIME

      // Decision to switch:
      // 1. Fast switch if very far from current (obvious intent to look elsewhere)
      // 2. Slow switch with high confidence and sustained gaze on new target
      const shouldSwitch = (
        // Fast switch: far away AND moving fast (scanning away)
        (isFarFromCurrent && velocityMagnitude > 15) ||
        // Deliberate switch: enough dwell on current, sustained gaze on new, high confidence
        (hasMinDwell && sustainedConfidence && candidateTarget.confidence >= SWITCH_CONFIDENCE_THRESHOLD)
      )

      if (!shouldSwitch) {
        // Stay on current target
        return {
          target: currentTarget,
          confidence: state.lockConfidence
        }
      }
    }
  }

  // Reset candidate tracking when we commit to a target
  if (bestCandidate.target.id !== candidateTarget?.id) {
    candidateTarget = null
  }

  return { target: bestCandidate.target, confidence }
}

/**
 * Trigger selection of a target
 */
function triggerSelection(targetId: string) {
  if (state.isSelecting) return

  state.isSelecting = true

  // Boost the weight of the selected target
  boostTargetWeight(targetId)

  // Visual feedback delay before actually triggering
  setTimeout(() => {
    if (onTargetSelect.value) {
      onTargetSelect.value(targetId)
    }

    // Reset after selection
    setTimeout(() => {
      state.isSelecting = false
      state.dwellProgress = 0
      state.dwellStartTime = Date.now() // Reset dwell timer to prevent rapid re-selection
    }, 300)
  }, 100)
}

// ==================== MAIN COMPOSABLE ====================

export function useGazeController() {
  const eyeGaze = useEyeGaze()
  const appStore = useAppStore()

  /**
   * Main update loop - handles snapping and dwell tracking
   */
  function updateLoop() {
    if (!state.isActive) return

    const gazePos = eyeGaze.state.gazePosition
    const lastUpdate = eyeGaze.state.lastUpdate || 0
    const isStale = (Date.now() - lastUpdate) > 500 // 500ms threshold

    if (!gazePos || isStale) {
      // Reset state when lost (stop and wait)
      state.snappedPosition = null
      state.currentTargetId = null
      state.currentTargetBounds = null
      state.dwellProgress = 0
      state.dwellStartTime = null
      state.isLocked = false
      state.lockConfidence = 0

      // Reset velocity tracking
      lastGazePos = null

      animationFrameId = requestAnimationFrame(updateLoop)
      return
    }

    // Update target bounds periodically
    updateTargetBounds()

    // Find best target with confidence scoring
    const { target: bestTarget, confidence } = findBestTarget(gazePos.x, gazePos.y)

    if (bestTarget) {
      const targetCenter = getTargetCenter(bestTarget)

      if (targetCenter) {
        state.isLocked = true
        state.lockConfidence = confidence

        // Snap to target center
        if (state.currentTargetId === bestTarget.id) {
          // Already on this target - lock to center exactly
          state.snappedPosition = { ...targetCenter }
        } else {
          // Transitioning to new target - smooth transition
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
        if (state.currentTargetId !== bestTarget.id) {
          // Left previous target
          if (state.currentTargetId && onTargetLeave.value) {
            onTargetLeave.value(state.currentTargetId)
          }

          // Entered new target
          state.currentTargetId = bestTarget.id
          state.currentTargetBounds = bestTarget.bounds
          state.dwellStartTime = Date.now()
          state.dwellProgress = 0

          if (onTargetEnter.value) {
            onTargetEnter.value(bestTarget.id)
          }
        } else if (!state.currentTargetBounds && bestTarget.bounds) {
          state.currentTargetBounds = bestTarget.bounds
        }

        // Update dwell progress
        if (state.dwellStartTime && !state.isSelecting) {
          const elapsed = Date.now() - state.dwellStartTime
          // Adjust dwell by confidence - lower confidence = slower dwell
          const adjustedElapsed = elapsed * (0.5 + confidence * 0.5)
          state.dwellProgress = Math.min(adjustedElapsed / appStore.dwellThreshold, 1)

          if (state.dwellProgress >= 1) {
            triggerSelection(bestTarget.id)
          }
        }
      }
    } else {
      // No target in range - cursor moves freely with gaze
      state.isLocked = false
      state.lockConfidence = 0

      // Smooth free cursor movement
      if (state.snappedPosition) {
        state.snappedPosition = {
          x: state.snappedPosition.x + (gazePos.x - state.snappedPosition.x) * FREE_CURSOR_SMOOTHING,
          y: state.snappedPosition.y + (gazePos.y - state.snappedPosition.y) * FREE_CURSOR_SMOOTHING,
        }
      } else {
        state.snappedPosition = { x: gazePos.x, y: gazePos.y }
      }

      // Left any target
      if (state.currentTargetId) {
        if (onTargetLeave.value) {
          onTargetLeave.value(state.currentTargetId)
        }
        state.currentTargetId = null
        state.currentTargetBounds = null
        state.dwellProgress = 0
        state.dwellStartTime = null
      }
    }

    animationFrameId = requestAnimationFrame(updateLoop)
  }

  /**
   * Start the gaze controller
   */
  function start() {
    if (state.isActive) return

    state.isActive = true
    state.isPaused = false
    state.snappedPosition = null
    state.currentTargetId = null
    state.currentTargetBounds = null
    state.dwellProgress = 0
    state.lockConfidence = 0
    state.gazeStability = 1

    // Clear history
    gazeHistory.length = 0
    lastGazePos = null
    velocity = { x: 0, y: 0 }
    candidateTarget = null

    // Start update loop
    animationFrameId = requestAnimationFrame(updateLoop)

    // Add resize listener
    window.addEventListener('resize', updateTargetBounds)
    window.addEventListener('scroll', updateTargetBounds, true)
  }

  /**
   * Stop the gaze controller
   */
  function stop() {
    state.isActive = false
    state.isPaused = false

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    window.removeEventListener('resize', updateTargetBounds)
    window.removeEventListener('scroll', updateTargetBounds, true)

    // Clear state
    state.currentTargetId = null
    state.currentTargetBounds = null
    state.snappedPosition = null
    state.dwellProgress = 0
    state.dwellStartTime = null
    state.isLocked = false
    state.lockConfidence = 0
    state.gazeStability = 1
  }

  /**
   * Temporarily pause the gaze controller (without clearing targets)
   */
  function setPaused(paused: boolean) {
    state.isPaused = paused
    if (paused) {
      // Reset dwell/snap state when paused
      state.isLocked = false
      state.snappedPosition = null
      state.currentTargetId = null
      state.currentTargetBounds = null
      state.dwellProgress = 0
      state.dwellStartTime = null
      state.lockConfidence = 0
    }
  }

  /**
   * Clear all registered targets
   */
  function clearTargets() {
    targets.value.clear()
    state.currentTargetId = null
    state.dwellProgress = 0
  }

  /**
   * Set callback for target selection
   */
  function onSelect(callback: (targetId: string) => void) {
    onTargetSelect.value = callback
  }

  /**
   * Set callback for target enter
   */
  function onEnter(callback: (targetId: string) => void) {
    onTargetEnter.value = callback
  }

  /**
   * Set callback for target leave
   */
  function onLeave(callback: (targetId: string) => void) {
    onTargetLeave.value = callback
  }

  /**
   * Manually trigger selection (e.g., via keyboard)
   */
  function selectCurrent() {
    if (state.currentTargetId) {
      triggerSelection(state.currentTargetId)
    }
  }

  /**
   * Set custom weight for a target
   */
  function setTargetWeight(targetId: string, weight: number) {
    const target = targets.value.get(targetId)
    if (target) {
      target.weight = Math.max(0.1, Math.min(weight, 5))
    }
  }

  /**
   * Get current gaze stability (for UI indicators)
   */
  const gazeStability = computed(() => state.gazeStability)

  /**
   * Get current lock confidence (for UI indicators)
   */
  const lockConfidence = computed(() => state.lockConfidence)

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
    setPaused,
  }
}
