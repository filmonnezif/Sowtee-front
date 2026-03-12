/**
 * SOWTEE API Types
 * TypeScript types matching the backend Pydantic schemas
 */

export type InteractionMode = 'touch' | 'eye_gaze' | 'switch'

export type AgentPhase = 'perceive' | 'reason' | 'act' | 'learn'

export interface DetectedObject {
  label: string
  confidence: number
  bounding_box?: {
    x: number
    y: number
    width: number
    height: number
  }
  attributes: string[]
}

export interface VisualContext {
  scene_description: string
  detected_objects: DetectedObject[]
  environmental_context: string
  activity_inference: string
  timestamp: string
}

export interface MemoryRecord {
  id: string
  user_id: string
  visual_context_summary: string
  selected_phrase: string
  objects_present: string[]
  environmental_context: string
  selection_count: number
  last_used: string
  created_at: string
}

export interface PhraseCandidate {
  phrase: string
  phrase_arabic?: string
  confidence: number
  reasoning: string
  source: 'vision' | 'memory' | 'rules' | 'fallback' | 'hybrid'
  related_objects: string[]
}

export interface ContextAnalysis {
  visual_context: VisualContext
  retrieved_memories: MemoryRecord[]
  reasoning_trace: string[]
  processing_time_ms: number
}

export type PredictionMode = 'full' | 'vision_only' | 'abbreviation'

export interface PredictionRequest {
  user_id: string
  image_base64: string
  interaction_mode: InteractionMode
  mode?: PredictionMode
  session_id?: string
  additional_context?: string
}

export interface PredictionResponse {
  session_id: string
  phrases: PhraseCandidate[]
  context_analysis: ContextAnalysis
  agent_phase: AgentPhase
  processing_time_ms: number
}

export interface UserFeedback {
  session_id: string
  user_id: string
  selected_phrase: string
  was_from_predictions: boolean
  custom_phrase?: string
  visual_context_summary: string
  objects_present: string[]
  timestamp?: string
}

export interface AgentState {
  session_id: string
  user_id: string
  current_phase: AgentPhase
  cycle_count: number
  visual_context?: VisualContext
  candidate_phrases: PhraseCandidate[]
  reasoning_trace: string[]
  last_updated: string
}

export interface PhraseFrequency {
  phrase: string
  count: number
}

// Word suggestion for sentence building
export interface WordSuggestion {
  word: string
  word_arabic?: string
  confidence: number
  category: 'starter' | 'subject' | 'verb' | 'object' | 'modifier' | 'ending'
  related_to_scene: boolean
}

// Request for word suggestions
export interface WordSuggestionRequest {
  user_id: string
  image_base64?: string
  current_sentence: string[]
  scene_context?: string
  conversation_context?: string[]
  interaction_mode: InteractionMode
}

// Response with word suggestions
export interface WordSuggestionResponse {
  session_id: string
  words: WordSuggestion[]
  scene_description?: string
  processing_time_ms: number
}

export interface HealthResponse {
  status: string
  version: string
  services: Record<string, string>
}
