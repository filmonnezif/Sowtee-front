/**
 * SOWTEE Speaking Skill Store
 * State management for the Speaking skill with letter cards and predictive text suggestions.
 */

import { defineStore } from 'pinia'

export type CardLevel = 'cards' | 'letters'

export interface LetterCard {
    index: number
    letters: string[]
    label: string
    letterCount: number
}

export interface SpreadLetter {
    index: number
    letter: string
    display: string
    isGrouped: boolean
}

export interface ExpansionResult {
    abbreviation: string
    expansions: string[]
    confidences: number[]
    selectedIndex: number
    primary: string
    alternatives: string[]
}

export interface PredictedTextItem {
    text: string
    confidence: number
    is_completion: boolean
}

export interface StateSnapshot {
    level: CardLevel
    typedText: string
    fullSentence: string
    selectedCardIndex: number | null
    spreadLetters: SpreadLetter[]
}

export interface SpeakingState {
    // Letter card state
    level: CardLevel
    selectedCardIndex: number | null
    cards: LetterCard[]
    spreadLetters: SpreadLetter[]
    typedText: string

    // Highlighted item (for keyboard/gaze navigation)
    highlightedIndex: number | null

    // Expansion state (kept for backward compat)
    isExpanding: boolean
    expansion: ExpansionResult | null

    // Sentence suggestions (old)
    suggestions: Array<{ sentence: string; confidence: number }>
    selectedSuggestionIndex: number

    // Predictive text state (NEW)
    fullSentence: string              // Accumulated sentence text (longform)
    predictiveSuggestions: PredictedTextItem[]  // Prediction chips
    predictiveGhostText: string | null // Ghost text shown faded in text field
    isFetchingSuggestions: boolean
    spokenHistory: string[]            // Sentences spoken this session

    // Undo history
    stateHistory: StateSnapshot[]

    // UI state
    showSuggestions: boolean
    isSpeaking: boolean
    error: string | null
}

export const useSpeakingStore = defineStore('speaking', {
    state: (): SpeakingState => ({
        level: 'cards',
        selectedCardIndex: null,
        cards: [],
        spreadLetters: [],
        typedText: '',
        highlightedIndex: null,
        isExpanding: false,
        expansion: null,
        suggestions: [],
        selectedSuggestionIndex: 0,
        fullSentence: '',
        predictiveSuggestions: [],
        predictiveGhostText: null,
        isFetchingSuggestions: false,
        spokenHistory: [],
        stateHistory: [],
        showSuggestions: false,
        isSpeaking: false,
        error: null,
    }),

    getters: {
        // Current items to display (cards or letters)
        currentItems(state): LetterCard[] | SpreadLetter[] {
            return state.level === 'cards' ? state.cards : state.spreadLetters
        },

        // Number of items currently displayed
        itemCount(state): number {
            return state.level === 'cards' ? state.cards.length : state.spreadLetters.length
        },

        // Whether we have typed text ready for expansion
        hasTypedText(state): boolean {
            return state.typedText.trim().length > 0
        },

        // Whether undo is possible
        canUndo(state): boolean {
            return state.stateHistory.length > 0
        },

        // Primary suggestion (shown in center)
        primarySuggestion(state): string | null {
            return state.expansion?.primary || null
        },

        // Alternative suggestions (shown at top)
        alternativeSuggestions(state): string[] {
            return state.expansion?.alternatives || []
        },

        // Selected sentence to speak
        selectedSentence(state): string | null {
            if (!state.expansion) return null
            return state.expansion.expansions[state.expansion.selectedIndex] || null
        },
    },

    actions: {
        // Push a state snapshot onto the undo stack (max 20)
        pushHistory() {
            this.stateHistory.push({
                level: this.level,
                typedText: this.typedText,
                fullSentence: this.fullSentence,
                selectedCardIndex: this.selectedCardIndex,
                spreadLetters: [...this.spreadLetters],
            })
            if (this.stateHistory.length > 20) {
                this.stateHistory.shift()
            }
        },

        // Undo — restore the last state snapshot
        undo() {
            const snapshot = this.stateHistory.pop()
            if (!snapshot) return
            this.level = snapshot.level
            this.typedText = snapshot.typedText
            this.fullSentence = snapshot.fullSentence
            this.selectedCardIndex = snapshot.selectedCardIndex
            this.spreadLetters = snapshot.spreadLetters
            this.highlightedIndex = null
        },

        // Initialize with cards from API
        setCards(cards: LetterCard[]) {
            this.cards = cards
            this.level = 'cards'
            this.spreadLetters = []
            this.selectedCardIndex = null
        },

        // Set spread letters after card selection
        setSpreadLetters(letters: SpreadLetter[], cardIndex: number) {
            this.pushHistory()
            this.spreadLetters = letters
            this.selectedCardIndex = cardIndex
            this.level = 'letters'
            this.highlightedIndex = null
        },

        // Add a letter to typed text
        addLetter(letter: string) {
            this.pushHistory()
            this.typedText += letter.toLowerCase()
            // Reset to cards after letter selection
            this.level = 'cards'
            this.selectedCardIndex = null
            this.spreadLetters = []
            this.highlightedIndex = null
        },

        // Set typed text (from API state)
        setTypedText(text: string, skipHistory = false) {
            console.log('[Speaking Store] setTypedText:', text)
            if (!skipHistory && text !== this.typedText) this.pushHistory()
            this.typedText = text
        },

        // Backspace - remove last character
        async backspace() {
            const api = useApi()
            const appStore = useAppStore()

            console.log('[Speaking Store] backspace called, current text:', this.typedText)

            // Optimistic update
            if (this.typedText.length > 0) {
                this.typedText = this.typedText.slice(0, -1)
            }

            try {
                const response = await api.speakingAction({
                    user_id: appStore.userId,
                    action: 'backspace',
                })

                if (response.typed_text !== undefined) {
                    this.typedText = response.typed_text
                }
            } catch (error) {
                console.error('Backspace failed:', error)
            }
        },

        // Add space (between abbreviations)
        async addSpace() {
            const api = useApi()
            const appStore = useAppStore()

            this.pushHistory()

            // Optimistic update
            if (this.typedText && !this.typedText.endsWith(' ')) {
                this.typedText += ' '
            }

            try {
                const response = await api.speakingAction({
                    user_id: appStore.userId,
                    action: 'add_space',
                })

                if (response.typed_text !== undefined) {
                    this.typedText = response.typed_text.toLowerCase()
                }
            } catch (error) {
                console.error('Add space failed:', error)
            }
        },

        // Clear all typed text
        async clearText() {
            const api = useApi()
            const appStore = useAppStore()

            console.log('[Speaking Store] clearText called')
            this.typedText = ''
            this.expansion = null
            this.showSuggestions = false

            try {
                await api.speakingAction({
                    user_id: appStore.userId,
                    action: 'reset',
                })
            } catch (error) {
                console.error('Clear text failed:', error)
            }
        },

        // Go back from letters to cards
        goBack() {
            if (this.level === 'letters') {
                this.pushHistory()
                this.level = 'cards'
                this.selectedCardIndex = null
                this.spreadLetters = []
                this.highlightedIndex = null
            }
        },

        // Set highlighted index for keyboard/gaze navigation
        setHighlightedIndex(index: number | null) {
            this.highlightedIndex = index
        },

        // Navigate highlight (keyboard arrows)
        navigateHighlight(direction: 'up' | 'down' | 'left' | 'right') {
            const count = this.itemCount
            if (count === 0) return

            let current = this.highlightedIndex ?? -1

            // 5-card/letter grid navigation
            // Layout: [0] [1] [2]
            //         [3] [4]
            if (direction === 'up') {
                if (current >= 3) current -= 3
                else if (current === -1) current = 0
            } else if (direction === 'down') {
                if (current < 2 && current + 3 < count) current += 3
                else if (current === -1) current = 3
            } else if (direction === 'left') {
                if (current > 0) current -= 1
                else if (current === -1) current = 0
            } else if (direction === 'right') {
                if (current < count - 1) current += 1
                else if (current === -1) current = 0
            }

            this.highlightedIndex = Math.max(0, Math.min(current, count - 1))
        },

        // Set expansion result
        setExpansion(expansion: ExpansionResult | null) {
            this.expansion = expansion
            this.showSuggestions = expansion !== null
            this.isExpanding = false
        },

        // Navigate through expansion alternatives
        nextExpansion() {
            if (!this.expansion || this.expansion.expansions.length <= 1) return

            this.expansion.selectedIndex =
                (this.expansion.selectedIndex + 1) % this.expansion.expansions.length
        },

        // Select previous expansion
        prevExpansion() {
            if (!this.expansion || this.expansion.expansions.length <= 1) return

            this.expansion.selectedIndex =
                (this.expansion.selectedIndex - 1 + this.expansion.expansions.length) %
                this.expansion.expansions.length
        },

        // Confirm current expansion and clear
        confirmExpansion(): string | null {
            const sentence = this.selectedSentence
            if (sentence) {
                this.clearText()
                this.expansion = null
                this.showSuggestions = false
            }
            return sentence
        },

        // Discard current expansion
        discardExpansion() {
            this.expansion = null
            this.showSuggestions = false
        },

        // Set loading state
        setExpanding(isExpanding: boolean) {
            this.isExpanding = isExpanding
        },

        // Set speaking state
        setSpeaking(isSpeaking: boolean) {
            this.isSpeaking = isSpeaking
        },

        // Set error
        setError(error: string | null) {
            this.error = error
        },

        // ============== Predictive Text Actions ==============

        // Set the full sentence text
        setSentenceText(text: string) {
            this.pushHistory()
            this.fullSentence = text
        },

        // Append text to the sentence (when accepting a suggestion)
        appendToSentence(text: string) {
            this.pushHistory()
            if (this.fullSentence && !this.fullSentence.endsWith(' ')) {
                this.fullSentence += ' '
            }
            this.fullSentence += text
        },

        // Set predictive suggestions
        setPredictiveSuggestions(suggestions: PredictedTextItem[]) {
            this.predictiveSuggestions = suggestions
        },

        // Set ghost text
        setPredictiveGhostText(text: string | null) {
            this.predictiveGhostText = text
        },

        // Set fetching state
        setFetchingSuggestions(fetching: boolean) {
            this.isFetchingSuggestions = fetching
        },

        // Confirm sentence and speak (returns the text to speak)
        confirmSentence(): string | null {
            const text = this.fullSentence.trim()
            if (!text) return null
            this.spokenHistory.push(text)
            this.fullSentence = ''
            this.predictiveSuggestions = []
            this.predictiveGhostText = null
            return text
        },

        // Clear sentence without speaking
        clearSentence() {
            this.pushHistory()
            this.fullSentence = ''
            this.predictiveSuggestions = []
            this.predictiveGhostText = null
        },

        // Full reset
        reset() {
            this.level = 'cards'
            this.selectedCardIndex = null
            this.spreadLetters = []
            this.typedText = ''
            this.highlightedIndex = null
            this.expansion = null
            this.suggestions = []
            this.selectedSuggestionIndex = 0
            this.fullSentence = ''
            this.predictiveSuggestions = []
            this.predictiveGhostText = null
            this.isFetchingSuggestions = false
            this.spokenHistory = []
            this.stateHistory = []
            this.showSuggestions = false
            this.isExpanding = false
            this.isSpeaking = false
            this.error = null
        },
    },
})
