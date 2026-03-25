/**
 * SOWTEE Speech Recognition Composable
 * Uses AI-based Voice Activity Detection (@ricky0123/vad-web)
 *
 * Strategy: We use Silero VAD to locally monitor the microphone stream.
 * It accurately detects human speech and isolates it from background noise
 * or silence. We only send guaranteed human speech to the Groq Whisper API,
 * which eliminates empty "Thank you" and "Okay" hallucinations completely
 * without relying on backend blocklists.
 */

import { onMounted, onUnmounted, readonly, ref } from 'vue'
import { MicVAD } from "@ricky0123/vad-web"

export interface TranscriptEntry {
    text: string
    timestamp: Date
    isFinal: boolean
    speaker: 'other' | 'user'
}

export interface SpeechRecognitionState {
    isListening: boolean
    isSupported: boolean
    currentTranscript: string
    conversationHistory: TranscriptEntry[]
    error: string | null
}

const MAX_HISTORY_ENTRIES = 50
const TRANSCRIPTION_RETRY_COUNT = 1
const MAX_CONCURRENT_TRANSCRIPTIONS = 2

/**
 * Robustly converts Float32Array PCM audio (16kHz) to a valid WAV Blob.
 */
function float32ToWavBlob(audioData: Float32Array, sampleRate = 16000): Blob {
    const numChannels = 1
    const byteRate = sampleRate * numChannels * 2
    const blockAlign = numChannels * 2
    const dataSize = audioData.length * 2
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    // RIFF chunk descriptor
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, 'WAVE')

    // FMT sub-chunk
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // PCM size
    view.setUint16(20, 1, true) // Format=PCM
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, 16, true) // BitsPerSample

    // data sub-chunk
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Write audio data
    let offset = 44
    for (let i = 0; i < audioData.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, audioData[i]))
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }

    return new Blob([view], { type: 'audio/wav' })
}

export function useSpeechRecognition() {
    const api = useApi()
    const appStore = useAppStore()

    const isListening = ref(false)
    const isSupported = ref(false)
    const currentTranscript = ref('')
    const conversationHistory = ref<TranscriptEntry[]>([])
    const error = ref<string | null>(null)

    const isMuted = ref(false)
    const wasListeningBeforeMute = ref(false)
    const language = ref<'en-US' | 'ar-SA' | 'ar-EG'>('en-US')

    let myvad: any = null
    let pendingTranscriptions = 0
    let transcriptionQueue: Promise<void> = Promise.resolve()
    let muteTimeout: ReturnType<typeof setTimeout> | null = null

    const checkSupport = () => {
        if (typeof window === 'undefined') {
            isSupported.value = false
            return false
        }
        isSupported.value = Boolean(navigator.mediaDevices?.getUserMedia)
        return isSupported.value
    }

    const mapLanguageToTranscription = (lang: 'en-US' | 'ar-SA' | 'ar-EG') => {
        if (lang.startsWith('ar')) return 'ar'
        return 'en'
    }

    const pushConversationEntry = (entry: TranscriptEntry) => {
        conversationHistory.value.push(entry)
        if (conversationHistory.value.length > MAX_HISTORY_ENTRIES) {
            conversationHistory.value = conversationHistory.value.slice(-MAX_HISTORY_ENTRIES)
        }
        if (entry.speaker === 'other' && entry.text.trim()) {
            appStore.addHeardSpeech(entry.text.trim())
        }
    }

    const enqueueTranscription = (chunkBlob: Blob) => {
        const languageCode = mapLanguageToTranscription(language.value)

        transcriptionQueue = transcriptionQueue
            .then(async () => {
                if (isMuted.value || !isListening.value) return

                if (pendingTranscriptions >= MAX_CONCURRENT_TRANSCRIPTIONS) {
                    console.debug('[SileroVAD] Dropped chunk (too many in-flight transcriptions)')
                    return
                }

                pendingTranscriptions++

                let result: any = null
                let lastError: any = null

                for (let attempt = 0; attempt <= TRANSCRIPTION_RETRY_COUNT; attempt++) {
                    try {
                        result = await api.transcribeSurroundingSpeech(chunkBlob, languageCode)
                        break
                    } catch (err) {
                        lastError = err
                        if (attempt < TRANSCRIPTION_RETRY_COUNT) {
                            await new Promise(r => setTimeout(r, 300))
                        }
                    }
                }

                pendingTranscriptions--

                if (!result) {
                    console.error('[SpeechRecognition] Transcription failed after retries:', lastError)
                    error.value = 'Transcription failed.'
                    return
                }

                const text = result.text?.trim() || ''

                // We no longer need hallucination checks here because Silero VAD 
                // ensures there is actual human speech in the audio blob.
                if (!text) return

                console.log(`[SpeechRecognition] Transcribed:`, text)

                pushConversationEntry({
                    text,
                    timestamp: new Date(),
                    isFinal: true,
                    speaker: 'other',
                })

                currentTranscript.value = text

                setTimeout(() => {
                    if (currentTranscript.value === text) {
                        currentTranscript.value = ''
                    }
                }, 5000)
            })
            .catch((err) => {
                pendingTranscriptions = Math.max(0, pendingTranscriptions - 1)
                console.error('[SpeechRecognition] Transcription queue error:', err)
                error.value = 'Transcription failed.'
            })
    }

    const startListening = async () => {
        if (!checkSupport()) {
            error.value = 'Audio capture is not supported in this browser.'
            return false
        }

        if (isListening.value) {
            return true
        }

        try {
            console.log("[SileroVAD] Initializing model...")
            myvad = await MicVAD.new({
                model: 'legacy',
                baseAssetPath: '/vad/',
                onnxWASMBasePath: '/onnx/',
                preSpeechPadFrames: 5,   // Capture 5 frames before speech
                positiveSpeechThreshold: 0.8, // Be confident it's speech
                negativeSpeechThreshold: 0.5,
                minSpeechFrames: 3,      // Must be at least ~90ms of speech
                onSpeechStart: () => {
                    if (isMuted.value) return
                    console.log("[SileroVAD] Speech started")
                },
                onSpeechEnd: (audio: Float32Array) => {
                    if (isMuted.value || !isListening.value) return
                    console.log("[SileroVAD] Speech ended, generating WAV...")

                    // The 'audio' argument is a Float32Array of 16kHz PCM data snippet
                    // of exactly the spoken phrase, generated locally by Silero VAD.
                    const wavBlob = float32ToWavBlob(audio, 16000)
                    enqueueTranscription(wavBlob)
                },
                onVADMisfire: () => {
                    console.log("[SileroVAD] VAD misfire (too short)")
                }
            })

            myvad.start()

            isListening.value = true
            appStore.setListeningToSpeech(true)
            error.value = null

            console.log(`[SpeechRecognition] Silero AI VAD streaming started`)
            return true
        } catch (e) {
            console.error('[SpeechRecognition] Failed to start Silero VAD:', e)
            error.value = 'Failed to access microphone or load AI model.'
            isListening.value = false
            appStore.setListeningToSpeech(false)
            return false
        }
    }

    const stopListening = () => {
        if (myvad) {
            myvad.pause()
            myvad = null
        }
        pendingTranscriptions = 0
        isListening.value = false
        currentTranscript.value = ''
        appStore.setListeningToSpeech(false)
    }

    const toggleListening = async () => {
        if (isListening.value) {
            stopListening()
            return
        }
        await startListening()
    }

    const addUserSentence = (sentence: string) => {
        pushConversationEntry({
            text: sentence,
            timestamp: new Date(),
            isFinal: true,
            speaker: 'user',
        })
    }

    const getConversationContext = (maxEntries: number = 10): string => {
        const recent = conversationHistory.value.slice(-maxEntries)
        return recent
            .map(entry => `${entry.speaker === 'user' ? 'User' : 'Other'}: ${entry.text}`)
            .join('\n')
    }

    const getRecentHeardSpeech = (maxEntries: number = 5): string[] => {
        return conversationHistory.value
            .filter(entry => entry.speaker === 'other')
            .slice(-maxEntries)
            .map(entry => entry.text)
    }

    const clearHistory = () => {
        conversationHistory.value = []
    }

    const muteForTTS = () => {
        wasListeningBeforeMute.value = isListening.value
        isMuted.value = true

        if (wasListeningBeforeMute.value) {
            if (myvad) myvad.pause() // Pause instead of full stop to avoid reloading model
            isListening.value = false
            appStore.setListeningToSpeech(false)
        }

        if (muteTimeout) {
            clearTimeout(muteTimeout)
            muteTimeout = null
        }
    }

    const unmuteAfterTTS = () => {
        muteTimeout = setTimeout(() => {
            isMuted.value = false
            if (wasListeningBeforeMute.value) {
                wasListeningBeforeMute.value = false
                if (myvad) {
                    myvad.start()
                    isListening.value = true
                    appStore.setListeningToSpeech(true)
                } else {
                    startListening().catch((err) => {
                        console.error('[SpeechRecognition] Failed to resume after TTS:', err)
                    })
                }
            }
        }, 900)
    }

    const setLanguage = (lang: 'en-US' | 'ar-SA' | 'ar-EG') => {
        language.value = lang
    }

    onMounted(() => {
        checkSupport()
    })

    onUnmounted(() => {
        stopListening()
    })

    return {
        isListening: readonly(isListening),
        isSupported: readonly(isSupported),
        currentTranscript: readonly(currentTranscript),
        conversationHistory: readonly(conversationHistory),
        error: readonly(error),
        isMuted: readonly(isMuted),

        startListening,
        stopListening,
        toggleListening,
        addUserSentence,
        clearHistory,
        setLanguage,
        muteForTTS,
        unmuteAfterTTS,

        getConversationContext,
        getRecentHeardSpeech,
    }
}
