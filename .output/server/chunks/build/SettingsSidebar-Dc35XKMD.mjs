import { defineComponent, ref, watch, mergeProps, unref, readonly, createVNode, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderAttr, ssrRenderVNode } from 'vue/server-renderer';
import { X, Languages, Mic, CheckCircle, Trash2, Upload, Loader2, Palette, Image, RefreshCw, Camera, FileText, Hand, Eye, ToggleRight, Lightbulb, BookOpen, Target, Brain, Search } from 'lucide-vue-next';
import { a as useAppStore, b as useI18n, f as useNuxtApp } from './server.mjs';
import { u as useCamera, a as useEyeGaze, b as useGazeController } from './useGazeController-CqZ3gTDn.mjs';
import { u as useApi } from './useApi-DXXljJZv.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "ControlPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const appStore = useAppStore();
    useEyeGaze();
    useGazeController();
    const modes = [
      { value: "touch", label: "Touch", icon: Hand },
      { value: "eye_gaze", label: "Eye Gaze", icon: Eye },
      { value: "switch", label: "Switch", icon: ToggleRight }
    ];
    const { t } = useI18n();
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-aac-card rounded-2xl p-5 space-y-5 border border-aac-card" }, _attrs))}><div class="flex items-center justify-between"><h2 class="text-lg font-semibold text-aac-text">${ssrInterpolate(unref(t)("settings.general.title"))}</h2></div><div><label class="block text-sm text-aac-muted mb-3">${ssrInterpolate(unref(t)("settings.general.interactionMode"))}</label><div class="flex gap-2"><!--[-->`);
      ssrRenderList(modes, (mode) => {
        _push(`<button class="${ssrRenderClass([
          "flex-1 py-2 px-3 rounded-xl font-medium transition-all text-center flex flex-col items-center",
          unref(appStore).interactionMode === mode.value ? "bg-aac-highlight text-white" : "bg-aac-surface text-aac-muted hover:bg-aac-highlight hover:bg-opacity-10"
        ])}">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(mode.icon), {
          size: 20,
          class: "mb-0.5"
        }, null), _parent);
        _push(`<span class="text-xs">${ssrInterpolate(unref(t)(`settings.general.modes.${mode.value === "eye_gaze" ? "eyeGaze" : mode.value}`))}</span></button>`);
      });
      _push(`<!--]--></div></div>`);
      if (unref(appStore).isEyeGazeMode) {
        _push(`<div class="space-y-4 pt-4 border-t border-aac-surface"><h3 class="text-base font-medium text-aac-text flex items-center gap-2">`);
        _push(ssrRenderComponent(unref(Eye), {
          size: 18,
          class: "text-aac-highlight"
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(t)("settings.general.eyeGaze.title"))}</h3><div class="flex items-center justify-between p-3 bg-aac-surface rounded-xl"><div class="flex items-center gap-2"><span class="${ssrRenderClass([
          "w-2.5 h-2.5 rounded-full",
          unref(appStore).eyeGazeCalibrated ? "bg-green-500" : "bg-yellow-500"
        ])}"></span><span class="text-sm text-aac-text">${ssrInterpolate(unref(appStore).eyeGazeCalibrated ? unref(t)("settings.general.eyeGaze.calibrated") : unref(t)("settings.general.eyeGaze.notCalibrated"))}</span></div><button class="text-sm text-aac-highlight hover:opacity-80">${ssrInterpolate(unref(appStore).eyeGazeCalibrated ? unref(t)("settings.general.eyeGaze.recalibrate") : unref(t)("settings.general.eyeGaze.calibrate"))}</button></div><div><label class="block text-sm text-aac-muted mb-2">${ssrInterpolate(unref(t)("settings.general.eyeGaze.dwellTime"))}: ${ssrInterpolate(unref(appStore).dwellThreshold / 1e3)}s </label><input type="range" min="500" max="3000" step="100"${ssrRenderAttr("value", unref(appStore).dwellThreshold)} class="w-full accent-aac-highlight"><p class="text-xs text-aac-muted mt-1">${ssrInterpolate(unref(t)("settings.general.eyeGaze.dwellHint"))}</p></div>`);
        if (!unref(appStore).eyeGazeOverlayActive && !unref(appStore).eyeGazeCalibrationActive) {
          _push(`<button class="w-full py-2.5 px-4 bg-aac-highlight hover:opacity-90 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">`);
          _push(ssrRenderComponent(unref(Eye), { size: 18 }, null, _parent));
          _push(` ${ssrInterpolate(unref(t)("settings.general.eyeGaze.openMode"))}</button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="text-xs text-gray-500 flex items-start gap-1.5">`);
        _push(ssrRenderComponent(unref(Lightbulb), {
          size: 14,
          class: "text-yellow-500 flex-shrink-0 mt-0.5"
        }, null, _parent));
        _push(`<span>${ssrInterpolate(unref(t)("settings.general.eyeGaze.tip"))}</span></p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center justify-between"><span class="text-aac-text text-sm">${ssrInterpolate(unref(t)("settings.general.debug"))}</span><button class="${ssrRenderClass([
        "relative w-12 h-6 rounded-full transition-colors",
        unref(appStore).showDebugInfo ? "bg-aac-highlight" : "bg-aac-surface"
      ])}"><span class="${ssrRenderClass([
        "absolute top-0.5 w-5 h-5 rounded-full transition-transform",
        unref(appStore).showDebugInfo ? "translate-x-6 bg-white" : "translate-x-0.5 bg-aac-muted"
      ])}"></span></button></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ControlPanel.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "DebugPanel",
  __ssrInlineRender: true,
  setup(__props) {
    const appStore = useAppStore();
    const phaseIcons = {
      perceive: Search,
      reason: Brain,
      act: Target,
      learn: BookOpen
    };
    return (_ctx, _push, _parent, _attrs) => {
      if (unref(appStore).showDebugInfo) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-[#1c1c21] rounded-2xl p-5 space-y-4 max-h-80 overflow-y-auto no-scrollbar border border-[#2a2a30]" }, _attrs))}><div class="flex items-center justify-between"><h3 class="text-base font-semibold text-gray-100">Agent Debug</h3><span class="${ssrRenderClass(["px-2 py-1 rounded-full text-xs flex items-center gap-1", unref(appStore).isProcessing ? "bg-blue-600/20 text-blue-400" : "bg-green-600/20 text-green-400"])}">`);
        ssrRenderVNode(_push, createVNode(resolveDynamicComponent(phaseIcons[unref(appStore).currentPhase]), { size: 12 }, null), _parent);
        _push(` ${ssrInterpolate(unref(appStore).currentPhase.toUpperCase())}</span></div>`);
        if (unref(appStore).visualContext) {
          _push(`<div><h4 class="text-sm text-gray-400 mb-2">Scene Analysis</h4><p class="text-sm text-gray-200">${ssrInterpolate(unref(appStore).visualContext.scene_description)}</p><div class="flex flex-wrap gap-2 mt-2"><!--[-->`);
          ssrRenderList(unref(appStore).visualContext.detected_objects, (obj) => {
            _push(`<span class="text-xs px-2 py-1 bg-[#252529] text-gray-300 rounded-full">${ssrInterpolate(obj.label)} (${ssrInterpolate(Math.round(obj.confidence * 100))}%) </span>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(appStore).reasoningTrace.length) {
          _push(`<div><h4 class="text-sm text-gray-400 mb-2">Reasoning Trace</h4><div class="space-y-1 text-xs font-mono"><!--[-->`);
          ssrRenderList(unref(appStore).reasoningTrace, (line, i) => {
            _push(`<p class="text-gray-300">${ssrInterpolate(line)}</p>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="pt-4 border-t border-[#2a2a30] text-xs text-gray-500"><p>Session: ${ssrInterpolate(unref(appStore).sessionId || "None")}</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DebugPanel.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
function useSpeechRecognition() {
  const isListening = ref(false);
  const isSupported = ref(false);
  const currentTranscript = ref("");
  const conversationHistory = ref([]);
  const error = ref(null);
  const isMuted = ref(false);
  let muteTimeout = null;
  let recognition = null;
  const initRecognition = () => {
    {
      error.value = "Speech recognition is not supported in this browser";
      return false;
    }
  };
  const startListening = async () => {
    if (!initRecognition()) {
      return false;
    }
    try {
      await (void 0).mediaDevices.getUserMedia({ audio: true });
      recognition == null ? void 0 : recognition.start();
      return true;
    } catch (e) {
      error.value = "Failed to access microphone. Please allow microphone access.";
      console.error("[SpeechRecognition] Failed to start:", e);
      return false;
    }
  };
  const stopListening = () => {
    isListening.value = false;
    currentTranscript.value = "";
  };
  const toggleListening = async () => {
    if (isListening.value) {
      stopListening();
    } else {
      await startListening();
    }
  };
  const addUserSentence = (sentence) => {
    const entry = {
      text: sentence,
      timestamp: /* @__PURE__ */ new Date(),
      isFinal: true,
      speaker: "user"
    };
    conversationHistory.value.push(entry);
  };
  const getConversationContext = (maxEntries = 10) => {
    const recent = conversationHistory.value.slice(-maxEntries);
    return recent.map((entry) => `${entry.speaker === "user" ? "User" : "Other"}: ${entry.text}`).join("\n");
  };
  const getRecentHeardSpeech = (maxEntries = 5) => {
    return conversationHistory.value.filter((entry) => entry.speaker === "other").slice(-maxEntries).map((entry) => entry.text);
  };
  const clearHistory = () => {
    conversationHistory.value = [];
  };
  const muteForTTS = () => {
    isMuted.value = true;
    if (muteTimeout) {
      clearTimeout(muteTimeout);
      muteTimeout = null;
    }
    console.log("[SpeechRecognition] Muted for TTS");
  };
  const unmuteAfterTTS = () => {
    muteTimeout = setTimeout(() => {
      isMuted.value = false;
      console.log("[SpeechRecognition] Unmuted after TTS");
    }, 500);
  };
  const setLanguage = (lang) => {
  };
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
    getRecentHeardSpeech
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "SettingsSidebar",
  __ssrInlineRender: true,
  setup(__props) {
    const appStore = useAppStore();
    const camera = useCamera();
    useApi();
    const speech = useSpeechRecognition();
    const { t, locale } = useI18n();
    const { $i18n } = useNuxtApp();
    const voiceCloneFile = ref(null);
    const isCloning = ref(false);
    const cloneError = ref("");
    ref(null);
    const isRefreshingCameras = ref(false);
    async function refreshCameras() {
      isRefreshingCameras.value = true;
      try {
        await camera.refreshDevices();
        appStore.setAvailableCameras(camera.state.availableDevices);
      } catch (error) {
        console.error("Failed to refresh cameras:", error);
      } finally {
        isRefreshingCameras.value = false;
      }
    }
    watch(
      () => appStore.settingsExpanded,
      async (isExpanded) => {
        if (isExpanded && appStore.availableCameras.length === 0) {
          await refreshCameras();
        }
      }
    );
    const languages = [
      { code: "en", name: "English", dir: "ltr" },
      { code: "ar", name: "Arabic", dir: "rtl" },
      { code: "ur", name: "Urdu", dir: "rtl" }
    ];
    const backgroundOptions = [
      { key: "default", bg: "#000000", surface: "#121212", card: "#18181b" },
      { key: "slate", bg: "#0f172a", surface: "#1e293b", card: "#334155" },
      { key: "neutral", bg: "#171717", surface: "#262626", card: "#404040" },
      { key: "gray", bg: "#111827", surface: "#1f2937", card: "#374151" },
      { key: "deepBlack", bg: "#000000", surface: "#121212", card: "#18181b" }
    ];
    const accentOptions = [
      { key: "blue", value: "#3b82f6" },
      { key: "yellow", value: "#eab308" },
      { key: "red", value: "#ef4444" },
      { key: "green", value: "#22c55e" },
      { key: "purple", value: "#a855f7" }
    ];
    const textOptions = [
      { key: "default", value: "#f5f5f7" },
      { key: "white", value: "#ffffff" },
      { key: "gray", value: "#d1d5db" },
      { key: "amber", value: "#fef3c7" },
      { key: "sky", value: "#e0f2fe" }
    ];
    function getCameraDisplayName(cameraId) {
      if (!cameraId) return "Default Camera";
      const camera2 = appStore.availableCameras.find((c) => c.deviceId === cameraId);
      return (camera2 == null ? void 0 : camera2.label) || "Unknown Camera";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ControlPanel = _sfc_main$2;
      const _component_DebugPanel = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "settings-sidebar" }, _attrs))} data-v-5092ca32><div class="settings-sidebar__header" data-v-5092ca32><h2 class="settings-sidebar__title" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.title"))}</h2><button class="settings-sidebar__close" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(X), { size: 20 }, null, _parent));
      _push(`</button></div>`);
      _push(ssrRenderComponent(_component_ControlPanel, null, null, _parent));
      _push(`<div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(Languages), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>${ssrInterpolate(unref(t)("settings.language"))}</span></div><div class="settings-section__content flex gap-2" data-v-5092ca32><!--[-->`);
      ssrRenderList(languages, (lang) => {
        _push(`<button class="${ssrRenderClass([unref(locale) === lang.code ? "bg-aac-highlight text-white border-aac-highlight" : "bg-aac-surface text-aac-text border-transparent hover:border-aac-highlight", "px-3 py-1.5 rounded-lg text-sm transition-all border"])}" data-v-5092ca32>${ssrInterpolate(unref(t)(`languages.${lang.code}`))}</button>`);
      });
      _push(`<!--]--></div></div><div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(Mic), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>Voice Clone</span></div><div class="settings-section__content" data-v-5092ca32>`);
      if (unref(appStore).clonedVoiceId) {
        _push(`<div class="voice-clone-active" data-v-5092ca32><div class="voice-clone-active__info" data-v-5092ca32>`);
        _push(ssrRenderComponent(unref(CheckCircle), {
          size: 16,
          class: "text-green-400"
        }, null, _parent));
        _push(`<span class="text-sm text-gray-200" data-v-5092ca32>${ssrInterpolate(unref(appStore).clonedVoiceName || "My Voice")}</span></div><button class="voice-clone-remove" data-v-5092ca32>`);
        _push(ssrRenderComponent(unref(Trash2), { size: 14 }, null, _parent));
        _push(`<span data-v-5092ca32>Remove</span></button></div>`);
      } else {
        _push(`<div class="voice-clone-upload" data-v-5092ca32><p class="text-xs text-gray-400 mb-2" data-v-5092ca32>Upload a 10\u201330 second audio clip of your voice</p><input type="file" accept="audio/*" class="hidden" data-v-5092ca32>`);
        if (!unref(voiceCloneFile)) {
          _push(`<div class="voice-clone-dropzone" data-v-5092ca32>`);
          _push(ssrRenderComponent(unref(Upload), {
            size: 20,
            class: "text-gray-400"
          }, null, _parent));
          _push(`<span class="text-xs text-gray-400" data-v-5092ca32>Choose audio file</span></div>`);
        } else {
          _push(`<div class="voice-clone-ready" data-v-5092ca32><div class="voice-clone-ready__file" data-v-5092ca32>`);
          _push(ssrRenderComponent(unref(Mic), {
            size: 14,
            class: "text-aac-highlight"
          }, null, _parent));
          _push(`<span class="text-xs text-gray-200 truncate" data-v-5092ca32>${ssrInterpolate(unref(voiceCloneFile).name)}</span></div><button class="voice-clone-btn"${ssrIncludeBooleanAttr(unref(isCloning)) ? " disabled" : ""} data-v-5092ca32>`);
          if (unref(isCloning)) {
            _push(ssrRenderComponent(unref(Loader2), {
              size: 14,
              class: "animate-spin"
            }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Upload), { size: 14 }, null, _parent));
          }
          _push(`<span data-v-5092ca32>${ssrInterpolate(unref(isCloning) ? "Cloning..." : "Clone Voice")}</span></button></div>`);
        }
        if (unref(cloneError)) {
          _push(`<p class="text-xs text-red-400 mt-1" data-v-5092ca32>${ssrInterpolate(unref(cloneError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div></div><div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(Palette), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>${ssrInterpolate(unref(t)("settings.appearance.title"))}</span></div><div class="settings-section__content space-y-3" data-v-5092ca32><div data-v-5092ca32><div class="text-xs text-gray-400 mb-2" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.appearance.background"))}</div><div class="flex gap-2" data-v-5092ca32><!--[-->`);
      ssrRenderList(backgroundOptions, (opt) => {
        _push(`<button class="${ssrRenderClass([unref(appStore).themeSettings.background === opt.bg ? "border-aac-highlight scale-110" : "border-transparent hover:scale-105", "w-6 h-6 rounded-full border-2 transition-all"])}" style="${ssrRenderStyle({ backgroundColor: opt.bg })}"${ssrRenderAttr("title", unref(t)("settings.colors." + opt.key))} data-v-5092ca32></button>`);
      });
      _push(`<!--]--></div></div><div data-v-5092ca32><div class="text-xs text-gray-400 mb-2" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.appearance.accent"))}</div><div class="flex gap-2" data-v-5092ca32><!--[-->`);
      ssrRenderList(accentOptions, (opt) => {
        _push(`<button class="${ssrRenderClass([unref(appStore).themeSettings.accent === opt.value ? "border-white scale-110" : "border-transparent hover:scale-105", "w-6 h-6 rounded-full border-2 transition-all"])}" style="${ssrRenderStyle({ backgroundColor: opt.value })}"${ssrRenderAttr("title", unref(t)("settings.colors." + opt.key))} data-v-5092ca32></button>`);
      });
      _push(`<!--]--></div></div><div data-v-5092ca32><div class="text-xs text-gray-400 mb-2" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.appearance.text"))}</div><div class="flex gap-2" data-v-5092ca32><!--[-->`);
      ssrRenderList(textOptions, (opt) => {
        _push(`<button class="${ssrRenderClass([unref(appStore).themeSettings.text === opt.value ? "border-aac-highlight scale-110" : "border-transparent hover:scale-105", "w-6 h-6 rounded-full border-2 transition-all"])}" style="${ssrRenderStyle({ backgroundColor: opt.value })}"${ssrRenderAttr("title", unref(t)("settings.colors." + opt.key))} data-v-5092ca32></button>`);
      });
      _push(`<!--]--></div></div></div></div><div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(Image), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>${ssrInterpolate(unref(t)("settings.sceneContext.title"))}</span></div><div class="settings-section__content" data-v-5092ca32>`);
      if (unref(appStore).capturedSceneImage) {
        _push(`<div class="scene-preview" data-v-5092ca32><div class="scene-preview__container" data-v-5092ca32><img${ssrRenderAttr("src", unref(appStore).capturedSceneImage)} alt="Scene" class="scene-preview__image" data-v-5092ca32><button class="scene-preview__recapture-btn"${ssrIncludeBooleanAttr(unref(appStore).isProcessing) ? " disabled" : ""}${ssrRenderAttr("title", unref(t)("settings.sceneContext.recapture"))} data-v-5092ca32>`);
        _push(ssrRenderComponent(unref(RefreshCw), {
          size: 16,
          class: { "animate-spin": unref(appStore).isProcessing }
        }, null, _parent));
        _push(`</button></div>`);
        if (unref(appStore).sceneDescription) {
          _push(`<p class="scene-preview__text" data-v-5092ca32>${ssrInterpolate(unref(appStore).sceneDescription)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="scene-preview__empty" data-v-5092ca32><p class="text-gray-400 text-sm" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.sceneContext.placeholder"))}</p><button class="scene-preview__capture-btn"${ssrIncludeBooleanAttr(unref(appStore).isProcessing) ? " disabled" : ""} data-v-5092ca32>`);
        _push(ssrRenderComponent(unref(RefreshCw), {
          size: 14,
          class: { "animate-spin": unref(appStore).isProcessing }
        }, null, _parent));
        _push(`<span data-v-5092ca32>${ssrInterpolate(unref(appStore).isProcessing ? unref(t)("settings.sceneContext.capturing") : unref(t)("settings.sceneContext.capture"))}</span></button></div>`);
      }
      _push(`</div></div><div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(Mic), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>${ssrInterpolate(unref(t)("settings.listening.title"))}</span>`);
      if (!unref(speech).isListening.value) {
        _push(`<button class="settings-btn-sm" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.listening.start"))}</button>`);
      } else {
        _push(`<span class="listening-indicator" data-v-5092ca32><span class="listening-dot" data-v-5092ca32></span> ${ssrInterpolate(unref(t)("settings.listening.active"))}</span>`);
      }
      _push(`</div><div class="settings-section__content" data-v-5092ca32>`);
      if (unref(appStore).lastHeardText) {
        _push(`<div class="text-sm" data-v-5092ca32><span class="text-gray-400" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.listening.lastHeard"))}</span><p class="text-gray-200 mt-1" data-v-5092ca32>&quot;${ssrInterpolate(unref(appStore).lastHeardText)}&quot;</p></div>`);
      } else {
        _push(`<p class="text-gray-400 text-sm" data-v-5092ca32>${ssrInterpolate(unref(speech).isListening.value ? unref(t)("settings.listening.listeningPlaceholder") : unref(t)("settings.listening.enablePlaceholder"))}</p>`);
      }
      _push(`</div></div><div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(Camera), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.title"))}</span><button class="settings-btn-sm"${ssrIncludeBooleanAttr(unref(isRefreshingCameras)) ? " disabled" : ""} data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        size: 14,
        class: { "animate-spin": unref(isRefreshingCameras) }
      }, null, _parent));
      _push(`</button></div><div class="settings-section__content space-y-4" data-v-5092ca32><div data-v-5092ca32><div class="text-xs text-gray-400 mb-2" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.webgazer"))}</div><select${ssrRenderAttr("value", unref(appStore).webgazerCameraId || "")} class="camera-select" data-v-5092ca32><option value="" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.default"))}</option><!--[-->`);
      ssrRenderList(unref(appStore).availableCameras, (cam) => {
        _push(`<option${ssrRenderAttr("value", cam.deviceId)} data-v-5092ca32>${ssrInterpolate(cam.label)}</option>`);
      });
      _push(`<!--]--></select><div class="text-xs text-gray-500 mt-1" data-v-5092ca32>${ssrInterpolate(getCameraDisplayName(unref(appStore).webgazerCameraId))}</div></div><div data-v-5092ca32><div class="text-xs text-gray-400 mb-2" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.sceneCapture"))}</div><select${ssrRenderAttr("value", unref(appStore).sceneCaptureCameraId || "")} class="camera-select" data-v-5092ca32><option value="" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.default"))}</option><!--[-->`);
      ssrRenderList(unref(appStore).availableCameras, (cam) => {
        _push(`<option${ssrRenderAttr("value", cam.deviceId)} data-v-5092ca32>${ssrInterpolate(cam.label)}</option>`);
      });
      _push(`<!--]--></select><div class="text-xs text-gray-500 mt-1" data-v-5092ca32>${ssrInterpolate(getCameraDisplayName(unref(appStore).sceneCaptureCameraId))}</div></div>`);
      if (unref(appStore).availableCameras.length === 0) {
        _push(`<div class="text-sm text-gray-400" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.noCameras"))}</div>`);
      } else {
        _push(`<div class="text-xs text-gray-500" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.cameras.available", { count: unref(appStore).availableCameras.length }))}</div>`);
      }
      _push(`</div></div><div class="settings-section" data-v-5092ca32><div class="settings-section__header" data-v-5092ca32>`);
      _push(ssrRenderComponent(unref(FileText), {
        size: 18,
        class: "text-aac-highlight"
      }, null, _parent));
      _push(`<span data-v-5092ca32>${ssrInterpolate(unref(t)("settings.situation.title"))}</span><label class="toggle" data-v-5092ca32><input type="checkbox"${ssrIncludeBooleanAttr(unref(appStore).customContextEnabled) ? " checked" : ""} data-v-5092ca32><span class="toggle__slider" data-v-5092ca32></span></label></div>`);
      if (unref(appStore).customContextEnabled) {
        _push(`<div class="settings-section__content" data-v-5092ca32><textarea class="context-textarea"${ssrRenderAttr("placeholder", unref(t)("settings.situation.placeholder"))} rows="2" data-v-5092ca32>${ssrInterpolate(unref(appStore).customContext)}</textarea><div class="quick-contexts" data-v-5092ca32><button class="quick-context-btn" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.situation.quickContexts.hackathon"))}</button><button class="quick-context-btn" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.situation.quickContexts.doctor"))}</button><button class="quick-context-btn" data-v-5092ca32>${ssrInterpolate(unref(t)("settings.situation.quickContexts.restaurant"))}</button></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      _push(ssrRenderComponent(_component_DebugPanel, null, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SettingsSidebar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-5092ca32"]]);

export { __nuxt_component_1 as _, useSpeechRecognition as u };
//# sourceMappingURL=SettingsSidebar-Dc35XKMD.mjs.map
