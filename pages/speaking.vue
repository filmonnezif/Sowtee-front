<script setup lang="ts">
/**
 * SOWTEE Speaking Skill Page
 * Letter-based input with predictive text suggestions for AAC communication.
 * Layout: 5 cards at corners, text field in center with ghost text + suggestion chips.
 */

import { Volume2, Loader2, Plus, Delete, Space } from 'lucide-vue-next'
const appStore = useAppStore()
const speakingStore = useSpeakingStore()
const api = useApi()
const tts = useTTS()
const eyeGaze = useEyeGaze()
const gazeController = useGazeController()
const speech = useSpeechRecognition()
const minimalNav = useMinimalNavigation()
const predictive = usePredictiveText()
const { t } = useI18n()

// Refs
// Refs for gaze targets
const cardRefs = ref<(HTMLElement | null)[]>([null, null, null, null, null])
const speakBtnRef = ref<HTMLElement | null>(null)
const textFieldAutocompleteRef = ref<HTMLElement | null>(null)
const backspaceKeyRef = ref<HTMLElement | null>(null)
const spaceKeyRef = ref<HTMLElement | null>(null)
const suggestionChipRefs = ref<(HTMLElement | null)[]>([])
const isMobile = ref(false)

// Dwell state for eye gaze
const dwellProgress = ref(0)
const dwellTimeout = ref<number | null>(null)

// Pressed animation state
const pressedIndex = ref<number | null>(null)

function triggerPress(index: number) {
  pressedIndex.value = index
  setTimeout(() => { pressedIndex.value = null }, 200)
}

// Initialize on mount
onMounted(async () => {
  updateViewportMode()
  speakingStore.reset()
  await initializeSpeakingSkill()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', updateViewportMode)
  
  // Initialize minimal navigation
  await nextTick()
  setupMinimalNavigation()
  
  tts.initialize()
  
  // Start listening for surrounding voices
  await speech.startListening()
  
  // Fetch preemptive predictions (context-only, before typing)
  setTimeout(() => {
    const convHistory = speech.conversationHistory.value.slice(-6).map(turn => ({
      speaker: turn.speaker,
      text: turn.text,
    }))
    predictive.fetchPreemptive(appStore.sceneDescription, convHistory.length > 0 ? convHistory : null)
  }, 2000)
  
  // Setup gaze controller callbacks
  gazeController.onSelect((targetId) => {
    handleGazeSelect(targetId)
  })
  
  gazeController.onEnter((targetId) => {
    // Update highlighted index when entering a card target
    if (targetId.startsWith('card-')) {
      const index = parseInt(targetId.replace('card-', ''))
      speakingStore.setHighlightedIndex(index)
    }
  })
  
  gazeController.onLeave(() => {
    // Clear highlight when leaving target
    speakingStore.setHighlightedIndex(null)
  })
  
  // Start gaze controller if eye gaze mode is active
  if (appStore.interactionMode === 'eye_gaze') {
    if (appStore.eyeGazeCalibrated) {
      await eyeGaze.startTracking()
      gazeController.start()
      await nextTick()
      registerGazeTargets()
    } else {
      // Start implicit calibration automatically
      await startCalibration()
    }
  }
  
  // Listen for clicks for calibration
  window.addEventListener('click', handleCalibrationClick)
})

// Watch for typed text changes → trigger predictive suggestions
watch(() => speakingStore.typedText, (newText) => {
  const convHistory = speech.conversationHistory.value.slice(-6).map(turn => ({
    speaker: turn.speaker,
    text: turn.text,
  }))
  // Combine fullSentence prefix + typed text for prediction context
  const partialText = speakingStore.fullSentence 
    ? `${speakingStore.fullSentence} ${newText}`.trim()
    : newText
  predictive.fetchPredictionsDebounced(
    partialText,
    appStore.sceneDescription,
    convHistory.length > 0 ? convHistory : null,
  )
})

// Sync prediction results into the store
watch(() => predictive.suggestions.value, (newSuggestions) => {
  speakingStore.setPredictiveSuggestions(newSuggestions as any[])
})
watch(() => predictive.ghostText.value, (newGhost) => {
  speakingStore.setPredictiveGhostText(newGhost)
})
watch(() => predictive.isFetching.value, (fetching) => {
  speakingStore.setFetchingSuggestions(fetching)
})

// Watch conversation history changes → re-fetch predictions (voice transcription triggers this)
watch(() => speech.conversationHistory.value.length, () => {
  const convHistory = speech.conversationHistory.value.slice(-6).map(turn => ({
    speaker: turn.speaker,
    text: turn.text,
  }))
  const partialText = speakingStore.fullSentence
    ? `${speakingStore.fullSentence} ${speakingStore.typedText}`.trim()
    : speakingStore.typedText
  predictive.fetchPredictionsDebounced(
    partialText,
    appStore.sceneDescription,
    convHistory.length > 0 ? convHistory : null,
  )
})

// Watch scene description changes (picture recapture) → re-fetch predictions
watch(() => appStore.sceneDescription, (newScene) => {
  if (newScene) {
    const convHistory = speech.conversationHistory.value.slice(-6).map(turn => ({
      speaker: turn.speaker,
      text: turn.text,
    }))
    const partialText = speakingStore.fullSentence
      ? `${speakingStore.fullSentence} ${speakingStore.typedText}`.trim()
      : speakingStore.typedText
    predictive.fetchPredictionsDebounced(
      partialText,
      newScene,
      convHistory.length > 0 ? convHistory : null,
    )
  }
})

// Pause gaze controller when expanding abbreviations
watch(() => speakingStore.isExpanding, (isExpanding) => {
  if (appStore.interactionMode === 'eye_gaze') {
    gazeController.setPaused(isExpanding)
  }
})

/**
 * Setup minimal keyboard navigation
 */
function setupMinimalNavigation() {
  minimalNav.clearItems()

  // Register cards as navigable items
  cardRefs.value.forEach((el, index) => {
    if (el && currentItems.value[index]) {
      minimalNav.registerItem({
        id: `card-${index}`,
        element: el,
        action: () => {
          triggerPress(index)
          handleSelect(index)
        },
        priority: 10 - index // Higher priority for earlier cards
      })
    }
  })
  
  // Register speak button
  if (speakBtnRef.value) {
    minimalNav.registerItem({
      id: 'speak-btn',
      element: speakBtnRef.value,
      action: handleInlineSpeak,
      priority: 15
    })
  }
  
  // Register backspace key (undo functionality)
  if (backspaceKeyRef.value) {
    minimalNav.registerItem({
      id: 'backspace-key',
      element: backspaceKeyRef.value,
      action: () => handleUndo(),
      priority: 14
    })
  }

  // Register space key
  if (spaceKeyRef.value) {
    minimalNav.registerItem({
      id: 'space-key',
      element: spaceKeyRef.value,
      action: () => speakingStore.addSpace(),
      priority: 14
    })
  }

  // Register predictive suggestion chips
  suggestionChipRefs.value.forEach((el, index) => {
    const suggestion = speakingStore.predictiveSuggestions[index]
    if (el && suggestion) {
      minimalNav.registerItem({
        id: `suggestion-chip-${index}`,
        element: el,
        action: () => handleAcceptSuggestion(suggestion),
        priority: 12 - index,
      })
    }
  })
}

// Watch for suggestions panel to register navigation items
watch(() => speakingStore.showSuggestions, async (showSuggestions) => {
  if (showSuggestions) {
    await nextTick()
    setupSuggestionsNavigation()
  } else {
    await nextTick()
    setupMinimalNavigation()
  }
})

// Keep card highlight synchronized with keyboard navigation focus
watch(() => minimalNav.currentItem.value?.id, (itemId) => {
  if (!itemId) {
    speakingStore.setHighlightedIndex(null)
    return
  }

  if (itemId.startsWith('card-')) {
    const index = parseInt(itemId.replace('card-', ''))
    if (!Number.isNaN(index)) {
      speakingStore.setHighlightedIndex(index)
      return
    }
  }

  speakingStore.setHighlightedIndex(null)
})

/**
 * Setup minimal navigation for suggestions panel
 */
function setupSuggestionsNavigation() {
  // Clear existing navigation items
  minimalNav.clearItems()
  
  // Get references to suggestion buttons
  const speakBtn = document.querySelector('[data-suggestion="speak"]') as HTMLElement
  const discardBtn = document.querySelector('[data-suggestion="discard"]') as HTMLElement
  const upBtn = document.querySelector('[data-suggestion="up"]') as HTMLElement
  const downBtn = document.querySelector('[data-suggestion="down"]') as HTMLElement
  
  // Register speak button
  if (speakBtn) {
    minimalNav.registerItem({
      id: 'suggestion-speak',
      element: speakBtn,
      action: handleSpeak,
      priority: 10
    })
  }
  
  // Register discard button
  if (discardBtn) {
    minimalNav.registerItem({
      id: 'suggestion-discard',
      element: discardBtn,
      action: () => speakingStore.discardExpansion(),
      priority: 10
    })
  }
  
  // Register up button
  if (upBtn) {
    minimalNav.registerItem({
      id: 'suggestion-up',
      element: upBtn,
      action: () => speakingStore.prevExpansion(),
      priority: 8
    })
  }
  
  // Register down button
  if (downBtn) {
    minimalNav.registerItem({
      id: 'suggestion-down',
      element: downBtn,
      action: () => speakingStore.nextExpansion(),
      priority: 8
    })
  }
  
  // Register alternative items
  const altBtns = document.querySelectorAll('[data-suggestion-alt]') as NodeListOf<HTMLElement>
  altBtns.forEach((btn, index) => {
    minimalNav.registerItem({
      id: `suggestion-alt-${index}`,
      element: btn,
      action: () => {
        if (speakingStore.expansion) {
          speakingStore.expansion.selectedIndex = index + 1
        }
      },
      priority: 5
    })
  })
}
watch([cardRefs, speakBtnRef, backspaceKeyRef, spaceKeyRef], () => {
  if (minimalNav.navigableItems.value.length === 0) {
    nextTick(() => setupMinimalNavigation())
  }
}, { deep: true })

// Watch for level changes to re-register navigation items
watch(() => speakingStore.level, async () => {
  await nextTick()
  setupMinimalNavigation()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('click', handleCalibrationClick)
  window.removeEventListener('resize', updateViewportMode)
  if (dwellTimeout.value) clearTimeout(dwellTimeout.value)
  // Stop listening for surrounding voices
  speech.stopListening()
  // Stop gaze controller
  gazeController.stop()
  gazeController.clearTargets()
  // Clean up minimal navigation
  minimalNav.clearFocus()
})

function updateViewportMode() {
  isMobile.value = window.innerWidth <= 768
}

/**
 * Handle gaze selection of a target
 */
function handleGazeSelect(targetId: string) {
  if (targetId.startsWith('card-')) {
    const index = parseInt(targetId.replace('card-', ''))
    handleSelect(index)
  } else if (targetId === 'speak-btn') {
    handleInlineSpeak()
  } else if (targetId === 'text-field-autocomplete') {
    handleAcceptGhostText()
  } else if (targetId === 'done-calibration') {
    completeCalibration()
  } else if (targetId === 'backspace-key') {
    handleUndo()
  } else if (targetId === 'space-key') {
    speakingStore.addSpace()
  } else if (targetId.startsWith('suggestion-chip-')) {
    const idx = parseInt(targetId.replace('suggestion-chip-', ''))
    if (speakingStore.predictiveSuggestions[idx]) {
      handleAcceptSuggestion(speakingStore.predictiveSuggestions[idx])
    }
  } else if (targetId.startsWith('suggestion-')) {
    handleSuggestionGaze(targetId)
  }
}

function handleSuggestionGaze(targetId: string) {
  if (targetId === 'suggestion-speak') {
    handleSpeak()
  } else if (targetId === 'suggestion-discard') {
    speakingStore.discardExpansion()
  } else if (targetId === 'suggestion-up') {
    speakingStore.prevExpansion()
  } else if (targetId === 'suggestion-down') {
    speakingStore.nextExpansion()
  } else if (targetId.startsWith('suggestion-alt-')) {
    if (speakingStore.expansion) {
      const index = parseInt(targetId.replace('suggestion-alt-', ''))
      speakingStore.expansion.selectedIndex = index
    }
  }
}

/**
 * Handle global clicks for implicit calibration
 */
function handleCalibrationClick(e: MouseEvent) {
  if (eyeGaze.state.isImplicitCalibration) {
    eyeGaze.recordCalibrationClick(e.clientX, e.clientY)
  }
}

/**
 * Complete implicit calibration
 */
function completeCalibration() {
  eyeGaze.stopImplicitCalibration()
  appStore.eyeGazeCalibrated = true
  
  // Start gaze controller for interaction
  gazeController.start()
  nextTick(() => {
    registerGazeTargets()
  })
}

/**
 * Start calibration workflow
 */
async function startCalibration() {
  appStore.eyeGazeCalibrated = false
  gazeController.stop() // Stop snapping/interaction
  
  await eyeGaze.startTracking()
  eyeGaze.startImplicitCalibration()
}

/**
 * Register all gaze targets
 */
function registerGazeTargets() {
  // Register card targets
  cardRefs.value.forEach((el, index) => {
    if (el) {
      gazeController.registerTarget(`card-${index}`, el, 5)
    }
  })
  
  // Register speak with higher priority
  if (speakBtnRef.value) {
    gazeController.registerTarget('speak-btn', speakBtnRef.value, 8)
  }

  // Register keyboard action keys
  if (backspaceKeyRef.value) {
    gazeController.registerTarget('backspace-key', backspaceKeyRef.value, 8)
  }
  
  // Register autocomplete zone on text field right half
  if (textFieldAutocompleteRef.value) {
    gazeController.registerTarget('text-field-autocomplete', textFieldAutocompleteRef.value, 7)
  }
  
  if (spaceKeyRef.value) {
    gazeController.registerTarget('space-key', spaceKeyRef.value, 8)
  }
  
  // Register suggestion chips as gaze targets
  suggestionChipRefs.value.forEach((el, index) => {
    if (el) {
      gazeController.registerTarget(`suggestion-chip-${index}`, el, 7)
    }
  })
}

// Watch for card refs changes to re-register targets
watch([cardRefs, speakBtnRef, textFieldAutocompleteRef, backspaceKeyRef, spaceKeyRef, suggestionChipRefs], () => {
  if (gazeController.state.isActive) {
    registerGazeTargets()
  }
  // Also recreate minimal nav if needed
  if (minimalNav.navigableItems.value.length === 0) {
    nextTick(() => setupMinimalNavigation())
  }
}, { deep: true })

// Watch for predictive suggestions changes to re-register chip gaze targets
watch(() => speakingStore.predictiveSuggestions, async () => {
  if (gazeController.state.isActive) {
    await nextTick()
    registerGazeTargets()
  }

  if (!speakingStore.showSuggestions) {
    await nextTick()
    setupMinimalNavigation()
  }
}, { deep: true })

// Watch for level changes to re-register targets
watch(() => speakingStore.level, async () => {
  if (gazeController.state.isActive) {
    await nextTick()
    registerGazeTargets()
  }
})

// Watch for interaction mode changes
// Watch for interaction mode changes
watch(() => appStore.interactionMode, async (mode) => {
  if (mode === 'eye_gaze') {
    if (appStore.eyeGazeCalibrated) {
      await eyeGaze.startTracking()
      gazeController.start()
      await nextTick()
      registerGazeTargets()
    } else {
      await startCalibration()
    }
  } else {
    gazeController.stop()
    eyeGaze.stopTracking()
    eyeGaze.stopImplicitCalibration()
  }
})

/**
 * Initialize the speaking skill - fetch letter cards
 */
async function initializeSpeakingSkill() {
  try {
    const response = await api.speakingAction({
      user_id: appStore.userId,
      action: 'get_cards',
    })
    
    if (response.cards) {
      speakingStore.setCards(response.cards)
    }
  } catch (error) {
    console.error('Failed to initialize speaking skill:', error)
    speakingStore.setError('Failed to load letter cards')
  }
}

/**
 * Handle keyboard navigation
 */
function handleKeyDown(e: KeyboardEvent) {
  // Don't handle if suggestions panel is active - let minimal navigation handle it
  if (speakingStore.showSuggestions) {
    // Let minimal navigation handle arrow keys and tab/shift+tab
    if (e.code.startsWith('Arrow') || e.key === 'Tab') {
      // Minimal navigation will handle these
      return
    }
    
    // Let minimal navigation handle Shift key for clicking
    if (e.key === 'Shift') {
      // Minimal navigation will handle this
      return
    }
    
    // Handle other suggestion-specific keys
    handleSuggestionKeyDown(e)
    return
  }
  
  // Let minimal navigation handle arrow keys and tab/shift+tab
  if (e.code.startsWith('Arrow') || e.key === 'Tab') {
    // Minimal navigation will handle these
    return
  }
  
  // Let minimal navigation handle Shift key for clicking
  if (e.key === 'Shift') {
    // Minimal navigation will handle this
    return
  }
  
  // Backspace / Ctrl+Z - undo
  if (e.code === 'Backspace' || (e.ctrlKey && e.key === 'z')) {
    e.preventDefault()
    handleUndo()
    return
  }
  
  // Space to add space between abbreviations (only if not handled by minimal nav)
  if (e.code === 'Space' && !e.shiftKey) {
    e.preventDefault()
    speakingStore.addSpace()
    return
  }
  
  // Escape to go back or reset
  if (e.code === 'Escape') {
    e.preventDefault()
    minimalNav.clearFocus()
    if (speakingStore.level === 'letters') {
      speakingStore.goBack()
    } else {
      navigateTo('/')
    }
    return
  }
}

/**
 * Handle keyboard in suggestions mode
 */
function handleSuggestionKeyDown(e: KeyboardEvent) {
  // Enter key to speak
  if (e.code === 'Enter') {
    e.preventDefault()
    handleSpeak()
    return
  }
  
  // Escape key to discard (but not left arrow)
  if (e.code === 'Escape') {
    e.preventDefault()
    speakingStore.discardExpansion()
    return
  }
  
  if (e.code === 'ArrowUp') {
    e.preventDefault()
    speakingStore.prevExpansion()
    return
  }
  
  if (e.code === 'ArrowDown') {
    e.preventDefault()
    speakingStore.nextExpansion()
    return
  }
  
  // Number keys 1-5 for quick selection of alternatives
  if (e.key >= '1' && e.key <= '5') {
    e.preventDefault()
    const index = parseInt(e.key) - 1
    if (index === 0) {
      // Select primary (index 0)
      if (speakingStore.expansion) {
        speakingStore.expansion.selectedIndex = 0
      }
    } else if (index <= speakingStore.expansion?.alternatives.length) {
      // Select alternative
      if (speakingStore.expansion) {
        speakingStore.expansion.selectedIndex = index
      }
    }
    return
  }
  
  // Tab/Shift+Tab for cycling through alternatives
  if (e.key === 'Tab') {
    e.preventDefault()
    if (e.shiftKey) {
      speakingStore.prevExpansion()
    } else {
      speakingStore.nextExpansion()
    }
    return
  }
  
  // Space to speak current selection
  if (e.code === 'Space' && !e.shiftKey) {
    e.preventDefault()
    handleSpeak()
    return
  }
  
  // Shift+Space to discard
  if (e.code === 'Space' && e.shiftKey) {
    e.preventDefault()
    speakingStore.discardExpansion()
    return
  }
  
  // Shift+Arrow keys for enhanced navigation
  if (e.shiftKey) {
    if (e.code === 'ArrowUp') {
      e.preventDefault()
      // Jump to first alternative
      if (speakingStore.expansion) {
        speakingStore.expansion.selectedIndex = 0
      }
      return
    }
    
    if (e.code === 'ArrowDown') {
      e.preventDefault()
      // Jump to last alternative
      if (speakingStore.expansion && speakingStore.expansion.alternatives.length > 0) {
        speakingStore.expansion.selectedIndex = speakingStore.expansion.alternatives.length
      }
      return
    }
    
    if (e.code === 'ArrowLeft') {
      e.preventDefault()
      // Jump to previous alternative group (by 3)
      if (speakingStore.expansion && speakingStore.expansion.selectedIndex > 0) {
        speakingStore.expansion.selectedIndex = Math.max(0, speakingStore.expansion.selectedIndex - 3)
      }
      return
    }
    
    if (e.code === 'ArrowRight') {
      e.preventDefault()
      // Jump to next alternative group (by 3)
      if (speakingStore.expansion && speakingStore.expansion.alternatives.length > 0) {
        const maxIndex = speakingStore.expansion.alternatives.length
        speakingStore.expansion.selectedIndex = Math.min(maxIndex, speakingStore.expansion.selectedIndex + 3)
      }
      return
    }
  }
}

/**
 * Handle card or letter selection
 */
async function handleSelect(index: number) {
  try {
    if (speakingStore.level === 'cards') {
      // Select card - get spread letters
      const response = await api.speakingAction({
        user_id: appStore.userId,
        action: 'select_card',
        card_index: index,
      })
      
      if (response.spread_letters) {
        speakingStore.setSpreadLetters(response.spread_letters, index)
      }
    } else {
      // Select letter
      const response = await api.speakingAction({
        user_id: appStore.userId,
        action: 'select_letter',
        letter_index: index,
      })
      
      if (response.grouped_options) {
        // X+Z was selected, show 2 options
        speakingStore.setSpreadLetters(
          response.grouped_options.map((l, i) => ({
            index: i,
            letter: l,
            display: l,
            isGrouped: false,
          })),
          speakingStore.selectedCardIndex!
        )
      } else if (response.selected_letter) {
        const selectedLetter = response.selected_letter.toLowerCase()
        speakingStore.addLetter(selectedLetter)
        speakingStore.setTypedText(
          response.typed_text
            ? response.typed_text.toLowerCase()
            : speakingStore.typedText,
          true,
        )
        
        // Re-fetch cards
        await initializeSpeakingSkill()
      }
    }
  } catch (error) {
    console.error('Selection failed:', error)
  }
}

/**
 * Handle accepting a predictive text suggestion
 */
function handleAcceptSuggestion(suggestion: { text: string; confidence: number; is_completion: boolean }) {
  if (suggestion.is_completion) {
    // Completion replaces current partial text
    speakingStore.setSentenceText(suggestion.text)
  } else {
    // Standalone sentence — append to or replace current sentence
    speakingStore.appendToSentence(suggestion.text)
  }
  // Clear typed letters (they were incorporated into the suggestion)
  speakingStore.setTypedText('')
  // Reset backend card state
  api.speakingAction({ user_id: appStore.userId, action: 'reset' })
    .then(() => initializeSpeakingSkill())
    .catch(console.error)
  // Store acceptance for learning
  predictive.acceptSuggestion(suggestion as any)
  // Fetch new predictions for the updated sentence
  const convHistory = speech.conversationHistory.value.slice(-6).map(turn => ({
    speaker: turn.speaker,
    text: turn.text,
  }))
  predictive.fetchPredictions(
    speakingStore.fullSentence,
    appStore.sceneDescription,
    convHistory.length > 0 ? convHistory : null,
  )
}

/**
 * Handle accepting the ghost text
 */
function handleAcceptGhostText() {
  const text = predictive.acceptGhostText()
  if (text) {
    speakingStore.setSentenceText(text)
    speakingStore.setTypedText('')
    api.speakingAction({ user_id: appStore.userId, action: 'reset' })
      .then(() => initializeSpeakingSkill())
      .catch(console.error)
  }
}

/**
 * Handle inline speak — speaks fullSentence directly
 */
async function handleInlineSpeak() {
  // Build sentence: fullSentence + any remaining typed text
  let sentenceToSpeak = speakingStore.fullSentence
  if (speakingStore.typedText.trim()) {
    // If there's typed text that hasn't been expanded yet,
    // try to include it or just append the letters
    sentenceToSpeak = sentenceToSpeak 
      ? `${sentenceToSpeak} ${speakingStore.typedText}`
      : speakingStore.typedText
  }
  sentenceToSpeak = sentenceToSpeak.trim()
  if (!sentenceToSpeak) return
  
  speakingStore.setSpeaking(true)
  speech.muteForTTS()
  
  try {
    // AI auto-format: fix capitalization, punctuation, spacing
    try {
      const formatted = await api.formatText(sentenceToSpeak)
      if (formatted.was_modified) {
        sentenceToSpeak = formatted.formatted_text
      }
    } catch (e) {
      console.warn('[Speaking] Auto-format failed, using raw text:', e)
    }

    const conversationCtx = speech.conversationHistory.value
      .slice(-6)
      .map(turn => `${turn.speaker === 'user' ? 'You' : 'Other'}: ${turn.text}`)
      .join('\n')
    
    const customCtx = appStore.customContextEnabled && appStore.customContext
      ? appStore.customContext
      : undefined

    await tts.speak(sentenceToSpeak, appStore.language, {
      scene_description: appStore.sceneDescription || undefined,
      conversation_context: conversationCtx || undefined,
      custom_context: customCtx,
    })
    
    // Add to conversation history
    speech.addUserSentence(sentenceToSpeak)
    
    // Add to spoken history
    speakingStore.spokenHistory.push(sentenceToSpeak)
    
    // Clear everything
    speakingStore.clearSentence()
    speakingStore.setTypedText('')
    predictive.clear()
    
    // Reset backend state
    await api.speakingAction({
      user_id: appStore.userId,
      action: 'reset',
    })
    await initializeSpeakingSkill()
    
    // Fetch new preemptive predictions
    const convHistory = speech.conversationHistory.value.slice(-6).map(turn => ({
      speaker: turn.speaker,
      text: turn.text,
    }))
    predictive.fetchPreemptive(appStore.sceneDescription, convHistory.length > 0 ? convHistory : null)
  } finally {
    speakingStore.setSpeaking(false)
    speech.unmuteAfterTTS()
  }
}

/**
 * Handle clearing the full sentence
 */
function handleClearSentence() {
  speakingStore.clearSentence()
  speakingStore.setTypedText('')
  predictive.clear()
  api.speakingAction({ user_id: appStore.userId, action: 'reset' })
    .then(() => initializeSpeakingSkill())
    .catch(console.error)
}

/**
 * Handle eye gaze dwell selection
 */
function handleGazeHover(index: number) {
  speakingStore.setHighlightedIndex(index)
  
  // Start dwell timer
  if (dwellTimeout.value) clearTimeout(dwellTimeout.value)
  dwellProgress.value = 0
  
  const startTime = Date.now()
  const dwellTime = appStore.dwellThreshold
  
  function updateProgress() {
    const elapsed = Date.now() - startTime
    dwellProgress.value = Math.min(elapsed / dwellTime, 1)
    
    if (dwellProgress.value >= 1) {
      // Dwell complete - select
      handleSelect(index)
      dwellProgress.value = 0
    } else {
      dwellTimeout.value = requestAnimationFrame(updateProgress) as unknown as number
    }
  }
  
  dwellTimeout.value = requestAnimationFrame(updateProgress) as unknown as number
}

function handleGazeLeave() {
  if (dwellTimeout.value) {
    cancelAnimationFrame(dwellTimeout.value)
    dwellTimeout.value = null
  }
  dwellProgress.value = 0
}

// Conversation history for context panel - show last 6 turns for better context
const conversationHistory = computed(() => {
  return speech.conversationHistory.value.slice(-6).map(turn => ({
    speaker: turn.speaker as 'user' | 'other',
    text: turn.text,
  }))
})

// Computed items based on level for the new grid layout
const currentItems = computed(() => {
  if (speakingStore.level === 'cards') {
    return speakingStore.cards.map(card => ({
      index: card.index,
      label: card.label,
      letters: card.letters,
    }))
  } else {
    return speakingStore.spreadLetters.map(letter => ({
      index: letter.index,
      label: letter.display.toUpperCase(),
      letters: [letter.letter],
    }))
  }
})

// Format typed letters for display (space-separated)
const displayTypedLetters = computed(() => {
  return speakingStore.typedText.split('').join(' ').toUpperCase()
})

// Display the full sentence text with typed letters appended
const displaySentence = computed(() => {
  const parts = []
  if (speakingStore.fullSentence) parts.push(speakingStore.fullSentence)
  if (speakingStore.typedText) parts.push(speakingStore.typedText.toLowerCase())
  return parts.join(' ')
})

// Whether there's any text to speak
const hasAnySentenceText = computed(() => {
  return speakingStore.fullSentence.trim().length > 0 || speakingStore.typedText.trim().length > 0
})

// Handle undo action (delegates to store)
async function handleUndo() {
  const before = speakingStore.typedText
  speakingStore.undo()
  const after = speakingStore.typedText

  const stepsToRewind = Math.max(0, before.length - after.length)
  if (stepsToRewind === 0) return

  try {
    for (let i = 0; i < stepsToRewind; i++) {
      await api.speakingAction({
        user_id: appStore.userId,
        action: 'backspace',
      })
    }
  } catch (error) {
    console.error('Undo backend sync failed:', error)
  }
}
</script>

<template>
  <div class="speaking-page">
    <!-- Hidden video/canvas for camera -->
    <!-- Gaze Cursor (when eye gaze mode is active) -->
    <GazeCursor
      :position="gazeController.state.snappedPosition"
      :dwell-progress="gazeController.state.dwellProgress"
      :is-on-target="gazeController.state.currentTargetId !== null"
      :is-selecting="gazeController.state.isSelecting"
      :is-locked="gazeController.state.isLocked"
      :visible="appStore.interactionMode === 'eye_gaze' && gazeController.state.isActive"
    />

    <!-- Keyboard Navigation Hint -->
    <div v-if="!appStore.settingsExpanded && !speakingStore.showSuggestions" class="keyboard-nav-hint">
      Use arrow keys to navigate • Shift to click • Tab to cycle
    </div>

    <div class="speaking-layout">
      <div class="top-panel">
        <div class="text-field-group">
          <div class="text-field">
            <div class="text-field__inner">
              <span v-if="displaySentence" class="text-field__content">
                {{ displaySentence }}
              </span>
              <span v-if="speakingStore.predictiveGhostText && !displaySentence" class="text-field__ghost">
                {{ speakingStore.predictiveGhostText }}
              </span>
              <span v-else-if="speakingStore.predictiveGhostText && displaySentence" class="text-field__ghost">
                {{ ' ' + speakingStore.predictiveGhostText.slice(displaySentence.length).trim() }}
              </span>
              <span v-if="!displaySentence && !speakingStore.predictiveGhostText" class="text-field__placeholder">
                {{ t('speaking.placeholder') }}
              </span>
            </div>
            <span class="text-field__cursor" />
            <div
              ref="textFieldAutocompleteRef"
              class="text-field__autocomplete-zone"
              :class="{
                'text-field__autocomplete-zone--active': gazeController.state.currentTargetId === 'text-field-autocomplete',
                'text-field__autocomplete-zone--available': !!speakingStore.predictiveGhostText
              }"
              @click="handleAcceptGhostText"
            >
              <span v-if="speakingStore.predictiveGhostText" class="text-field__autocomplete-hint">✓</span>
            </div>
          </div>

          <div v-if="speakingStore.predictiveSuggestions.length > 0" class="suggestion-chips">
            <button
              v-for="(suggestion, idx) in speakingStore.predictiveSuggestions.slice(0, 3)"
              :key="idx"
              :ref="(el) => { if (suggestionChipRefs) suggestionChipRefs[idx] = el as HTMLElement }"
              class="suggestion-chip"
              :class="{
                'suggestion-chip--completion': suggestion.is_completion,
                'suggestion-chip--gaze-active': gazeController.state.currentTargetId === `suggestion-chip-${idx}`
              }"
              @click="handleAcceptSuggestion(suggestion)"
            >
              {{ suggestion.text }}
            </button>
            <Loader2 v-if="speakingStore.isFetchingSuggestions" :size="24" class="animate-spin suggestion-chips__loader" />
          </div>
          <div v-else-if="speakingStore.isFetchingSuggestions" class="suggestion-chips suggestion-chips--loading">
            <Loader2 :size="24" class="animate-spin suggestion-chips__loader" />
            <span class="suggestion-chips__hint">Thinking...</span>
          </div>
        </div>

        <button
          ref="speakBtnRef"
          class="action-btn action-btn--speak action-btn--inline navigable-item"
          :class="{
            'action-btn--loading': speakingStore.isSpeaking,
            'action-btn--gaze-active': gazeController.state.currentTargetId === 'speak-btn'
          }"
          :disabled="!hasAnySentenceText || speakingStore.isSpeaking"
          @click="handleInlineSpeak"
        >
          <Loader2 v-if="speakingStore.isSpeaking" :size="24" class="animate-spin" />
          <Volume2 v-else :size="24" />
          <span>Speak</span>
        </button>

        <div class="context-compact context-compact--hidden">
          <div class="scene-box scene-box--hidden">
            <img
              v-if="appStore.capturedSceneImage"
              :src="appStore.capturedSceneImage"
              class="scene-box__image"
              alt="Captured scene"
            />
            <div v-else class="scene-box__placeholder">
              <Plus :size="24" />
            </div>
          </div>

          <div class="conversation-box conversation-box--scrollable conversation-box--hidden">
            <div
              v-for="(turn, index) in conversationHistory"
              :key="index"
              class="conversation-turn"
              :class="`conversation-turn--${turn.speaker}`"
            >
              <span class="conversation-turn__label">{{ turn.speaker === 'user' ? 'user' : 'env' }}:</span>
              <span class="conversation-turn__text">{{ turn.text }}</span>
            </div>
            <div v-if="conversationHistory.length === 0" class="conversation-empty">
              No conversation yet
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isMobile" class="keyboard-section">
        <div class="keyboard-row keyboard-row--top">
          <button
            v-if="currentItems[0]"
            :ref="(el) => cardRefs[0] = el as HTMLElement"
            class="letter-card letter-card--inset-left navigable-item"
            :class="{
              'letter-card--highlighted': speakingStore.highlightedIndex === 0,
              'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-0',
              'letter-card--pressed': pressedIndex === 0
            }"
            @click="triggerPress(0); handleSelect(0)"
            @mouseenter="speakingStore.setHighlightedIndex(0)"
          >
            <span class="letter-card__text">{{ currentItems[0].label }}</span>
          </button>

          <button
            v-if="currentItems[1]"
            :ref="(el) => cardRefs[1] = el as HTMLElement"
            class="letter-card navigable-item"
            :class="{
              'letter-card--highlighted': speakingStore.highlightedIndex === 1,
              'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-1',
              'letter-card--pressed': pressedIndex === 1
            }"
            @click="triggerPress(1); handleSelect(1)"
            @mouseenter="speakingStore.setHighlightedIndex(1)"
          >
            <span class="letter-card__text">{{ currentItems[1].label }}</span>
          </button>

          <button
            v-if="currentItems[2]"
            :ref="(el) => cardRefs[2] = el as HTMLElement"
            class="letter-card letter-card--inset-right navigable-item"
            :class="{
              'letter-card--highlighted': speakingStore.highlightedIndex === 2,
              'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-2',
              'letter-card--pressed': pressedIndex === 2
            }"
            @click="triggerPress(2); handleSelect(2)"
            @mouseenter="speakingStore.setHighlightedIndex(2)"
          >
            <span class="letter-card__text">{{ currentItems[2].label }}</span>
          </button>
        </div>

        <div class="keyboard-row keyboard-row--bottom">
          <button
            ref="backspaceKeyRef"
            class="letter-card key-card key-card--backspace navigable-item"
            :class="{ 'letter-card--gaze-active': gazeController.state.currentTargetId === 'backspace-key' }"
            :disabled="!speakingStore.canUndo"
            @click="handleUndo"
          >
            <Delete :size="36" class="key-card__icon" />
          </button>

          <button
            v-if="currentItems[3]"
            :ref="(el) => cardRefs[3] = el as HTMLElement"
            class="letter-card navigable-item"
            :class="{
              'letter-card--highlighted': speakingStore.highlightedIndex === 3,
              'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-3',
              'letter-card--pressed': pressedIndex === 3
            }"
            @click="triggerPress(3); handleSelect(3)"
            @mouseenter="speakingStore.setHighlightedIndex(3)"
          >
            <span class="letter-card__text">{{ currentItems[3].label }}</span>
          </button>

          <button
            v-if="currentItems[4]"
            :ref="(el) => cardRefs[4] = el as HTMLElement"
            class="letter-card navigable-item"
            :class="{
              'letter-card--highlighted': speakingStore.highlightedIndex === 4,
              'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-4',
              'letter-card--pressed': pressedIndex === 4
            }"
            @click="triggerPress(4); handleSelect(4)"
            @mouseenter="speakingStore.setHighlightedIndex(4)"
          >
            <span class="letter-card__text">{{ currentItems[4].label }}</span>
          </button>

          <button
            ref="spaceKeyRef"
            class="letter-card key-card key-card--space navigable-item"
            :class="{ 'letter-card--gaze-active': gazeController.state.currentTargetId === 'space-key' }"
            @click="speakingStore.addSpace()"
          >
            <Space :size="40" class="key-card__icon" />
          </button>
        </div>
      </div>

      <div v-else class="keyboard-section keyboard-section--mobile">
        <div class="keyboard-split-mobile">
          <div class="keyboard-stack-mobile">
            <button
              v-if="currentItems[0]"
              :ref="(el) => cardRefs[0] = el as HTMLElement"
              class="letter-card navigable-item"
              :class="{
                'letter-card--highlighted': speakingStore.highlightedIndex === 0,
                'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-0',
                'letter-card--pressed': pressedIndex === 0
              }"
              @click="triggerPress(0); handleSelect(0)"
              @mouseenter="speakingStore.setHighlightedIndex(0)"
            >
              <span class="letter-card__text">{{ currentItems[0].label }}</span>
            </button>

            <button
              v-if="currentItems[2]"
              :ref="(el) => cardRefs[2] = el as HTMLElement"
              class="letter-card navigable-item"
              :class="{
                'letter-card--highlighted': speakingStore.highlightedIndex === 2,
                'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-2',
                'letter-card--pressed': pressedIndex === 2
              }"
              @click="triggerPress(2); handleSelect(2)"
              @mouseenter="speakingStore.setHighlightedIndex(2)"
            >
              <span class="letter-card__text">{{ currentItems[2].label }}</span>
            </button>
          </div>

          <div class="keyboard-stack-mobile">
            <button
              v-if="currentItems[1]"
              :ref="(el) => cardRefs[1] = el as HTMLElement"
              class="letter-card navigable-item"
              :class="{
                'letter-card--highlighted': speakingStore.highlightedIndex === 1,
                'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-1',
                'letter-card--pressed': pressedIndex === 1
              }"
              @click="triggerPress(1); handleSelect(1)"
              @mouseenter="speakingStore.setHighlightedIndex(1)"
            >
              <span class="letter-card__text">{{ currentItems[1].label }}</span>
            </button>

            <button
              v-if="currentItems[3]"
              :ref="(el) => cardRefs[3] = el as HTMLElement"
              class="letter-card navigable-item"
              :class="{
                'letter-card--highlighted': speakingStore.highlightedIndex === 3,
                'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-3',
                'letter-card--pressed': pressedIndex === 3
              }"
              @click="triggerPress(3); handleSelect(3)"
              @mouseenter="speakingStore.setHighlightedIndex(3)"
            >
              <span class="letter-card__text">{{ currentItems[3].label }}</span>
            </button>
          </div>
        </div>

        <div class="keyboard-mobile-actions">
          <button
            v-if="currentItems[4]"
            :ref="(el) => cardRefs[4] = el as HTMLElement"
            class="letter-card navigable-item"
            :class="{
              'letter-card--highlighted': speakingStore.highlightedIndex === 4,
              'letter-card--gaze-active': gazeController.state.currentTargetId === 'card-4',
              'letter-card--pressed': pressedIndex === 4
            }"
            @click="triggerPress(4); handleSelect(4)"
            @mouseenter="speakingStore.setHighlightedIndex(4)"
          >
            <span class="letter-card__text">{{ currentItems[4].label }}</span>
          </button>

          <button
            ref="backspaceKeyRef"
            class="letter-card key-card key-card--backspace navigable-item"
            :class="{ 'letter-card--gaze-active': gazeController.state.currentTargetId === 'backspace-key' }"
            :disabled="!speakingStore.canUndo"
            @click="handleUndo"
          >
            <Delete :size="36" class="key-card__icon" />
          </button>
        </div>

        <button
          ref="spaceKeyRef"
          class="letter-card key-card key-card--space key-card--space-mobile navigable-item"
          :class="{ 'letter-card--gaze-active': gazeController.state.currentTargetId === 'space-key' }"
          @click="speakingStore.addSpace()"
        >
          <Space :size="40" class="key-card__icon" />
        </button>
      </div>
      </div>
    
    <!-- Calibration Controls -->
    <div v-if="eyeGaze.state.isImplicitCalibration" class="fixed bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 pointer-events-none">
      <div class="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md text-lg font-medium border border-white/10 shadow-xl pointer-events-auto">
        Follow the cursor with your eyes as you click buttons
      </div>
      <button 
        class="bg-aac-highlight hover:opacity-90 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg transition-transform active:scale-95 pointer-events-auto"
        @click="completeCalibration"
      >
        Done
      </button>
    </div>

    <!-- Error display -->
    <div v-if="speakingStore.error" class="error-toast">
      {{ speakingStore.error }}
      <button @click="speakingStore.setError(null)">×</button>
    </div>
    <!-- Gaze Cursor -->
    <GazeCursor
      :position="gazeController.state.snappedPosition || eyeGaze.state.gazePosition"
      :dwell-progress="gazeController.state.dwellProgress"
      :is-on-target="gazeController.state.currentTargetId !== null"
      :is-selecting="gazeController.state.isSelecting"
      :is-locked="gazeController.state.isLocked"
      :target-bounds="gazeController.state.currentTargetBounds"
      :visible="appStore.interactionMode === 'eye_gaze' && ((gazeController.state.isActive && !gazeController.state.isPaused) || eyeGaze.state.isImplicitCalibration)"
    />
  </div>
</template>

<style scoped>
/* Speaking Page - Dark Theme with Grid Layout */
.speaking-page {
  @apply h-[100dvh] min-h-[100dvh] bg-aac-bg;
  @apply relative overflow-x-hidden overflow-y-auto;
  @apply px-12 pb-14 pt-20;
  @apply box-border;
}

/* Main keyboard-style layout */
.speaking-layout {
  @apply min-h-full w-full;
  @apply flex flex-col gap-6;
  @apply overflow-visible;
}

.top-panel {
  @apply flex items-start gap-6;
  flex: 0 0 auto;
  min-height: 0;
  @apply overflow-visible;
}

.keyboard-section {
  flex: 1 1 auto;
  min-height: 0;
  @apply flex flex-col justify-center gap-8;
  @apply overflow-visible;
}

.keyboard-row {
  @apply flex items-center w-full px-10;
  @apply justify-between gap-10;
}

.keyboard-row--top {
  @apply pb-1;
}

.keyboard-row--bottom {
  @apply pb-2;
}

/* Letter Card - 3D Keyboard Key Style */
.letter-card {
  @apply w-72 h-44;
  @apply rounded-2xl;
  @apply flex items-center justify-center;
  @apply cursor-pointer;
  @apply relative overflow-hidden;
  @apply select-none;

  /* 3D keyboard key appearance */
  background: linear-gradient(
    180deg,
    rgb(var(--aac-surface) / 1) 0%,
    rgb(var(--aac-card) / 1) 100%
  );
  border: 1px solid rgb(255 255 255 / 0.08);
  border-bottom: none;

  /* Multi-layer shadow for 3D depth */
  box-shadow:
    /* Bottom "side" of the key */
    0 6px 0 0 rgb(0 0 0 / 0.45),
    /* Soft outer glow */
    0 8px 16px rgb(255 255 255 / 0.12),
    /* Inner top highlight (light hitting the top face) */
    inset 0 1px 0 rgb(255 255 255 / 0.08);

  /* Transition for smooth press */
  transition: transform 0.08s cubic-bezier(0.25, 0.1, 0.25, 1),
              box-shadow 0.08s cubic-bezier(0.25, 0.1, 0.25, 1),
              background 0.2s ease,
              border-color 0.2s ease;
  transform: translateY(0);
}

.letter-card--inset-left {
  margin-left: clamp(72px, 8vw, 120px);
}

.letter-card--inset-right {
  margin-right: clamp(72px, 8vw, 120px);
}

/* Pressed state (mouse down / tap) */
.letter-card:active {
  transform: translateY(5px);
  box-shadow:
    0 1px 0 0 rgb(0 0 0 / 0.45),
    0 2px 4px rgb(255 255 255 / 0.08),
    inset 0 1px 0 rgb(255 255 255 / 0.05);
}

/* Click animation class (added via JS on click) */
.letter-card--pressed {
  animation: keypress 0.18s ease-out;
}

@keyframes keypress {
  0%   { transform: translateY(0); }
  40%  { transform: translateY(5px); }
  70%  { transform: translateY(-1px); }
  100% { transform: translateY(0); }
}

.letter-card:hover {
  background: linear-gradient(
    180deg,
    rgb(var(--aac-highlight) / 0.12) 0%,
    rgb(var(--aac-surface) / 1) 100%
  );
  border-color: rgb(var(--aac-highlight) / 0.35);
  box-shadow:
    0 6px 0 0 rgb(var(--aac-highlight) / 0.25),
    0 8px 20px rgb(255 255 255 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.letter-card--highlighted {
  background: linear-gradient(
    180deg,
    rgb(var(--aac-highlight) / 0.12) 0%,
    rgb(var(--aac-surface) / 1) 100%
  );
  border-color: rgb(var(--aac-highlight) / 0.35);
  box-shadow:
    0 6px 0 0 rgb(var(--aac-highlight) / 0.25),
    0 8px 20px rgb(255 255 255 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.letter-card.keyboard-nav-highlighted {
  animation: none;
  border-width: 1px;
  transform: translateY(0);
  filter: none;
  background: linear-gradient(
    180deg,
    rgb(var(--aac-highlight) / 0.12) 0%,
    rgb(var(--aac-surface) / 1) 100%
  );
  border-color: rgb(var(--aac-highlight) / 0.35);
  box-shadow:
    0 6px 0 0 rgb(var(--aac-highlight) / 0.25),
    0 8px 20px rgb(255 255 255 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.suggestion-chip.keyboard-nav-highlighted {
  animation: none;
  border-width: 2px;
  transform: none;
  filter: none;
  @apply border-aac-highlight;
  background-color: rgb(var(--aac-highlight) / 0.15);
}

.suggestion-chip.keyboard-nav-highlighted:hover {
  @apply scale-105;
}

.letter-card--highlighted .letter-card__text,
.letter-card.keyboard-nav-highlighted .letter-card__text {
  @apply text-aac-text;
}

.letter-card--highlighted.letter-card--gaze-active {
  border-color: rgb(var(--aac-highlight) / 0.6);
  background: linear-gradient(
    180deg,
    rgb(var(--aac-highlight) / 0.15) 0%,
    rgb(var(--aac-card) / 1) 100%
  );
  box-shadow:
    0 6px 0 0 rgb(var(--aac-highlight) / 0.3),
    0 8px 20px rgb(255 255 255 / 0.16),
    0 0 0 2px rgb(var(--aac-highlight) / 0.2),
    inset 0 1px 0 rgb(255 255 255 / 0.1);
}

.letter-card__text {
  @apply text-4xl font-extrabold text-aac-text;
  @apply tracking-wider;
  /* Slight text shadow for depth on keycap */
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
}

.key-card {
  @apply w-72;
}

.key-card__text {
  @apply text-3xl;
}

.key-card--backspace:disabled {
  @apply opacity-40 cursor-not-allowed;
}

.key-card__icon {
  @apply text-aac-text;
}

/* Letter Card - Gaze Mode Styles */
.letter-card--gaze-active {
  @apply relative overflow-visible;
  border-color: rgb(var(--aac-highlight) / 0.8);
  background: linear-gradient(
    180deg,
    rgb(var(--aac-highlight) / 0.2) 0%,
    rgb(var(--aac-card) / 1) 100%
  );
  box-shadow:
    0 6px 0 0 rgb(var(--aac-highlight) / 0.35),
    0 0 30px rgb(255 255 255 / 0.2),
    0 8px 20px rgb(255 255 255 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.1);
  transform: scale(1.05);
}

.letter-card--gaze-active .letter-card__text {
  @apply text-aac-highlight;
}

/* Input Row */
.input-row {
  @apply col-span-3;
  @apply flex items-stretch justify-center gap-6;
  @apply py-2;
}

.input-row__left-actions {
  @apply flex flex-row gap-6;
  @apply flex-shrink-0;
  @apply items-stretch;
}

.input-row__right-actions {
  @apply flex flex-row gap-6;
  @apply flex-shrink-0;
  @apply items-stretch;
}

/* Action Buttons */
.action-btn {
  @apply flex flex-col items-center justify-center gap-2;
  @apply w-28 rounded-2xl;
  @apply border-2 border-aac-highlight;
  @apply text-aac-highlight;
  @apply transition-all duration-200;
  @apply disabled:opacity-30 disabled:cursor-not-allowed;
  @apply relative overflow-hidden;
  min-height: 100%;
}

.action-btn--inline {
  @apply h-20 w-32 flex-shrink-0;
  min-height: auto;
}

.action-btn:hover:not(:disabled) {
  background-color: rgb(var(--aac-highlight) / 0.2);
}

.action-btn--loading {
  @apply border-aac-highlight;
  background-color: rgb(var(--aac-highlight) / 0.3);
  @apply cursor-wait;
}

.action-btn--gaze-active {
  @apply border-aac-highlight scale-110;
  background-color: rgb(var(--aac-highlight) / 0.2);
  @apply relative overflow-visible;
  box-shadow: 0 0 25px rgb(var(--aac-highlight) / 0.4);
}

.action-btn span {
  @apply text-sm font-medium leading-tight;
}

/* Undo button */
.action-btn--undo {
  @apply border-amber-400/60 text-amber-400;
}

.action-btn--undo:hover:not(:disabled) {
  @apply bg-amber-400/15;
}

/* Text Field Group */
.text-field-group {
  @apply flex-1 min-w-0;
  @apply flex flex-col gap-2;
  @apply max-h-full overflow-hidden;
}

/* Text Field */
.text-field {
  @apply w-full;
  @apply min-h-20 px-6 py-4; /* Made taller */
  @apply bg-aac-card rounded-2xl;
  @apply border-2 border-aac-surface;
  @apply flex items-center;
  @apply transition-all duration-200;
  @apply relative;
  @apply overflow-hidden;
}

.text-field:hover {
  border-color: rgb(var(--aac-highlight) / 0.3);
}

/* Autocomplete gaze zone — right half of text field */
.text-field__autocomplete-zone {
  @apply absolute top-0 right-0 h-full;
  width: 50%;
  @apply flex items-center justify-end pr-4;
  @apply cursor-pointer;
  @apply transition-all duration-300;
  @apply rounded-r-2xl;
  pointer-events: none;
}

.text-field__autocomplete-zone--available {
  pointer-events: auto;
}

.text-field__autocomplete-zone--active {
  background: linear-gradient(to right, transparent, rgb(var(--aac-highlight) / 0.15));
  box-shadow: inset 0 0 20px rgb(var(--aac-highlight) / 0.1);
}

.text-field__autocomplete-hint {
  @apply text-aac-highlight text-2xl font-bold;
  @apply opacity-0 transition-opacity duration-300;
}

.text-field__autocomplete-zone--available .text-field__autocomplete-hint {
  @apply opacity-40;
}

.text-field__autocomplete-zone--active .text-field__autocomplete-hint {
  @apply opacity-100;
}

.text-field__inner {
  @apply flex-1 overflow-hidden;
  @apply whitespace-nowrap;
  mask-image: linear-gradient(to right, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
}

.text-field__content {
  @apply text-2xl font-semibold; /* Larger text */
  @apply text-aac-highlight;
  @apply tracking-wide;
  @apply leading-relaxed;
}

.text-field__ghost {
  @apply text-2xl font-semibold; /* Larger text */
  @apply text-aac-muted;
  @apply opacity-40;
  @apply italic;
  @apply leading-relaxed;
}

.text-field__placeholder {
  @apply text-base text-aac-muted;
}

.text-field__cursor {
  @apply w-0.5 h-6 bg-aac-highlight;
  @apply ml-1 flex-shrink-0;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Suggestion Chips Bar */
.suggestion-chips {
  @apply flex flex-nowrap items-stretch justify-start gap-4;
  @apply px-2;
  @apply w-full;
  @apply mt-2;
  @apply overflow-x-auto overflow-y-hidden;
}

.suggestion-chips::-webkit-scrollbar {
  display: none;
}

.suggestion-chips--loading {
  @apply justify-center;
}

.suggestion-chip {
  @apply px-6 py-3 rounded-xl;
  @apply bg-aac-surface;
  @apply text-aac-text text-lg font-medium;
  @apply border-2 border-aac-surface;
  @apply transition-all duration-200;
  @apply cursor-pointer;
  @apply text-center;
  @apply leading-snug;
  flex: 1 1 0;          /* Equal width for all 3 chips */
  min-width: 0;          /* Allow shrinking below content size */
  word-wrap: break-word; /* Wrap long words */
  overflow-wrap: break-word;
  white-space: normal;   /* Allow text to wrap to next line */
}

.suggestion-chip:hover {
  @apply border-aac-highlight;
  background-color: rgb(var(--aac-highlight) / 0.15);
  @apply scale-105;
}

.suggestion-chip--completion {
  @apply border-aac-highlight/30;
  @apply text-aac-highlight;
}

/* Suggestion Chip - Gaze Mode Styles */
.suggestion-chip--gaze-active {
  @apply border-aac-highlight scale-110;
  background-color: rgb(var(--aac-highlight) / 0.2);
  @apply relative overflow-visible;
  box-shadow: 0 0 25px rgb(var(--aac-highlight) / 0.4);
  @apply text-aac-highlight;
}

.suggestion-chips__loader {
  @apply text-aac-muted;
  @apply flex-shrink-0;
}

.suggestion-chips__hint {
  @apply text-xs text-aac-muted;
}

/* Speak Button Style */
.action-btn--speak {
  @apply bg-aac-highlight/10;
}

.action-btn--speak:hover:not(:disabled) {
  @apply bg-aac-highlight/30;
}

/* Context Bottom Section */
.context-bottom {
  @apply flex flex-col items-center gap-3;
  @apply pb-4;
}

.context-compact {
  @apply w-[360px] min-w-0 ml-auto;
  @apply bg-aac-card/70 border border-aac-surface rounded-2xl;
  @apply p-3;
  @apply flex flex-col gap-3;
}

.context-compact--hidden {
  @apply hidden;
}

/* Scene Box */
.scene-container {
  @apply flex flex-col items-center gap-1;
}

.scene-box {
  @apply w-full h-24 rounded-xl;
  @apply bg-aac-card border-2 border-aac-surface;
  @apply flex items-center justify-center;
  @apply overflow-hidden;
  @apply transition-all duration-200;
}

.scene-box--hidden {
  @apply hidden;
}

.scene-box:hover {
    border-color: rgb(var(--aac-highlight) / 0.5);
}

.scene-box__image {
  @apply w-full h-full object-cover;
}

.scene-box__placeholder {
  @apply text-aac-muted;
}

/* Conversation Box */
.conversation-box {
  @apply flex flex-col gap-1;
}

.conversation-box--scrollable {
  @apply max-h-36 overflow-y-auto pr-1;
}

.conversation-box--hidden {
  @apply hidden;
}

.conversation-turn {
  @apply px-3 py-1.5 rounded-lg;
  @apply text-sm;
  @apply bg-aac-card;
  background-color: rgb(var(--aac-card) / 0.8);
  @apply border border-aac-surface;
}

.conversation-turn--user {
  border-color: rgb(var(--aac-highlight) / 0.3);
}

.conversation-turn--other {
  border-color: rgb(156 163 175 / 0.3);
}

.conversation-turn__label {
  @apply text-xs text-aac-muted mr-1;
}

.conversation-turn__text {
  @apply text-aac-text;
  @apply break-words;
}

.conversation-empty {
  @apply text-xs text-aac-muted text-center;
}

/* Keyboard Navigation Hint */
.keyboard-nav-hint {
  @apply fixed bottom-6 left-1/2 -translate-x-1/2;
  @apply bg-aac-card/90 text-aac-muted;
  @apply px-4 py-2 rounded-lg;
  @apply text-xs;
  @apply z-40;
  @apply backdrop-blur-sm;
  @apply border border-aac-surface;
}

.keyboard-nav-hint--suggestions {
  @apply top-6 bottom-auto;
  @apply max-w-lg;
  @apply text-center;
}

/* Responsive layout for tablets */
@media (max-width: 1024px) {
  .speaking-page {
    @apply px-6 pt-14 pb-10;
  }

  .top-panel {
    @apply gap-4;
  }

  .keyboard-row {
    @apply px-4 gap-4;
  }

  .letter-card {
    width: 22vw;
    height: 16vw;
    min-width: 110px;
    min-height: 86px;
  }

  .letter-card__text {
    @apply text-3xl;
  }

  .action-btn--inline {
    @apply h-16 w-28;
  }

  .text-field {
    @apply min-h-16 px-4 py-3;
  }
}

/* Mobile-first adjustments for phone screens */
@media (max-width: 768px) {
  .speaking-page {
    @apply px-3 pt-4 pb-5;
  }

  .speaking-layout {
    @apply gap-3;
  }

  .top-panel {
    @apply flex-col items-stretch gap-3;
    margin-top: 4vh;
  }

  .text-field-group {
    @apply w-full;
  }

  .text-field {
    @apply min-h-14 px-4 py-2 rounded-xl;
  }

  .text-field__content,
  .text-field__ghost {
    @apply text-lg;
  }

  .text-field__placeholder {
    @apply text-sm;
  }

  .action-btn--inline {
    @apply h-24 rounded-xl self-center;
    width: 58%;
    min-width: 9.5rem;
    max-width: 13rem;
  }

  .keyboard-section {
    flex: 0 0 auto;
    @apply gap-3 justify-start;
  }

  .keyboard-section--mobile {
    @apply mt-24;
  }

  .keyboard-split-mobile {
    @apply grid grid-cols-2 gap-2.5;
  }

  .keyboard-stack-mobile {
    @apply flex flex-col gap-2.5;
  }

  .keyboard-stack-mobile .letter-card,
  .keyboard-mobile-actions .letter-card {
    width: 100%;
    min-width: 0;
    height: 22vw;
    min-height: 76px;
  }

  .keyboard-mobile-actions {
    @apply grid grid-cols-2 gap-2.5 mt-2.5;
  }

  .letter-card--inset-left,
  .letter-card--inset-right {
    margin-left: 0;
    margin-right: 0;
  }

  .letter-card {
    @apply rounded-xl;
  }

  .letter-card__text {
    font-size: clamp(1.1rem, 4.5vw, 1.5rem);
    line-height: 1.1;
  }

  .key-card__icon {
    width: 1.75rem;
    height: 1.75rem;
  }

  .key-card--space-mobile {
    @apply mt-2.5 w-full;
    height: 14vw;
    min-height: 54px;
  }

  .suggestion-chips {
    @apply gap-2 mt-1;
  }

  .suggestion-chip {
    @apply px-3 py-2 text-sm rounded-lg;
  }

  .keyboard-nav-hint {
    @apply bottom-3 text-[10px] px-3 py-1.5;
    max-width: calc(100vw - 1.5rem);
    white-space: normal;
    text-align: center;
  }
}

/* Small phone refinement */
@media (max-width: 420px) {
  .top-panel {
    margin-top: 6vh;
  }

  .keyboard-stack-mobile .letter-card,
  .keyboard-mobile-actions .letter-card {
    height: 24vw;
    min-height: 72px;
  }

  .text-field {
    @apply min-h-12;
  }

  .action-btn--inline {
    @apply h-24;
    width: 62%;
  }

  .key-card--space-mobile {
    height: 15vw;
    min-height: 50px;
  }
}

/* Error Toast */
.error-toast {
  @apply fixed bottom-6 left-1/2 -translate-x-1/2;
  @apply bg-red-600/90 text-white;
  @apply px-4 py-2 rounded-lg;
  @apply flex items-center gap-2;
  @apply z-50;
}

.error-toast button {
  @apply hover:text-red-200 text-lg;
}

</style>
