/**
 * SOWTEE Speech Recognition Composable
 * Robust surrounding voice transcription using VAD + Groq Whisper.
 */

import { onMounted, onUnmounted, readonly, ref } from 'vue'

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

const VAD_INTERVAL_MS = 120
const SILENCE_HOLD_MS = 700
const MIN_SPEECH_MS = 380
const MAX_SEGMENT_MS = 12000
const MIN_SEGMENT_BYTES = 3200
const SPEECH_START_RMS = 0.04
const SPEECH_CONTINUE_RMS = 0.022
const VAD_START_FRAMES = 2
const MAX_HISTORY_ENTRIES = 50

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

    let mediaStream: MediaStream | null = null
    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let sourceNode: MediaStreamAudioSourceNode | null = null
    let vadInterval: ReturnType<typeof setInterval> | null = null
    let muteTimeout: ReturnType<typeof setTimeout> | null = null

    let activeSegmentRecorder: MediaRecorder | null = null
    let activeSegmentChunks: Blob[] = []
    let finalizeInProgress = false
    let isSpeechActive = false
    let speechStartedAt = 0
    let lastSpeechDetectedAt = 0
    let consecutiveSpeechFrames = 0
    let noiseFloorRms = 0.008

    let transcriptionQueue: Promise<void> = Promise.resolve()

    const checkSupport = () => {
        if (typeof window === 'undefined') {
            isSupported.value = false
            return false
        }

        isSupported.value = Boolean(
            navigator.mediaDevices?.getUserMedia
            && window.MediaRecorder
            && window.AudioContext
        )

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

    const cleanupMedia = () => {
        if (vadInterval) {
            clearInterval(vadInterval)
            vadInterval = null
        }

        if (activeSegmentRecorder && activeSegmentRecorder.state !== 'inactive') {
            activeSegmentRecorder.stop()
        }
        activeSegmentRecorder = null

        if (sourceNode) {
            sourceNode.disconnect()
            sourceNode = null
        }

        if (analyser) {
            analyser.disconnect()
            analyser = null
        }

        if (audioContext) {
            audioContext.close().catch(() => undefined)
            audioContext = null
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop())
            mediaStream = null
        }

        activeSegmentChunks = []
        finalizeInProgress = false
        isSpeechActive = false
        speechStartedAt = 0
        lastSpeechDetectedAt = 0
        consecutiveSpeechFrames = 0
        noiseFloorRms = 0.008
    }

    const updateNoiseFloor = (rms: number) => {
        if (!Number.isFinite(rms) || rms <= 0) return
        if (isSpeechActive) return

        const clamped = Math.max(0.001, Math.min(0.05, rms))
        noiseFloorRms = (noiseFloorRms * 0.92) + (clamped * 0.08)
    }

    const getDynamicStartThreshold = () => {
        return Math.max(SPEECH_START_RMS, noiseFloorRms * 3.0)
    }

    const getDynamicContinueThreshold = () => {
        return Math.max(SPEECH_CONTINUE_RMS, noiseFloorRms * 2.2)
    }

    const getPreferredMimeType = () => {
        if (typeof MediaRecorder === 'undefined') return 'audio/webm'
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
        if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
        if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
        return ''
    }

    const getRmsLevel = (): number => {
        if (!analyser) return 0

        const buffer = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buffer)

        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
            const value = buffer[i]
            sum += value * value
        }

        return Math.sqrt(sum / buffer.length)
    }

    const enqueueTranscription = (segmentBlob: Blob, segmentDurationMs: number) => {
        const languageCode = mapLanguageToTranscription(language.value)

        transcriptionQueue = transcriptionQueue
            .then(async () => {
                if (isMuted.value || !isListening.value) return

                currentTranscript.value = 'Transcribing…'

                const result = await api.transcribeSurroundingSpeech(segmentBlob, languageCode)
                const text = result.text?.trim() || ''
                const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
                const alnum = normalized.replace(/[^a-z0-9\u0600-\u06ff]/g, '')
                const tokenCount = normalized.length > 0 ? normalized.split(' ').filter(Boolean).length : 0
                const isLikelyNoise = (
                    !result.has_speech
                    || (result.speech_confidence !== null && result.speech_confidence < 0.62)
                    || (result.avg_no_speech_prob !== null && result.avg_no_speech_prob > 0.35)
                    || normalized.length === 0
                    || !/[a-z\u0600-\u06ff]/.test(normalized)
                    || alnum.length < 3
                    || (tokenCount <= 1 && alnum.length <= 3)
                )

                if (!text || isLikelyNoise) {
                    currentTranscript.value = ''
                    return
                }

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
                }, Math.max(1200, Math.min(3500, segmentDurationMs + 500)))
            })
            .catch((err) => {
                console.error('[SpeechRecognition] Transcription failed:', err)
                error.value = 'Transcription failed. Retrying with next speech segment.'
                currentTranscript.value = ''
            })
    }

    const startSegmentRecorder = () => {
        if (!mediaStream || activeSegmentRecorder) return

        const mimeType = getPreferredMimeType()
        const recorder = mimeType
            ? new MediaRecorder(mediaStream, { mimeType })
            : new MediaRecorder(mediaStream)

        activeSegmentChunks = []
        recorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
                activeSegmentChunks.push(event.data)
            }
        }

        recorder.start(250)
        activeSegmentRecorder = recorder
    }

    const finalizeActiveSegment = async () => {
        if (!isSpeechActive || finalizeInProgress) return

        finalizeInProgress = true
        const durationMs = Date.now() - speechStartedAt
        const recorder = activeSegmentRecorder

        isSpeechActive = false
        speechStartedAt = 0
        lastSpeechDetectedAt = 0
        currentTranscript.value = ''

        if (!recorder) {
            activeSegmentChunks = []
            finalizeInProgress = false
            return
        }

        const stopped = new Promise<void>((resolve) => {
            recorder.onstop = () => resolve()
            if (recorder.state !== 'inactive') recorder.stop()
            else resolve()
        })

        await stopped

        const segmentBlob = new Blob(activeSegmentChunks, { type: recorder.mimeType || 'audio/webm' })

        activeSegmentRecorder = null
        activeSegmentChunks = []
        finalizeInProgress = false

        if (isMuted.value || durationMs < MIN_SPEECH_MS || segmentBlob.size < MIN_SEGMENT_BYTES) {
            return
        }

        enqueueTranscription(segmentBlob, durationMs)
    }

    const startVadLoop = () => {
        if (vadInterval) {
            clearInterval(vadInterval)
            vadInterval = null
        }

        vadInterval = setInterval(() => {
            if (!isListening.value || isMuted.value) return

            const now = Date.now()
            const rms = getRmsLevel()
            updateNoiseFloor(rms)
            const dynamicStartThreshold = getDynamicStartThreshold()
            const dynamicContinueThreshold = getDynamicContinueThreshold()

            if (!isSpeechActive) {
                if (rms >= dynamicStartThreshold) {
                    consecutiveSpeechFrames += 1
                } else {
                    consecutiveSpeechFrames = 0
                }

                if (consecutiveSpeechFrames >= VAD_START_FRAMES) {
                    isSpeechActive = true
                    speechStartedAt = now
                    lastSpeechDetectedAt = now
                    consecutiveSpeechFrames = 0
                    startSegmentRecorder()
                    currentTranscript.value = 'Detected speech…'
                }
                return
            }

            if (rms >= dynamicContinueThreshold) {
                lastSpeechDetectedAt = now
            }

            const elapsed = now - speechStartedAt
            const silenceElapsed = now - lastSpeechDetectedAt

            if (elapsed >= MAX_SEGMENT_MS || silenceElapsed >= SILENCE_HOLD_MS) {
                void finalizeActiveSegment()
            }
        }, VAD_INTERVAL_MS)
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
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                },
            })

            audioContext = new AudioContext()
            sourceNode = audioContext.createMediaStreamSource(mediaStream)
            analyser = audioContext.createAnalyser()
            analyser.fftSize = 2048
            analyser.smoothingTimeConstant = 0.15
            sourceNode.connect(analyser)

            isListening.value = true
            appStore.setListeningToSpeech(true)
            error.value = null
            currentTranscript.value = ''

            startVadLoop()
            return true
        } catch (e) {
            console.error('[SpeechRecognition] Failed to start listening:', e)
            error.value = 'Failed to access microphone. Please allow microphone access.'
            cleanupMedia()
            isListening.value = false
            appStore.setListeningToSpeech(false)
            return false
        }
    }

    const stopListening = () => {
        if (isSpeechActive) {
            void finalizeActiveSegment()
        }

        cleanupMedia()
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
            stopListening()
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
                startListening().catch((err) => {
                    console.error('[SpeechRecognition] Failed to resume after TTS:', err)
                })
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
