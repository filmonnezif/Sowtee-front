/**
 * SOWTEE Predictive Text Composable
 * Manages the suggestion lifecycle for continuous text prediction.
 * 
 * - Debounced API calls when user types via cards
 * - Ghost text (inline faded suggestion)
 * - Preemptive suggestions before typing
 * - Accept/reject suggestions
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useAppStore } from '~/stores/app'

interface PredictedText {
    text: string
    confidence: number
    is_completion: boolean
}

interface PredictiveTextOptions {
    /** Debounce delay in ms for typing predictions */
    debounceMs?: number
    /** Number of suggestions to request */
    numSuggestions?: number
}

export function usePredictiveText(options: PredictiveTextOptions = {}) {
    const { debounceMs = 400, numSuggestions = 5 } = options

    const api = useApi()
    const appStore = useAppStore()

    // State
    const suggestions = ref<PredictedText[]>([])
    const ghostText = ref<string | null>(null)
    const isFetching = ref(false)
    const lastFetchTime = ref(0)
    const error = ref<string | null>(null)

    // Debounce timer
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    /**
     * Fetch predictions from the API.
     */
    async function fetchPredictions(
        partialText: string = '',
        sceneDescription?: string | null,
        conversationHistory?: Array<{ speaker: string; text: string }> | null,
    ) {
        // Clear debounce
        if (debounceTimer) {
            clearTimeout(debounceTimer)
            debounceTimer = null
        }

        isFetching.value = true
        error.value = null

        try {
            const result = await api.predictText({
                user_id: appStore.userId,
                partial_text: partialText || '',
                scene_description: sceneDescription || appStore.sceneDescription || null,
                conversation_history: conversationHistory || null,
                num_suggestions: numSuggestions,
            })

            suggestions.value = result.suggestions || []
            ghostText.value = result.ghost_text || null
            lastFetchTime.value = Date.now()
        } catch (e: any) {
            console.error('[PredictiveText] Fetch failed:', e)
            error.value = e.message || 'Prediction failed'
        } finally {
            isFetching.value = false
        }
    }

    /**
     * Fetch predictions with debounce (call on each keystroke).
     */
    function fetchPredictionsDebounced(
        partialText: string = '',
        sceneDescription?: string | null,
        conversationHistory?: Array<{ speaker: string; text: string }> | null,
    ) {
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
            fetchPredictions(partialText, sceneDescription, conversationHistory)
        }, debounceMs)
    }

    /**
     * Accept a suggestion — inserts text and stores for learning.
     */
    async function acceptSuggestion(suggestion: PredictedText) {
        try {
            // Store for learning (fire and forget)
            api.acceptSuggestion(
                appStore.userId,
                suggestion.text,
                appStore.sceneDescription || undefined,
            ).catch(e => console.warn('[PredictiveText] Failed to store acceptance:', e))
        } catch (e) {
            // Non-critical — don't block the user
        }

        // Clear current ghost text
        ghostText.value = null
    }

    /**
     * Accept the current ghost text suggestion.
     */
    function acceptGhostText(): string | null {
        if (!ghostText.value) return null
        const text = ghostText.value

        // Store for learning
        api.acceptSuggestion(
            appStore.userId,
            text,
            appStore.sceneDescription || undefined,
        ).catch(e => console.warn('[PredictiveText] Failed to store acceptance:', e))

        ghostText.value = null
        return text
    }

    /**
     * Fetch preemptive suggestions (no partial text — context only).
     */
    function fetchPreemptive(
        sceneDescription?: string | null,
        conversationHistory?: Array<{ speaker: string; text: string }> | null,
    ) {
        fetchPredictions('', sceneDescription, conversationHistory)
    }

    /**
     * Clear all predictions.
     */
    function clear() {
        suggestions.value = []
        ghostText.value = null
        error.value = null
        if (debounceTimer) {
            clearTimeout(debounceTimer)
            debounceTimer = null
        }
    }

    return {
        // State
        suggestions: computed(() => suggestions.value),
        ghostText: computed(() => ghostText.value),
        isFetching: computed(() => isFetching.value),
        error: computed(() => error.value),
        lastFetchTime: computed(() => lastFetchTime.value),

        // Methods
        fetchPredictions,
        fetchPredictionsDebounced,
        fetchPreemptive,
        acceptSuggestion,
        acceptGhostText,
        clear,
    }
}
