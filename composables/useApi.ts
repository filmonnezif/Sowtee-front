/**
 * SOWTEE API Composable
 * Handles all communication with the FastAPI backend
 */

import type {
  PredictionRequest,
  PredictionResponse,
  UserFeedback,
  PhraseFrequency,
  HealthResponse,
  InteractionMode,
  WordSuggestionRequest,
  WordSuggestionResponse,
} from '~/types/api'

export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Make an API request with error handling
   */
  async function request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T
    }

    return response.json()
  }

  /**
   * Check API health status
   */
  async function checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health')
  }

  /**
   * Request phrase predictions from a camera frame
   * @param mode - Optimization mode: 'full' runs all phases, 'vision_only' skips intent, 'abbreviation' for typing mode
   */
  async function predictPhrases(
    userId: string,
    imageBase64: string,
    interactionMode: InteractionMode = 'touch',
    mode: 'full' | 'vision_only' | 'abbreviation' = 'full',
    sessionId?: string,
    additionalContext?: string
  ): Promise<PredictionResponse> {
    const payload: PredictionRequest = {
      user_id: userId,
      image_base64: imageBase64,
      interaction_mode: interactionMode,
      mode: mode,
      session_id: sessionId,
      additional_context: additionalContext,
    }

    return request<PredictionResponse>('/api/v1/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * Submit feedback when user selects a phrase
   */
  async function submitFeedback(feedback: UserFeedback): Promise<void> {
    await request('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    })
  }

  /**
   * Get user's most frequently used phrases
   */
  async function getUserPhrases(
    userId: string,
    limit: number = 20
  ): Promise<PhraseFrequency[]> {
    return request<PhraseFrequency[]>(
      `/api/v1/users/${userId}/phrases?limit=${limit}`
    )
  }

  /**
   * Clear a session
   */
  async function clearSession(sessionId: string): Promise<void> {
    await request(`/api/v1/session/${sessionId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get word suggestions for sentence building
   */
  async function getWordSuggestions(
    userId: string,
    currentSentence: string[],
    imageBase64?: string,
    sceneContext?: string,
    interactionMode: InteractionMode = 'touch',
    conversationContext?: string[]
  ): Promise<WordSuggestionResponse> {
    const payload: WordSuggestionRequest = {
      user_id: userId,
      image_base64: imageBase64,
      current_sentence: currentSentence,
      scene_context: sceneContext,
      conversation_context: conversationContext,
      interaction_mode: interactionMode,
    }

    return request<WordSuggestionResponse>('/api/v1/suggest-words', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // ============== Skills API ==============

  interface SkillInfo {
    skill_id: string
    name: string
    description: string
    icon: string
    status: string
    version: string
  }

  interface SkillActionRequest {
    user_id: string
    session_id?: string
    action: string
    scene_description?: string
    scene_image?: string
    conversation_history?: Array<{ speaker: string; text: string }>
    card_index?: number
    letter_index?: number
    count?: number
  }

  interface SkillActionResponse {
    action: string
    state?: Record<string, unknown>
    cards?: Array<{
      index: number
      letters: string[]
      label: string
      letter_count: number
    }>
    spread_letters?: Array<{
      index: number
      letter: string
      display: string
      is_grouped: boolean
    }>
    selected_letter?: string
    grouped_options?: string[]
    typed_text?: string
    expansion?: Record<string, unknown>
    suggestions?: Array<Record<string, unknown>>
    error?: string
  }

  interface ExpansionRequest {
    abbreviation: string
    user_id?: string
    scene_description?: string
    conversation_context?: string
    custom_context?: string  // User-defined situation context (e.g., "Giving a speech at hackathon")
    num_suggestions?: number
  }

  interface ExpansionResponse {
    abbreviation: string
    expansions: string[]
    confidences: number[]
    primary: string
    alternatives: string[]
  }

  /**
   * List available agent skills
   */
  async function getAvailableSkills(): Promise<SkillInfo[]> {
    return request<SkillInfo[]>('/api/v1/skills')
  }

  /**
   * Execute a Speaking skill action
   */
  async function speakingAction(params: SkillActionRequest): Promise<SkillActionResponse> {
    return request<SkillActionResponse>('/api/v1/skills/speaking/action', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * Expand an abbreviation to sentences
   */
  async function expandAbbreviation(params: ExpansionRequest): Promise<ExpansionResponse> {
    return request<ExpansionResponse>('/api/v1/skills/speaking/expand', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * Get model status and usage statistics
   */
  async function getModelStatus(): Promise<{ models: Record<string, Record<string, unknown>> }> {
    return request('/api/v1/models/status')
  }

  /**
   * Get recent errors for debugging
   */
  async function getRecentErrors(limit: number = 20): Promise<{
    errors: Array<Record<string, unknown>>
    counts: Record<string, number>
  }> {
    return request(`/api/v1/errors/recent?limit=${limit}`)
  }

  // ============== Predictive Text API ==============

  interface TextPredictionRequest {
    user_id: string
    partial_text?: string
    scene_description?: string | null
    conversation_history?: Array<{ speaker: string; text: string }> | null
    num_suggestions?: number
  }

  interface PredictedTextItem {
    text: string
    confidence: number
    is_completion: boolean
  }

  interface TextPredictionResponse {
    suggestions: PredictedTextItem[]
    ghost_text: string | null
    processing_time_ms: number
  }

  /**
   * Get predictive text suggestions based on context and partial input
   */
  async function predictText(params: TextPredictionRequest): Promise<TextPredictionResponse> {
    return request<TextPredictionResponse>('/api/v1/predict-text', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /**
   * Store an accepted suggestion for learning
   */
  async function acceptSuggestion(
    userId: string,
    acceptedText: string,
    sceneDescription?: string,
    conversationContext?: string
  ): Promise<void> {
    await request('/api/v1/accept-suggestion', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        accepted_text: acceptedText,
        scene_description: sceneDescription,
        conversation_context: conversationContext,
      }),
    })
  }

  // ============== Text Formatting API ==============

  /**
   * AI-powered text formatting (capitalization, punctuation, spacing)
   */
  async function formatText(text: string): Promise<{ formatted_text: string; was_modified: boolean }> {
    return request<{ formatted_text: string; was_modified: boolean }>('/api/v1/format-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // ============== Voice Cloning API ==============

  interface VoiceCloneStatus {
    is_cloned: boolean
    voice_id: string | null
    voice_name: string | null
  }

  /**
   * Clone a voice from an audio file
   */
  async function cloneVoice(file: File): Promise<VoiceCloneStatus & { status: string }> {
    const url = `${baseUrl}/api/v1/voice/clone`
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type — browser sets it with boundary for multipart
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Voice clone failed: ${response.status} - ${error}`)
    }
    return response.json()
  }

  /**
   * Get voice clone status
   */
  async function getVoiceCloneStatus(): Promise<VoiceCloneStatus> {
    return request<VoiceCloneStatus>('/api/v1/voice/clone')
  }

  /**
   * Remove cloned voice and revert to default
   */
  async function removeClonedVoice(): Promise<{ status: string }> {
    return request<{ status: string }>('/api/v1/voice/clone', {
      method: 'DELETE',
    })
  }

  // ============== User Profile ==============

  /**
   * Get user profile data
   */
  async function getProfile(userId: string): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`/api/v1/profile/${userId}`)
  }

  /**
   * Save or update user profile
   */
  async function saveProfileApi(userId: string, profile: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(`/api/v1/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
  }

  // ============== Learning Dashboard ==============

  interface LearningMetrics {
    total_interactions: number
    total_accepted: number
    total_rejected: number
    total_custom_typed: number
    prediction_accuracy: number
    suggestion_acceptance_rate: number
    vocabulary_size: number
    avg_response_time_ms: number
    strategies_tried: number
    tools_available: number
    learning_events_count: number
    created_at: string
    updated_at: string
  }

  interface TimelineSnapshot {
    ts: string
    accuracy: number
    vocab_size: number
    acceptance_rate: number
    interactions: number
    strategies_tried: number
    avg_response_time_ms: number
  }

  interface StrategyStats {
    [strategy: string]: {
      attempts: number
      successes: number
      success_rate: number
    }
  }

  interface LearningEvent {
    type: string
    ts: string
    [key: string]: unknown
  }

  interface ImprovementSummary {
    has_data: boolean
    message: string
    current_accuracy: number
    current_vocab_size?: number
    total_interactions: number
    initial_accuracy?: number
    accuracy_change?: number
    initial_vocab_size?: number
    vocab_change?: number
    snapshots_count?: number
  }

  async function getLearningMetrics(userId: string): Promise<LearningMetrics> {
    return request<LearningMetrics>(`/api/v1/learning/${userId}/metrics?simulate=true`)
  }

  async function getLearningTimeline(userId: string): Promise<TimelineSnapshot[]> {
    return request<TimelineSnapshot[]>(`/api/v1/learning/${userId}/timeline?simulate=true`)
  }

  async function getStrategyStats(userId: string): Promise<StrategyStats> {
    return request<StrategyStats>(`/api/v1/learning/${userId}/strategies?simulate=true`)
  }

  async function getLearningEvents(userId: string, limit: number = 50): Promise<LearningEvent[]> {
    return request<LearningEvent[]>(`/api/v1/learning/${userId}/events?limit=${limit}&simulate=true`)
  }

  async function getLearningImprovementSummary(userId: string): Promise<ImprovementSummary> {
    return request<ImprovementSummary>(`/api/v1/learning/${userId}/summary?simulate=true`)
  }

  return {
    checkHealth,
    predictPhrases,
    submitFeedback,
    getUserPhrases,
    clearSession,
    getWordSuggestions,
    // Skills API
    getAvailableSkills,
    speakingAction,
    expandAbbreviation,
    getModelStatus,
    getRecentErrors,
    // Predictive Text
    predictText,
    acceptSuggestion,
    formatText,
    // Voice Cloning
    cloneVoice,
    getVoiceCloneStatus,
    removeClonedVoice,
    // User Profile
    getProfile,
    saveProfileApi,
    // Learning Dashboard
    getLearningMetrics,
    getLearningTimeline,
    getStrategyStats,
    getLearningEvents,
    getLearningImprovementSummary,
  }
}

