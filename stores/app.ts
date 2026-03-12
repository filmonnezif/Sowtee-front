/**
 * SOWTEE App Store
 * Global state management using Pinia
 */

import { defineStore } from 'pinia'
import type {
  InteractionMode,
  PhraseCandidate,
  VisualContext,
  AgentPhase,
  PredictionResponse,
  WordSuggestion,
} from '~/types/api'
import type { CameraDevice } from '~/composables/useCamera'

export type ConversationPhase = 'idle' | 'capturing' | 'building' | 'ready'

export interface ThemeSettings {
  background: string
  surface: string
  card: string
  accent: string
  text: string
}

export interface AppState {
  // User
  userId: string
  userName: string
  sessionId: string | null

  // Interaction
  interactionMode: InteractionMode

  // Agent State
  currentPhase: AgentPhase
  isProcessing: boolean

  // Conversation Building
  conversationPhase: ConversationPhase
  currentSentence: string[]
  capturedSceneImage: string | null
  sceneDescription: string
  wordSuggestions: WordSuggestion[]
  suggestionPage: number // For cycling through suggestions
  highlightedCorner: number | null // 0-3 for arrow key highlighting

  // Predictions (legacy, for conversation starters)
  predictedPhrases: PhraseCandidate[]
  visualContext: VisualContext | null
  reasoningTrace: string[]

  // History
  recentPhrases: string[]
  sentenceHistory: string[]

  // Settings
  settingsExpanded: boolean
  autoCapture: boolean
  captureInterval: number // ms
  showDebugInfo: boolean
  language: 'en' | 'ar' | 'ur'

  // Eye Gaze Settings
  eyeGazeOverlayActive: boolean
  eyeGazeCalibrationActive: boolean
  eyeGazeCalibrated: boolean
  dwellThreshold: number // ms before selection
  blinkDetectionEnabled: boolean

  // Speech Recognition / Conversation Context
  isListeningToSpeech: boolean
  conversationContext: string[] // Recent heard speech
  lastHeardText: string

  // Custom Context (user-defined situation)
  customContextEnabled: boolean
  customContext: string // e.g., "Giving a speech at a hackathon about the app"

  // Camera Settings
  webgazerCameraId: string | null // Camera for eye tracking/webgazer
  sceneCaptureCameraId: string | null // Camera for scene capture
  availableCameras: CameraDevice[]

  // Theme
  themeSettings: ThemeSettings

  // Voice Clone
  clonedVoiceId: string | null
  clonedVoiceName: string | null
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    userId: `user_${Date.now()}`,
    userName: '',
    sessionId: null,
    interactionMode: 'touch',
    currentPhase: 'perceive',
    isProcessing: false,
    // Conversation Building
    conversationPhase: 'idle',
    currentSentence: [],
    capturedSceneImage: null,
    sceneDescription: '',
    wordSuggestions: [],
    suggestionPage: 0,
    highlightedCorner: null,
    // Predictions
    predictedPhrases: [],
    visualContext: null,
    reasoningTrace: [],
    recentPhrases: [],
    sentenceHistory: [],
    // Settings
    settingsExpanded: false,
    autoCapture: false, // Disabled by default
    captureInterval: 3000, // 3 seconds
    showDebugInfo: false,
    language: 'en',
    // Eye Gaze
    eyeGazeOverlayActive: false,
    eyeGazeCalibrationActive: false,
    eyeGazeCalibrated: false,
    dwellThreshold: 1500, // 1.5 seconds
    blinkDetectionEnabled: true,
    // Speech Recognition
    isListeningToSpeech: false,
    conversationContext: [],
    lastHeardText: '',
    // Custom Context
    customContextEnabled: false,
    customContext: '',
    // Camera Settings
    webgazerCameraId: null,
    sceneCaptureCameraId: null,
    availableCameras: [],
    // Theme
    themeSettings: {
      background: '#000000',
      surface: '#121212',
      card: '#18181b',
      accent: '#eab308',
      text: '#f5f5f7',
    },
    // Voice Clone
    clonedVoiceId: null,
    clonedVoiceName: null,
  }),

  getters: {
    topPhrase: (state) => state.predictedPhrases[0] || null,

    isEyeGazeMode: (state) => state.interactionMode === 'eye_gaze',

    detectedObjects: (state) =>
      state.visualContext?.detected_objects.map(o => o.label) || [],

    hasActivePredictions: (state) => state.predictedPhrases.length > 0,

    // Get up to 5 phrases for eye gaze zones
    eyeGazePhrases: (state) => state.predictedPhrases.slice(0, 5),

    // Current sentence as string
    sentenceText: (state) => state.currentSentence.join(' '),

    // Is currently building a sentence
    isBuilding: (state) => state.conversationPhase === 'building',

    // Has a captured scene
    hasScene: (state) => state.capturedSceneImage !== null,

    // Get 4 word suggestions for corners (paginated)
    cornerSuggestions: (state) => {
      const start = state.suggestionPage * 4
      return state.wordSuggestions.slice(start, start + 4)
    },

    // Check if there are more suggestions
    hasMoreSuggestions: (state) => {
      return (state.suggestionPage + 1) * 4 < state.wordSuggestions.length
    },

    // Get conversation context as a string for API calls
    conversationContextString: (state) => {
      return state.conversationContext.slice(-10).join(' | ')
    },
  },

  actions: {
    initializeUserIdentity() {
      if (!import.meta.client) return

      const storedUserId = localStorage.getItem('sowtee_user_id')
      const storedUserName = localStorage.getItem('sowtee_user_name')

      if (storedUserId) {
        this.userId = storedUserId
      }

      if (storedUserName) {
        this.userName = storedUserName
      }
    },

    loginWithName(name: string) {
      const normalizedName = name.trim()
      if (!normalizedName) return

      const slug = normalizedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      this.userName = normalizedName
      this.userId = `user_${slug || 'default'}`
      this.sessionId = null

      if (import.meta.client) {
        localStorage.setItem('sowtee_user_id', this.userId)
        localStorage.setItem('sowtee_user_name', this.userName)
      }
    },

    logoutUser() {
      this.userName = ''
      this.userId = `user_${Date.now()}`
      this.sessionId = null

      if (import.meta.client) {
        localStorage.removeItem('sowtee_user_id')
        localStorage.removeItem('sowtee_user_name')
      }
    },

    updateFromPrediction(response: PredictionResponse) {
      this.sessionId = response.session_id
      this.predictedPhrases = response.phrases
      this.visualContext = response.context_analysis.visual_context
      this.reasoningTrace = response.context_analysis.reasoning_trace
      this.currentPhase = response.agent_phase
      this.isProcessing = false
    },

    addToHistory(phrase: string) {
      // Add to front, remove duplicates, limit to 20
      this.recentPhrases = [
        phrase,
        ...this.recentPhrases.filter(p => p !== phrase),
      ].slice(0, 20)
    },

    // Sentence Building Actions
    startConversation() {
      this.conversationPhase = 'capturing'
    },

    setSceneCapture(image: string, description: string) {
      this.capturedSceneImage = image
      this.sceneDescription = description
      this.conversationPhase = 'building'
      this.currentSentence = []
      this.suggestionPage = 0
    },

    addWordToSentence(word: string) {
      this.currentSentence.push(word)
    },

    removeLastWord() {
      if (this.currentSentence.length > 0) {
        this.currentSentence.pop()
      }
    },

    clearSentence() {
      this.currentSentence = []
    },

    setWordSuggestions(suggestions: WordSuggestion[]) {
      this.wordSuggestions = suggestions
      this.suggestionPage = 0
      this.highlightedCorner = null
    },

    nextSuggestionPage() {
      if (this.hasMoreSuggestions) {
        this.suggestionPage++
        this.highlightedCorner = null
      } else {
        // Loop back to start
        this.suggestionPage = 0
        this.highlightedCorner = null
      }
    },

    setHighlightedCorner(corner: number | null) {
      this.highlightedCorner = corner
    },

    saveSentenceToHistory() {
      if (this.currentSentence.length > 0) {
        const sentence = this.currentSentence.join(' ')
        this.sentenceHistory = [sentence, ...this.sentenceHistory].slice(0, 20)
        this.addToHistory(sentence)
      }
    },

    endConversation() {
      this.conversationPhase = 'idle'
      this.capturedSceneImage = null
      this.sceneDescription = ''
      this.currentSentence = []
      this.wordSuggestions = []
      this.suggestionPage = 0
      this.highlightedCorner = null
      this.predictedPhrases = []
    },

    addAnotherScene() {
      // Keep the sentence but allow adding another scene
      this.conversationPhase = 'capturing'
    },

    toggleSettings() {
      this.settingsExpanded = !this.settingsExpanded
    },

    setSettingsExpanded(expanded: boolean) {
      this.settingsExpanded = expanded
    },

    setInteractionMode(mode: InteractionMode) {
      this.interactionMode = mode
    },

    setProcessing(isProcessing: boolean) {
      this.isProcessing = isProcessing
      if (isProcessing) {
        this.currentPhase = 'perceive'
      }
    },

    clearSession() {
      this.sessionId = null
      this.predictedPhrases = []
      this.visualContext = null
      this.reasoningTrace = []
    },

    toggleDebugInfo() {
      this.showDebugInfo = !this.showDebugInfo
    },

    setLanguage(lang: 'en' | 'ar' | 'ur') {
      this.language = lang
    },

    setCaptureInterval(ms: number) {
      this.captureInterval = Math.max(1000, Math.min(ms, 10000))
    },

    // Eye Gaze Actions
    toggleEyeGazeOverlay() {
      this.eyeGazeOverlayActive = !this.eyeGazeOverlayActive
    },

    setEyeGazeOverlay(active: boolean) {
      this.eyeGazeOverlayActive = active
    },

    setDwellThreshold(ms: number) {
      this.dwellThreshold = Math.max(500, Math.min(ms, 5000))
    },

    toggleBlinkDetection() {
      this.blinkDetectionEnabled = !this.blinkDetectionEnabled
    },

    // Calibration Actions
    startCalibration() {
      this.eyeGazeCalibrationActive = true
    },

    endCalibration(completed: boolean = false) {
      this.eyeGazeCalibrationActive = false
      if (completed) {
        this.eyeGazeCalibrated = true
      }
    },

    resetCalibration() {
      this.eyeGazeCalibrated = false
    },

    // Conversation Context Actions
    setListeningToSpeech(listening: boolean) {
      this.isListeningToSpeech = listening
    },

    addHeardSpeech(text: string) {
      this.lastHeardText = text
      this.conversationContext.push(text)
      // Keep only last 20 entries
      if (this.conversationContext.length > 20) {
        this.conversationContext = this.conversationContext.slice(-20)
      }
    },

    clearConversationContext() {
      this.conversationContext = []
      this.lastHeardText = ''
    },

    // Custom Context Actions
    setCustomContextEnabled(enabled: boolean) {
      this.customContextEnabled = enabled
      if (!enabled) {
        this.customContext = ''
      }
    },

    setCustomContext(context: string) {
      this.customContext = context
    },

    clearCustomContext() {
      this.customContext = ''
      this.customContextEnabled = false
    },

    setThemeSettings(settings: Partial<ThemeSettings>) {
      this.themeSettings = { ...this.themeSettings, ...settings }
    },

    // Camera Settings Actions
    setAvailableCameras(cameras: CameraDevice[]) {
      this.availableCameras = cameras
    },

    setWebgazerCamera(cameraId: string | null) {
      this.webgazerCameraId = cameraId
    },

    setSceneCaptureCamera(cameraId: string | null) {
      this.sceneCaptureCameraId = cameraId
    },

    getCameraForPurpose(purpose: 'webgazer' | 'scene_capture'): string | null {
      return purpose === 'webgazer' ? this.webgazerCameraId : this.sceneCaptureCameraId
    },

    // Voice Clone Actions
    setClonedVoice(voiceId: string, voiceName: string) {
      this.clonedVoiceId = voiceId
      this.clonedVoiceName = voiceName
    },

    clearClonedVoice() {
      this.clonedVoiceId = null
      this.clonedVoiceName = null
    },
  },
})
