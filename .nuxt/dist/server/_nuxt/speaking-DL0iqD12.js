import { u as useTTS, a as useMinimalNavigation, _ as __nuxt_component_0 } from "./useMinimalNavigation-BTlMHU14.js";
import { u as useSpeechRecognition, _ as __nuxt_component_1 } from "./SettingsSidebar-Dc35XKMD.js";
import { ref, computed, defineComponent, watch, nextTick, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderClass, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderAttr } from "vue/server-renderer";
import { ArrowLeft, Settings, Undo2, Loader2, Volume2, Plus } from "lucide-vue-next";
import { d as defineStore, a as useAppStore, b as useI18n, n as navigateTo } from "../server.mjs";
import { u as useApi } from "./useApi-DXXljJZv.js";
import { a as useEyeGaze, b as useGazeController } from "./useGazeController-CqZ3gTDn.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "/home/filmon/Sowtee/frontend/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/filmon/Sowtee/frontend/node_modules/hookable/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/unctx/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/home/filmon/Sowtee/frontend/node_modules/defu/dist/defu.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/ufo/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/klona/dist/index.mjs";
import "framesync";
import "popmotion";
import "style-value-types";
import "/home/filmon/Sowtee/frontend/node_modules/nuxt/node_modules/cookie-es/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/destr/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/nuxt/node_modules/ohash/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/@unhead/vue/dist/index.mjs";
import "@vue/devtools-api";
const useSpeakingStore = defineStore("speaking", {
  state: () => ({
    level: "cards",
    selectedCardIndex: null,
    cards: [],
    spreadLetters: [],
    typedText: "",
    highlightedIndex: null,
    isExpanding: false,
    expansion: null,
    suggestions: [],
    selectedSuggestionIndex: 0,
    fullSentence: "",
    predictiveSuggestions: [],
    predictiveGhostText: null,
    isFetchingSuggestions: false,
    spokenHistory: [],
    stateHistory: [],
    showSuggestions: false,
    isSpeaking: false,
    error: null
  }),
  getters: {
    // Current items to display (cards or letters)
    currentItems(state) {
      return state.level === "cards" ? state.cards : state.spreadLetters;
    },
    // Number of items currently displayed
    itemCount(state) {
      return state.level === "cards" ? state.cards.length : state.spreadLetters.length;
    },
    // Whether we have typed text ready for expansion
    hasTypedText(state) {
      return state.typedText.trim().length > 0;
    },
    // Whether undo is possible
    canUndo(state) {
      return state.stateHistory.length > 0;
    },
    // Primary suggestion (shown in center)
    primarySuggestion(state) {
      return state.expansion?.primary || null;
    },
    // Alternative suggestions (shown at top)
    alternativeSuggestions(state) {
      return state.expansion?.alternatives || [];
    },
    // Selected sentence to speak
    selectedSentence(state) {
      if (!state.expansion) return null;
      return state.expansion.expansions[state.expansion.selectedIndex] || null;
    }
  },
  actions: {
    // Push a state snapshot onto the undo stack (max 20)
    pushHistory() {
      this.stateHistory.push({
        level: this.level,
        typedText: this.typedText,
        fullSentence: this.fullSentence,
        selectedCardIndex: this.selectedCardIndex,
        spreadLetters: [...this.spreadLetters]
      });
      if (this.stateHistory.length > 20) {
        this.stateHistory.shift();
      }
    },
    // Undo — restore the last state snapshot
    undo() {
      const snapshot = this.stateHistory.pop();
      if (!snapshot) return;
      this.level = snapshot.level;
      this.typedText = snapshot.typedText;
      this.fullSentence = snapshot.fullSentence;
      this.selectedCardIndex = snapshot.selectedCardIndex;
      this.spreadLetters = snapshot.spreadLetters;
      this.highlightedIndex = null;
    },
    // Initialize with cards from API
    setCards(cards) {
      this.cards = cards;
      this.level = "cards";
      this.spreadLetters = [];
      this.selectedCardIndex = null;
    },
    // Set spread letters after card selection
    setSpreadLetters(letters, cardIndex) {
      this.pushHistory();
      this.spreadLetters = letters;
      this.selectedCardIndex = cardIndex;
      this.level = "letters";
      this.highlightedIndex = null;
    },
    // Add a letter to typed text
    addLetter(letter) {
      this.pushHistory();
      this.typedText += letter.toLowerCase();
      this.level = "cards";
      this.selectedCardIndex = null;
      this.spreadLetters = [];
      this.highlightedIndex = null;
    },
    // Set typed text (from API state)
    setTypedText(text, skipHistory = false) {
      console.log("[Speaking Store] setTypedText:", text);
      if (!skipHistory && text !== this.typedText) this.pushHistory();
      this.typedText = text;
    },
    // Backspace - remove last character
    async backspace() {
      const api = useApi();
      const appStore = useAppStore();
      console.log("[Speaking Store] backspace called, current text:", this.typedText);
      if (this.typedText.length > 0) {
        this.typedText = this.typedText.slice(0, -1);
      }
      try {
        const response = await api.speakingAction({
          user_id: appStore.userId,
          action: "backspace"
        });
        if (response.typed_text !== void 0) {
          this.typedText = response.typed_text;
        }
      } catch (error) {
        console.error("Backspace failed:", error);
      }
    },
    // Add space (between abbreviations)
    async addSpace() {
      const api = useApi();
      const appStore = useAppStore();
      if (this.typedText && !this.typedText.endsWith(" ")) {
        this.typedText += " ";
      }
      try {
        const response = await api.speakingAction({
          user_id: appStore.userId,
          action: "add_space"
        });
        if (response.typed_text !== void 0) {
          this.typedText = response.typed_text;
        }
      } catch (error) {
        console.error("Add space failed:", error);
      }
    },
    // Clear all typed text
    async clearText() {
      const api = useApi();
      const appStore = useAppStore();
      console.log("[Speaking Store] clearText called");
      this.typedText = "";
      this.expansion = null;
      this.showSuggestions = false;
      try {
        await api.speakingAction({
          user_id: appStore.userId,
          action: "reset"
        });
      } catch (error) {
        console.error("Clear text failed:", error);
      }
    },
    // Go back from letters to cards
    goBack() {
      if (this.level === "letters") {
        this.pushHistory();
        this.level = "cards";
        this.selectedCardIndex = null;
        this.spreadLetters = [];
        this.highlightedIndex = null;
      }
    },
    // Set highlighted index for keyboard/gaze navigation
    setHighlightedIndex(index) {
      this.highlightedIndex = index;
    },
    // Navigate highlight (keyboard arrows)
    navigateHighlight(direction) {
      const count = this.itemCount;
      if (count === 0) return;
      let current = this.highlightedIndex ?? -1;
      if (direction === "up") {
        if (current >= 3) current -= 3;
        else if (current === -1) current = 0;
      } else if (direction === "down") {
        if (current < 2 && current + 3 < count) current += 3;
        else if (current === -1) current = 3;
      } else if (direction === "left") {
        if (current > 0) current -= 1;
        else if (current === -1) current = 0;
      } else if (direction === "right") {
        if (current < count - 1) current += 1;
        else if (current === -1) current = 0;
      }
      this.highlightedIndex = Math.max(0, Math.min(current, count - 1));
    },
    // Set expansion result
    setExpansion(expansion) {
      this.expansion = expansion;
      this.showSuggestions = expansion !== null;
      this.isExpanding = false;
    },
    // Navigate through expansion alternatives
    nextExpansion() {
      if (!this.expansion || this.expansion.expansions.length <= 1) return;
      this.expansion.selectedIndex = (this.expansion.selectedIndex + 1) % this.expansion.expansions.length;
    },
    // Select previous expansion
    prevExpansion() {
      if (!this.expansion || this.expansion.expansions.length <= 1) return;
      this.expansion.selectedIndex = (this.expansion.selectedIndex - 1 + this.expansion.expansions.length) % this.expansion.expansions.length;
    },
    // Confirm current expansion and clear
    confirmExpansion() {
      const sentence = this.selectedSentence;
      if (sentence) {
        this.clearText();
        this.expansion = null;
        this.showSuggestions = false;
      }
      return sentence;
    },
    // Discard current expansion
    discardExpansion() {
      this.expansion = null;
      this.showSuggestions = false;
    },
    // Set loading state
    setExpanding(isExpanding) {
      this.isExpanding = isExpanding;
    },
    // Set speaking state
    setSpeaking(isSpeaking) {
      this.isSpeaking = isSpeaking;
    },
    // Set error
    setError(error) {
      this.error = error;
    },
    // ============== Predictive Text Actions ==============
    // Set the full sentence text
    setSentenceText(text) {
      this.pushHistory();
      this.fullSentence = text;
    },
    // Append text to the sentence (when accepting a suggestion)
    appendToSentence(text) {
      this.pushHistory();
      if (this.fullSentence && !this.fullSentence.endsWith(" ")) {
        this.fullSentence += " ";
      }
      this.fullSentence += text;
    },
    // Set predictive suggestions
    setPredictiveSuggestions(suggestions) {
      this.predictiveSuggestions = suggestions;
    },
    // Set ghost text
    setPredictiveGhostText(text) {
      this.predictiveGhostText = text;
    },
    // Set fetching state
    setFetchingSuggestions(fetching) {
      this.isFetchingSuggestions = fetching;
    },
    // Confirm sentence and speak (returns the text to speak)
    confirmSentence() {
      const text = this.fullSentence.trim();
      if (!text) return null;
      this.spokenHistory.push(text);
      this.fullSentence = "";
      this.predictiveSuggestions = [];
      this.predictiveGhostText = null;
      return text;
    },
    // Clear sentence without speaking
    clearSentence() {
      this.pushHistory();
      this.fullSentence = "";
      this.predictiveSuggestions = [];
      this.predictiveGhostText = null;
    },
    // Full reset
    reset() {
      this.level = "cards";
      this.selectedCardIndex = null;
      this.spreadLetters = [];
      this.typedText = "";
      this.highlightedIndex = null;
      this.expansion = null;
      this.suggestions = [];
      this.selectedSuggestionIndex = 0;
      this.fullSentence = "";
      this.predictiveSuggestions = [];
      this.predictiveGhostText = null;
      this.isFetchingSuggestions = false;
      this.spokenHistory = [];
      this.stateHistory = [];
      this.showSuggestions = false;
      this.isExpanding = false;
      this.isSpeaking = false;
      this.error = null;
    }
  }
});
function usePredictiveText(options = {}) {
  const { debounceMs = 400, numSuggestions = 5 } = options;
  const api = useApi();
  const appStore = useAppStore();
  const suggestions = ref([]);
  const ghostText = ref(null);
  const isFetching = ref(false);
  const lastFetchTime = ref(0);
  const error = ref(null);
  let debounceTimer = null;
  async function fetchPredictions(partialText = "", sceneDescription, conversationHistory) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    isFetching.value = true;
    error.value = null;
    try {
      const result = await api.predictText({
        user_id: appStore.userId,
        partial_text: partialText || "",
        scene_description: sceneDescription || appStore.sceneDescription || null,
        conversation_history: conversationHistory || null,
        num_suggestions: numSuggestions
      });
      suggestions.value = result.suggestions || [];
      ghostText.value = result.ghost_text || null;
      lastFetchTime.value = Date.now();
    } catch (e) {
      console.error("[PredictiveText] Fetch failed:", e);
      error.value = e.message || "Prediction failed";
    } finally {
      isFetching.value = false;
    }
  }
  function fetchPredictionsDebounced(partialText = "", sceneDescription, conversationHistory) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      fetchPredictions(partialText, sceneDescription, conversationHistory);
    }, debounceMs);
  }
  async function acceptSuggestion(suggestion) {
    try {
      api.acceptSuggestion(
        appStore.userId,
        suggestion.text,
        appStore.sceneDescription || void 0
      ).catch((e) => console.warn("[PredictiveText] Failed to store acceptance:", e));
    } catch (e) {
    }
    ghostText.value = null;
  }
  function acceptGhostText() {
    if (!ghostText.value) return null;
    const text = ghostText.value;
    api.acceptSuggestion(
      appStore.userId,
      text,
      appStore.sceneDescription || void 0
    ).catch((e) => console.warn("[PredictiveText] Failed to store acceptance:", e));
    ghostText.value = null;
    return text;
  }
  function fetchPreemptive(sceneDescription, conversationHistory) {
    fetchPredictions("", sceneDescription, conversationHistory);
  }
  function clear() {
    suggestions.value = [];
    ghostText.value = null;
    error.value = null;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
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
    clear
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "speaking",
  __ssrInlineRender: true,
  setup(__props) {
    const appStore = useAppStore();
    const speakingStore = useSpeakingStore();
    const api = useApi();
    const tts = useTTS();
    const eyeGaze = useEyeGaze();
    const gazeController = useGazeController();
    const speech = useSpeechRecognition();
    const minimalNav = useMinimalNavigation();
    const predictive = usePredictiveText();
    const { t } = useI18n();
    const cardRefs = ref([null, null, null, null, null]);
    const undoRef = ref(null);
    const speakBtnRef = ref(null);
    const textFieldAutocompleteRef = ref(null);
    const backBtnRef = ref(null);
    const suggestionChipRefs = ref([]);
    ref(0);
    ref(null);
    watch(() => speakingStore.typedText, (newText) => {
      const convHistory = speech.conversationHistory.value.slice(-6).map((turn) => ({
        speaker: turn.speaker,
        text: turn.text
      }));
      const partialText = speakingStore.fullSentence ? `${speakingStore.fullSentence} ${newText}`.trim() : newText;
      predictive.fetchPredictionsDebounced(
        partialText,
        appStore.sceneDescription,
        convHistory.length > 0 ? convHistory : null
      );
    });
    watch(() => predictive.suggestions.value, (newSuggestions) => {
      speakingStore.setPredictiveSuggestions(newSuggestions);
    });
    watch(() => predictive.ghostText.value, (newGhost) => {
      speakingStore.setPredictiveGhostText(newGhost);
    });
    watch(() => predictive.isFetching.value, (fetching) => {
      speakingStore.setFetchingSuggestions(fetching);
    });
    watch(() => speech.conversationHistory.value.length, () => {
      const convHistory = speech.conversationHistory.value.slice(-6).map((turn) => ({
        speaker: turn.speaker,
        text: turn.text
      }));
      const partialText = speakingStore.fullSentence ? `${speakingStore.fullSentence} ${speakingStore.typedText}`.trim() : speakingStore.typedText;
      predictive.fetchPredictionsDebounced(
        partialText,
        appStore.sceneDescription,
        convHistory.length > 0 ? convHistory : null
      );
    });
    watch(() => appStore.sceneDescription, (newScene) => {
      if (newScene) {
        const convHistory = speech.conversationHistory.value.slice(-6).map((turn) => ({
          speaker: turn.speaker,
          text: turn.text
        }));
        const partialText = speakingStore.fullSentence ? `${speakingStore.fullSentence} ${speakingStore.typedText}`.trim() : speakingStore.typedText;
        predictive.fetchPredictionsDebounced(
          partialText,
          newScene,
          convHistory.length > 0 ? convHistory : null
        );
      }
    });
    watch(() => speakingStore.isExpanding, (isExpanding) => {
      if (appStore.interactionMode === "eye_gaze") {
        gazeController.setPaused(isExpanding);
      }
    });
    function setupMinimalNavigation() {
      cardRefs.value.forEach((el, index) => {
        if (el && currentItems.value[index]) {
          minimalNav.registerItem({
            id: `card-${index}`,
            element: el,
            action: () => handleSelect(index),
            priority: 10 - index
            // Higher priority for earlier cards
          });
        }
      });
      if (undoRef.value) {
        minimalNav.registerItem({
          id: "undo",
          element: undoRef.value,
          action: () => speakingStore.undo(),
          priority: 15
        });
      }
      if (speakBtnRef.value) {
        minimalNav.registerItem({
          id: "speak-btn",
          element: speakBtnRef.value,
          action: handleInlineSpeak,
          priority: 15
        });
      }
      if (backBtnRef.value) {
        minimalNav.registerItem({
          id: "back-btn",
          element: backBtnRef.value,
          action: () => navigateTo("/"),
          priority: 20
          // Highest priority
        });
      }
    }
    watch(() => speakingStore.showSuggestions, async (showSuggestions) => {
      if (showSuggestions) {
        await nextTick();
        setupSuggestionsNavigation();
      } else {
        minimalNav.clearFocus();
      }
    });
    function setupSuggestionsNavigation() {
      minimalNav.clearItems();
      const speakBtn = (void 0).querySelector('[data-suggestion="speak"]');
      const discardBtn = (void 0).querySelector('[data-suggestion="discard"]');
      const upBtn = (void 0).querySelector('[data-suggestion="up"]');
      const downBtn = (void 0).querySelector('[data-suggestion="down"]');
      if (speakBtn) {
        minimalNav.registerItem({
          id: "suggestion-speak",
          element: speakBtn,
          action: handleSpeak,
          priority: 10
        });
      }
      if (discardBtn) {
        minimalNav.registerItem({
          id: "suggestion-discard",
          element: discardBtn,
          action: () => speakingStore.discardExpansion(),
          priority: 10
        });
      }
      if (upBtn) {
        minimalNav.registerItem({
          id: "suggestion-up",
          element: upBtn,
          action: () => speakingStore.prevExpansion(),
          priority: 8
        });
      }
      if (downBtn) {
        minimalNav.registerItem({
          id: "suggestion-down",
          element: downBtn,
          action: () => speakingStore.nextExpansion(),
          priority: 8
        });
      }
      const altBtns = (void 0).querySelectorAll("[data-suggestion-alt]");
      altBtns.forEach((btn, index) => {
        minimalNav.registerItem({
          id: `suggestion-alt-${index}`,
          element: btn,
          action: () => {
            if (speakingStore.expansion) {
              speakingStore.expansion.selectedIndex = index + 1;
            }
          },
          priority: 5
        });
      });
    }
    watch([cardRefs, undoRef, speakBtnRef, backBtnRef], () => {
      if (minimalNav.navigableItems.value.length === 0) {
        nextTick(() => setupMinimalNavigation());
      }
    }, { deep: true });
    watch(() => speakingStore.level, async () => {
      await nextTick();
      setupMinimalNavigation();
    });
    async function startCalibration() {
      appStore.eyeGazeCalibrated = false;
      gazeController.stop();
      await eyeGaze.startTracking();
      eyeGaze.startImplicitCalibration();
    }
    function registerGazeTargets() {
      cardRefs.value.forEach((el, index) => {
        if (el) {
          gazeController.registerTarget(`card-${index}`, el, 5);
        }
      });
      if (undoRef.value) {
        gazeController.registerTarget("undo", undoRef.value, 8);
      }
      if (speakBtnRef.value) {
        gazeController.registerTarget("speak-btn", speakBtnRef.value, 8);
      }
      if (textFieldAutocompleteRef.value) {
        gazeController.registerTarget("text-field-autocomplete", textFieldAutocompleteRef.value, 7);
      }
      if (backBtnRef.value) {
        gazeController.registerTarget("back-btn", backBtnRef.value, 15);
      }
      suggestionChipRefs.value.forEach((el, index) => {
        if (el) {
          gazeController.registerTarget(`suggestion-chip-${index}`, el, 7);
        }
      });
    }
    watch([cardRefs, undoRef, speakBtnRef, textFieldAutocompleteRef, backBtnRef, suggestionChipRefs], () => {
      if (gazeController.state.isActive) {
        registerGazeTargets();
      }
      if (minimalNav.navigableItems.value.length === 0) {
        nextTick(() => setupMinimalNavigation());
      }
    }, { deep: true });
    watch(() => speakingStore.predictiveSuggestions, async () => {
      if (gazeController.state.isActive) {
        await nextTick();
        registerGazeTargets();
      }
    }, { deep: true });
    watch(() => speakingStore.level, async () => {
      if (gazeController.state.isActive) {
        await nextTick();
        registerGazeTargets();
      }
    });
    watch(() => appStore.interactionMode, async (mode) => {
      if (mode === "eye_gaze") {
        if (appStore.eyeGazeCalibrated) {
          await eyeGaze.startTracking();
          gazeController.start();
          await nextTick();
          registerGazeTargets();
        } else {
          await startCalibration();
        }
      } else {
        gazeController.stop();
        eyeGaze.stopTracking();
        eyeGaze.stopImplicitCalibration();
      }
    });
    async function initializeSpeakingSkill() {
      try {
        const response = await api.speakingAction({
          user_id: appStore.userId,
          action: "get_cards"
        });
        if (response.cards) {
          speakingStore.setCards(response.cards);
        }
      } catch (error) {
        console.error("Failed to initialize speaking skill:", error);
        speakingStore.setError("Failed to load letter cards");
      }
    }
    async function handleSelect(index) {
      try {
        if (speakingStore.level === "cards") {
          const response = await api.speakingAction({
            user_id: appStore.userId,
            action: "select_card",
            card_index: index
          });
          if (response.spread_letters) {
            speakingStore.setSpreadLetters(response.spread_letters, index);
          }
        } else {
          const response = await api.speakingAction({
            user_id: appStore.userId,
            action: "select_letter",
            letter_index: index
          });
          if (response.grouped_options) {
            speakingStore.setSpreadLetters(
              response.grouped_options.map((l, i) => ({
                index: i,
                letter: l,
                display: l,
                isGrouped: false
              })),
              speakingStore.selectedCardIndex
            );
          } else if (response.selected_letter) {
            speakingStore.addLetter(response.selected_letter);
            speakingStore.setTypedText(response.typed_text || speakingStore.typedText);
            await initializeSpeakingSkill();
          }
        }
      } catch (error) {
        console.error("Selection failed:", error);
      }
    }
    async function handleInlineSpeak() {
      let sentenceToSpeak = speakingStore.fullSentence;
      if (speakingStore.typedText.trim()) {
        sentenceToSpeak = sentenceToSpeak ? `${sentenceToSpeak} ${speakingStore.typedText}` : speakingStore.typedText;
      }
      sentenceToSpeak = sentenceToSpeak.trim();
      if (!sentenceToSpeak) return;
      speakingStore.setSpeaking(true);
      speech.muteForTTS();
      try {
        try {
          const formatted = await api.formatText(sentenceToSpeak);
          if (formatted.was_modified) {
            sentenceToSpeak = formatted.formatted_text;
          }
        } catch (e) {
          console.warn("[Speaking] Auto-format failed, using raw text:", e);
        }
        const conversationCtx = speech.conversationHistory.value.slice(-6).map((turn) => `${turn.speaker === "user" ? "You" : "Other"}: ${turn.text}`).join("\n");
        const customCtx = appStore.customContextEnabled && appStore.customContext ? appStore.customContext : void 0;
        await tts.speak(sentenceToSpeak, appStore.language, {
          scene_description: appStore.sceneDescription || void 0,
          conversation_context: conversationCtx || void 0,
          custom_context: customCtx
        });
        speech.addUserSentence(sentenceToSpeak);
        speakingStore.spokenHistory.push(sentenceToSpeak);
        speakingStore.clearSentence();
        speakingStore.setTypedText("");
        predictive.clear();
        await api.speakingAction({
          user_id: appStore.userId,
          action: "reset"
        });
        await initializeSpeakingSkill();
        const convHistory = speech.conversationHistory.value.slice(-6).map((turn) => ({
          speaker: turn.speaker,
          text: turn.text
        }));
        predictive.fetchPreemptive(appStore.sceneDescription, convHistory.length > 0 ? convHistory : null);
      } finally {
        speakingStore.setSpeaking(false);
        speech.unmuteAfterTTS();
      }
    }
    const conversationHistory = computed(() => {
      return speech.conversationHistory.value.slice(-6).map((turn) => ({
        speaker: turn.speaker,
        text: turn.text
      }));
    });
    const currentItems = computed(() => {
      if (speakingStore.level === "cards") {
        return speakingStore.cards.map((card) => ({
          index: card.index,
          label: card.label,
          letters: card.letters
        }));
      } else {
        return speakingStore.spreadLetters.map((letter) => ({
          index: letter.index,
          label: letter.display,
          letters: [letter.letter]
        }));
      }
    });
    computed(() => {
      return speakingStore.typedText.split("").join(" ").toUpperCase();
    });
    const displaySentence = computed(() => {
      const parts = [];
      if (speakingStore.fullSentence) parts.push(speakingStore.fullSentence);
      if (speakingStore.typedText) parts.push(speakingStore.typedText.split("").join(" ").toUpperCase());
      return parts.join(" ");
    });
    const hasAnySentenceText = computed(() => {
      return speakingStore.fullSentence.trim().length > 0 || speakingStore.typedText.trim().length > 0;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_GazeCursor = __nuxt_component_0;
      const _component_SettingsSidebar = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "speaking-page" }, _attrs))} data-v-cd63e96c>`);
      _push(ssrRenderComponent(_component_GazeCursor, {
        position: unref(gazeController).state.snappedPosition,
        "dwell-progress": unref(gazeController).state.dwellProgress,
        "is-on-target": unref(gazeController).state.currentTargetId !== null,
        "is-selecting": unref(gazeController).state.isSelecting,
        "is-locked": unref(gazeController).state.isLocked,
        visible: unref(appStore).interactionMode === "eye_gaze" && unref(gazeController).state.isActive
      }, null, _parent));
      _push(`<button class="${ssrRenderClass([{ "back-btn--gaze-active": unref(gazeController).state.currentTargetId === "back-btn" }, "back-btn navigable-item"])}" data-v-cd63e96c>`);
      _push(ssrRenderComponent(unref(ArrowLeft), { size: 32 }, null, _parent));
      _push(`</button><button class="${ssrRenderClass([{ "settings-btn--active": unref(appStore).settingsExpanded }, "settings-btn"])}" data-v-cd63e96c>`);
      _push(ssrRenderComponent(unref(Settings), { size: 20 }, null, _parent));
      _push(`</button>`);
      if (unref(appStore).settingsExpanded) {
        _push(ssrRenderComponent(_component_SettingsSidebar, null, null, _parent));
      } else {
        _push(`<!---->`);
      }
      if (!unref(appStore).settingsExpanded && !unref(speakingStore).showSuggestions) {
        _push(`<div class="keyboard-nav-hint" data-v-cd63e96c> Use arrow keys to navigate • Shift to click • Tab to cycle </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="speaking-grid" data-v-cd63e96c><div class="card-top-left" data-v-cd63e96c>`);
      if (unref(currentItems)[0]) {
        _push(`<button class="${ssrRenderClass([{
          "letter-card--highlighted": unref(speakingStore).highlightedIndex === 0,
          "letter-card--gaze-active": unref(gazeController).state.currentTargetId === "card-0"
        }, "letter-card navigable-item"])}" data-v-cd63e96c><span class="letter-card__text" data-v-cd63e96c>${ssrInterpolate(unref(currentItems)[0].label)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="card-top-center" data-v-cd63e96c>`);
      if (unref(currentItems)[1]) {
        _push(`<button class="${ssrRenderClass([{
          "letter-card--highlighted": unref(speakingStore).highlightedIndex === 1,
          "letter-card--gaze-active": unref(gazeController).state.currentTargetId === "card-1"
        }, "letter-card letter-card--top navigable-item"])}" data-v-cd63e96c><span class="letter-card__text" data-v-cd63e96c>${ssrInterpolate(unref(currentItems)[1].label)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="card-top-right" data-v-cd63e96c>`);
      if (unref(currentItems)[2]) {
        _push(`<button class="${ssrRenderClass([{
          "letter-card--highlighted": unref(speakingStore).highlightedIndex === 2,
          "letter-card--gaze-active": unref(gazeController).state.currentTargetId === "card-2"
        }, "letter-card navigable-item"])}" data-v-cd63e96c><span class="letter-card__text" data-v-cd63e96c>${ssrInterpolate(unref(currentItems)[2].label)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="input-row" data-v-cd63e96c><div class="input-row__left-actions" data-v-cd63e96c><button class="${ssrRenderClass([{ "action-btn--gaze-active": unref(gazeController).state.currentTargetId === "undo" }, "action-btn action-btn--undo navigable-item"])}"${ssrIncludeBooleanAttr(!unref(speakingStore).canUndo) ? " disabled" : ""} data-v-cd63e96c>`);
      _push(ssrRenderComponent(unref(Undo2), { size: 24 }, null, _parent));
      _push(`<span data-v-cd63e96c>Undo</span></button></div><div class="text-field-group" data-v-cd63e96c><div class="text-field" data-v-cd63e96c><div class="text-field__inner" data-v-cd63e96c>`);
      if (unref(displaySentence)) {
        _push(`<span class="text-field__content" data-v-cd63e96c>${ssrInterpolate(unref(displaySentence))}</span>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(speakingStore).predictiveGhostText && !unref(displaySentence)) {
        _push(`<span class="text-field__ghost" data-v-cd63e96c>${ssrInterpolate(unref(speakingStore).predictiveGhostText)}</span>`);
      } else if (unref(speakingStore).predictiveGhostText && unref(displaySentence)) {
        _push(`<span class="text-field__ghost" data-v-cd63e96c>${ssrInterpolate(" " + unref(speakingStore).predictiveGhostText.slice(unref(displaySentence).length).trim())}</span>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(displaySentence) && !unref(speakingStore).predictiveGhostText) {
        _push(`<span class="text-field__placeholder" data-v-cd63e96c>${ssrInterpolate(unref(t)("speaking.placeholder"))}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><span class="text-field__cursor" data-v-cd63e96c></span><div class="${ssrRenderClass([{
        "text-field__autocomplete-zone--active": unref(gazeController).state.currentTargetId === "text-field-autocomplete",
        "text-field__autocomplete-zone--available": !!unref(speakingStore).predictiveGhostText
      }, "text-field__autocomplete-zone"])}" data-v-cd63e96c>`);
      if (unref(speakingStore).predictiveGhostText) {
        _push(`<span class="text-field__autocomplete-hint" data-v-cd63e96c>✓</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(speakingStore).predictiveSuggestions.length > 0) {
        _push(`<div class="suggestion-chips" data-v-cd63e96c><!--[-->`);
        ssrRenderList(unref(speakingStore).predictiveSuggestions.slice(0, 3), (suggestion, idx) => {
          _push(`<button class="${ssrRenderClass([{
            "suggestion-chip--completion": suggestion.is_completion,
            "suggestion-chip--gaze-active": unref(gazeController).state.currentTargetId === `suggestion-chip-${idx}`
          }, "suggestion-chip"])}" data-v-cd63e96c>${ssrInterpolate(suggestion.text)}</button>`);
        });
        _push(`<!--]-->`);
        if (unref(speakingStore).isFetchingSuggestions) {
          _push(ssrRenderComponent(unref(Loader2), {
            size: 24,
            class: "animate-spin suggestion-chips__loader"
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else if (unref(speakingStore).isFetchingSuggestions) {
        _push(`<div class="suggestion-chips suggestion-chips--loading" data-v-cd63e96c>`);
        _push(ssrRenderComponent(unref(Loader2), {
          size: 24,
          class: "animate-spin suggestion-chips__loader"
        }, null, _parent));
        _push(`<span class="suggestion-chips__hint" data-v-cd63e96c>Thinking...</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="input-row__right-actions" data-v-cd63e96c><button class="${ssrRenderClass([{
        "action-btn--loading": unref(speakingStore).isSpeaking,
        "action-btn--gaze-active": unref(gazeController).state.currentTargetId === "speak-btn"
      }, "action-btn action-btn--speak navigable-item"])}"${ssrIncludeBooleanAttr(!unref(hasAnySentenceText) || unref(speakingStore).isSpeaking) ? " disabled" : ""} data-v-cd63e96c>`);
      if (unref(speakingStore).isSpeaking) {
        _push(ssrRenderComponent(unref(Loader2), {
          size: 24,
          class: "animate-spin"
        }, null, _parent));
      } else {
        _push(ssrRenderComponent(unref(Volume2), { size: 24 }, null, _parent));
      }
      _push(`<span data-v-cd63e96c>Speak</span></button></div></div><div class="card-bottom-left" data-v-cd63e96c>`);
      if (unref(currentItems)[3]) {
        _push(`<button class="${ssrRenderClass([{
          "letter-card--highlighted": unref(speakingStore).highlightedIndex === 3,
          "letter-card--gaze-active": unref(gazeController).state.currentTargetId === "card-3"
        }, "letter-card navigable-item"])}" data-v-cd63e96c><span class="letter-card__text" data-v-cd63e96c>${ssrInterpolate(unref(currentItems)[3].label)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="context-bottom" data-v-cd63e96c><div class="scene-container" data-v-cd63e96c><div class="scene-box" data-v-cd63e96c>`);
      if (unref(appStore).capturedSceneImage) {
        _push(`<img${ssrRenderAttr("src", unref(appStore).capturedSceneImage)} class="scene-box__image" alt="Captured scene" data-v-cd63e96c>`);
      } else {
        _push(`<div class="scene-box__placeholder" data-v-cd63e96c>`);
        _push(ssrRenderComponent(unref(Plus), { size: 24 }, null, _parent));
        _push(`</div>`);
      }
      _push(`</div></div><div class="conversation-box" data-v-cd63e96c><!--[-->`);
      ssrRenderList(unref(conversationHistory).slice(-2), (turn, index) => {
        _push(`<div class="${ssrRenderClass([`conversation-turn--${turn.speaker}`, "conversation-turn"])}" data-v-cd63e96c><span class="conversation-turn__label" data-v-cd63e96c>${ssrInterpolate(turn.speaker === "user" ? "user" : "env")}:</span><span class="conversation-turn__text" data-v-cd63e96c>${ssrInterpolate(turn.text)}</span></div>`);
      });
      _push(`<!--]-->`);
      if (unref(conversationHistory).length === 0) {
        _push(`<div class="conversation-empty" data-v-cd63e96c> No conversation yet </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><div class="card-bottom-right" data-v-cd63e96c>`);
      if (unref(currentItems)[4]) {
        _push(`<button class="${ssrRenderClass([{
          "letter-card--highlighted": unref(speakingStore).highlightedIndex === 4,
          "letter-card--gaze-active": unref(gazeController).state.currentTargetId === "card-4"
        }, "letter-card navigable-item"])}" data-v-cd63e96c><span class="letter-card__text" data-v-cd63e96c>${ssrInterpolate(unref(currentItems)[4].label)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(eyeGaze).state.isImplicitCalibration) {
        _push(`<div class="fixed bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 pointer-events-none" data-v-cd63e96c><div class="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md text-lg font-medium border border-white/10 shadow-xl pointer-events-auto" data-v-cd63e96c> Follow the cursor with your eyes as you click buttons </div><button class="bg-aac-highlight hover:opacity-90 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg transition-transform active:scale-95 pointer-events-auto" data-v-cd63e96c> Done </button></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(speakingStore).error) {
        _push(`<div class="error-toast" data-v-cd63e96c>${ssrInterpolate(unref(speakingStore).error)} <button data-v-cd63e96c>×</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_GazeCursor, {
        position: unref(gazeController).state.snappedPosition || unref(eyeGaze).state.gazePosition,
        "dwell-progress": unref(gazeController).state.dwellProgress,
        "is-on-target": unref(gazeController).state.currentTargetId !== null,
        "is-selecting": unref(gazeController).state.isSelecting,
        "is-locked": unref(gazeController).state.isLocked,
        "target-bounds": unref(gazeController).state.currentTargetBounds,
        visible: unref(appStore).interactionMode === "eye_gaze" && (unref(gazeController).state.isActive && !unref(gazeController).state.isPaused || unref(eyeGaze).state.isImplicitCalibration)
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/speaking.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const speaking = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-cd63e96c"]]);
export {
  speaking as default
};
//# sourceMappingURL=speaking-DL0iqD12.js.map
