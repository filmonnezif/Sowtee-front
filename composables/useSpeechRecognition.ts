/**
 * SOWTEE Speech Recognition Composable
 * Listens to surroundings and transcribes speech for conversation context
 * Uses Web Speech API for real-time speech-to-text
 */

import { ref, readonly, onMounted, onUnmounted, type Ref } from 'vue'

export interface TranscriptEntry {
    text: string
    timestamp: Date
    isFinal: boolean
    speaker: 'other' | 'user'
}

export interface TranscriptEntry {
    text: string
    timestamp: Date
    isFinal: boolean
    speaker: 'other' | 'user' // 'other' for surroundings, 'user' for user's spoken sentences
}

export interface SpeechRecognitionState {
    isListening: boolean
    isSupported: boolean
    currentTranscript: string
    conversationHistory: TranscriptEntry[]
    error: string | null
}

export function useSpeechRecognition() {
    // State
    const isListening = ref(false)
    const isSupported = ref(false)
    const currentTranscript = ref('')
    const conversationHistory = ref<TranscriptEntry[]>([])
    const error = ref<string | null>(null)

    // TTS muting state - prevents picking up computer's own voice
    const isMuted = ref(false)
    let muteTimeout: ReturnType<typeof setTimeout> | null = null

    // Speech recognition instance (typed as any for browser compatibility)
    let recognition: any = null

    // Check browser support
    const checkSupport = () => {
        if (typeof window !== 'undefined') {
            const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            isSupported.value = !!SpeechRecognitionClass
            return isSupported.value
        }
        return false
    }

    // Initialize speech recognition
    const initRecognition = () => {
        if (!checkSupport()) {
            error.value = 'Speech recognition is not supported in this browser'
            return false
        }

        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        recognition = new SpeechRecognitionClass()

        // Configure for continuous listening
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US' // Can be changed for Arabic support
        recognition.maxAlternatives = 1

        // Event handlers
        recognition.onstart = () => {
            isListening.value = true
            error.value = null
            console.log('[SpeechRecognition] Started listening')
        }

        recognition.onend = () => {
            console.log('[SpeechRecognition] Stopped')
            // Auto-restart if we want continuous listening
            if (isListening.value) {
                try {
                    recognition?.start()
                } catch (e) {
                    // Already started, ignore
                }
            }
        }

        recognition.onerror = (event: any) => {
            console.error('[SpeechRecognition] Error:', event.error)

            switch (event.error) {
                case 'not-allowed':
                    error.value = 'Microphone access denied. Please allow microphone access.'
                    isListening.value = false
                    break
                case 'no-speech':
                    // Normal when there's silence, don't treat as error
                    break
                case 'audio-capture':
                    error.value = 'No microphone found. Please connect a microphone.'
                    isListening.value = false
                    break
                case 'network':
                    error.value = 'Network error. Check your internet connection.'
                    break
                default:
                    error.value = `Speech recognition error: ${event.error}`
            }
        }

        recognition.onresult = (event: any) => {
            // Skip processing if muted (during TTS playback)
            if (isMuted.value) {
                console.log('[SpeechRecognition] Ignoring transcript during TTS playback')
                return
            }

            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                const transcript = result[0].transcript

                if (result.isFinal) {
                    finalTranscript += transcript
                } else {
                    interimTranscript += transcript
                }
            }

            // Update current (interim) transcript
            currentTranscript.value = interimTranscript || finalTranscript

            // Add final transcripts to history
            if (finalTranscript.trim()) {
                const entry: TranscriptEntry = {
                    text: finalTranscript.trim(),
                    timestamp: new Date(),
                    isFinal: true,
                    speaker: 'other', // Surrounding speech
                }

                conversationHistory.value.push(entry)

                // Keep only last 50 entries
                if (conversationHistory.value.length > 50) {
                    conversationHistory.value = conversationHistory.value.slice(-50)
                }

                console.log('[SpeechRecognition] Transcribed:', finalTranscript.trim())
            }
        }

        return true
    }

    // Start listening
    const startListening = async () => {
        if (!recognition && !initRecognition()) {
            return false
        }

        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true })

            recognition?.start()
            return true
        } catch (e) {
            error.value = 'Failed to access microphone. Please allow microphone access.'
            console.error('[SpeechRecognition] Failed to start:', e)
            return false
        }
    }

    // Stop listening
    const stopListening = () => {
        isListening.value = false
        if (recognition) {
            recognition.stop()
        }
        currentTranscript.value = ''
    }

    // Toggle listening
    const toggleListening = async () => {
        if (isListening.value) {
            stopListening()
        } else {
            await startListening()
        }
    }

    // Add user's spoken sentence to history (what the TTS said)
    const addUserSentence = (sentence: string) => {
        const entry: TranscriptEntry = {
            text: sentence,
            timestamp: new Date(),
            isFinal: true,
            speaker: 'user',
        }
        conversationHistory.value.push(entry)
    }

    // Get recent conversation context as a string
    const getConversationContext = (maxEntries: number = 10): string => {
        const recent = conversationHistory.value.slice(-maxEntries)
        return recent
            .map(entry => `${entry.speaker === 'user' ? 'User' : 'Other'}: ${entry.text}`)
            .join('\n')
    }

    // Get just the recent "other" speech (what was heard)
    const getRecentHeardSpeech = (maxEntries: number = 5): string[] => {
        return conversationHistory.value
            .filter(entry => entry.speaker === 'other')
            .slice(-maxEntries)
            .map(entry => entry.text)
    }

    // Clear history
    const clearHistory = () => {
        conversationHistory.value = []
    }

    // Mute speech recognition during TTS playback
    const muteForTTS = () => {
        isMuted.value = true
        // Clear any pending unmute timeout
        if (muteTimeout) {
            clearTimeout(muteTimeout)
            muteTimeout = null
        }
        console.log('[SpeechRecognition] Muted for TTS')
    }

    // Unmute after TTS ends (with delay to avoid echo)
    const unmuteAfterTTS = () => {
        // Wait 500ms after TTS ends to avoid picking up echo/reverb
        muteTimeout = setTimeout(() => {
            isMuted.value = false
            console.log('[SpeechRecognition] Unmuted after TTS')
        }, 500)
    }

    // Set language
    const setLanguage = (lang: 'en-US' | 'ar-SA' | 'ar-EG') => {
        if (recognition) {
            recognition.lang = lang
        }
    }

    // Cleanup on unmount
    onUnmounted(() => {
        stopListening()
    })

    // Initialize on mount
    onMounted(() => {
        checkSupport()
    })

    return {
        // State
        isListening: readonly(isListening),
        isSupported: readonly(isSupported),
        currentTranscript: readonly(currentTranscript),
        conversationHistory: readonly(conversationHistory),
        error: readonly(error),
        isMuted: readonly(isMuted),

        // Actions
        startListening,
        stopListening,
        toggleListening,
        addUserSentence,
        clearHistory,
        setLanguage,
        muteForTTS,
        unmuteAfterTTS,

        // Getters
        getConversationContext,
        getRecentHeardSpeech,
    }
}
