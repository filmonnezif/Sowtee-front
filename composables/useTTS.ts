/**
 * SOWTEE Text-to-Speech Composable
 * Handles speech synthesis for phrase output
 */

export interface TTSState {
  isSupported: boolean
  isSpeaking: boolean
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  rate: number
  pitch: number
  volume: number
}

export function useTTS() {
  const state = reactive<TTSState>({
    isSupported: false,
    isSpeaking: false,
    voices: [],
    selectedVoice: null,
    rate: 0.9, // Slightly slower for clarity
    pitch: 1.0,
    volume: 1.0,
  })

  const synth = ref<SpeechSynthesis | null>(null)

  /**
   * Initialize TTS
   */
  function initialize() {
    if (typeof window === 'undefined') return

    if ('speechSynthesis' in window) {
      synth.value = window.speechSynthesis
      state.isSupported = true
      loadVoices()

      // Voices may load asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices
    } else {
      console.warn('Speech synthesis not supported')
    }
  }

  /**
   * Load available voices
   */
  function loadVoices() {
    if (!synth.value) return

    state.voices = synth.value.getVoices()

    // Try to select a good default voice
    if (!state.selectedVoice && state.voices.length > 0) {
      // Prefer English voices, then Arabic, then Urdu
      const englishVoice = state.voices.find(
        v => v.lang.startsWith('en') && v.localService
      )
      const arabicVoice = state.voices.find(
        v => v.lang.startsWith('ar')
      )
      const urduVoice = state.voices.find(
        v => v.lang.startsWith('ur')
      )

      state.selectedVoice = englishVoice || arabicVoice || urduVoice || state.voices[0]
    }
  }

  /**
   * Speak a phrase
   */
  function speakLocal(text: string, lang?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!synth.value || !state.isSupported) {
        reject(new Error('TTS not supported'))
        return
      }

      // Cancel any ongoing speech
      synth.value.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Select appropriate voice for language
      if (lang === 'ar') {
        const arabicVoice = state.voices.find(v => v.lang.startsWith('ar'))
        if (arabicVoice) {
          utterance.voice = arabicVoice
        }
      } else if (lang === 'ur') {
        const urduVoice = state.voices.find(v => v.lang.startsWith('ur'))
        if (urduVoice) {
          utterance.voice = urduVoice
        }
      } else if (state.selectedVoice) {
        utterance.voice = state.selectedVoice
      }

      utterance.rate = state.rate
      utterance.pitch = state.pitch
      utterance.volume = state.volume

      utterance.onstart = () => {
        state.isSpeaking = true
      }

      utterance.onend = () => {
        state.isSpeaking = false
        resolve()
      }

      utterance.onerror = (event) => {
        state.isSpeaking = false
        reject(new Error(`TTS Error: ${event.error}`))
      }

      synth.value.speak(utterance)
    })
  }

  /**
   * Speak a phrase using Groq TTS (backend stream)
   */
  async function speak(text: string, lang?: string, context?: {
    scene_description?: string
    conversation_context?: string
    custom_context?: string
  }): Promise<void> {
    if (!text) return

    // Check if we should use remote TTS (hardcoded pref for now or checking supported)
    // For "fast method" using Groq, we prioritize remote.

    state.isSpeaking = true

    try {
      const config = useRuntimeConfig()
      const baseUrl = config.public.apiBaseUrl || 'http://localhost:8000' // Fallback if config issues

      const response = await fetch(`${baseUrl}/api/v1/tts/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: lang || 'en',
          enrich_directions: true,
          ...(context?.scene_description && { scene_description: context.scene_description }),
          ...(context?.conversation_context && { conversation_context: context.conversation_context }),
          ...(context?.custom_context && { custom_context: context.custom_context }),
        })
      })

      if (!response.ok) throw new Error(`Remote TTS failed: ${response.status}`)

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          state.isSpeaking = false
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.onerror = (e) => {
          state.isSpeaking = false
          URL.revokeObjectURL(url)
          console.error("Audio playback error", e)
          // Try local fallback? 
          // If audio playback fails, maybe codec issue. But usually MP3 works everywhere.
          // We will attempt local fallback in the catch block of the outer try.
          reject(e)
        }
        audio.play().catch(e => {
          // Autoplay policy might block
          reject(e)
        })
      })

    } catch (e) {
      console.warn('Remote TTS failed, falling back to local synthesis', e)
      state.isSpeaking = false // Reset before local call
      return speakLocal(text, lang)
    }
  }

  /**
   * Stop speaking
   */
  function stop() {
    if (synth.value) {
      synth.value.cancel()
      state.isSpeaking = false
    }
  }

  /**
   * Set the preferred voice
   */
  function setVoice(voice: SpeechSynthesisVoice) {
    state.selectedVoice = voice
  }

  /**
   * Get voices by language
   */
  function getVoicesByLang(langPrefix: string): SpeechSynthesisVoice[] {
    return state.voices.filter(v => v.lang.startsWith(langPrefix))
  }

  // Initialize on mount
  onMounted(() => {
    initialize()
  })

  return {
    state: readonly(state),
    speak,
    stop,
    setVoice,
    getVoicesByLang,
    initialize,
  }
}
