import { reactive, ref, readonly, computed, defineComponent, useSSRContext } from 'vue';
import { ssrRenderTeleport, ssrRenderClass, ssrRenderStyle } from 'vue/server-renderer';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import { c as useRuntimeConfig } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "GazeCursor",
  __ssrInlineRender: true,
  props: {
    position: {},
    dwellProgress: {},
    isOnTarget: { type: Boolean },
    isSelecting: { type: Boolean },
    visible: { type: Boolean },
    isLocked: { type: Boolean }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.visible && __props.position) {
          _push2(`<div class="${ssrRenderClass([{
            "gaze-dot--on-target": __props.isOnTarget,
            "gaze-dot--selecting": __props.isSelecting
          }, "gaze-dot"])}" style="${ssrRenderStyle({
            left: `${__props.position.x}px`,
            top: `${__props.position.y}px`
          })}" data-v-421e4b6f></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/GazeCursor.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-421e4b6f"]]);
function useTTS() {
  const state = reactive({
    isSupported: false,
    isSpeaking: false,
    voices: [],
    selectedVoice: null,
    rate: 0.9,
    // Slightly slower for clarity
    pitch: 1,
    volume: 1
  });
  const synth = ref(null);
  function initialize() {
    return;
  }
  function speakLocal(text, lang) {
    return new Promise((resolve, reject) => {
      if (!synth.value || !state.isSupported) {
        reject(new Error("TTS not supported"));
        return;
      }
      synth.value.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === "ar") {
        const arabicVoice = state.voices.find((v) => v.lang.startsWith("ar"));
        if (arabicVoice) {
          utterance.voice = arabicVoice;
        }
      } else if (lang === "ur") {
        const urduVoice = state.voices.find((v) => v.lang.startsWith("ur"));
        if (urduVoice) {
          utterance.voice = urduVoice;
        }
      } else if (state.selectedVoice) {
        utterance.voice = state.selectedVoice;
      }
      utterance.rate = state.rate;
      utterance.pitch = state.pitch;
      utterance.volume = state.volume;
      utterance.onstart = () => {
        state.isSpeaking = true;
      };
      utterance.onend = () => {
        state.isSpeaking = false;
        resolve();
      };
      utterance.onerror = (event) => {
        state.isSpeaking = false;
        reject(new Error(`TTS Error: ${event.error}`));
      };
      synth.value.speak(utterance);
    });
  }
  async function speak(text, lang, context) {
    if (!text) return;
    state.isSpeaking = true;
    try {
      const config = useRuntimeConfig();
      const baseUrl = config.public.apiBaseUrl || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/tts/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          language: lang || "en",
          enrich_directions: true,
          ...(context == null ? void 0 : context.scene_description) && { scene_description: context.scene_description },
          ...(context == null ? void 0 : context.conversation_context) && { conversation_context: context.conversation_context },
          ...(context == null ? void 0 : context.custom_context) && { custom_context: context.custom_context }
        })
      });
      if (!response.ok) throw new Error(`Remote TTS failed: ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          state.isSpeaking = false;
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = (e) => {
          state.isSpeaking = false;
          URL.revokeObjectURL(url);
          console.error("Audio playback error", e);
          reject(e);
        };
        audio.play().catch((e) => {
          reject(e);
        });
      });
    } catch (e) {
      console.warn("Remote TTS failed, falling back to local synthesis", e);
      state.isSpeaking = false;
      return speakLocal(text, lang);
    }
  }
  function stop() {
    if (synth.value) {
      synth.value.cancel();
      state.isSpeaking = false;
    }
  }
  function setVoice(voice) {
    state.selectedVoice = voice;
  }
  function getVoicesByLang(langPrefix) {
    return state.voices.filter((v) => v.lang.startsWith(langPrefix));
  }
  return {
    state: readonly(state),
    speak,
    stop,
    setVoice,
    getVoicesByLang,
    initialize
  };
}
function useMinimalNavigation() {
  const navigableItems = ref([]);
  const currentIndex = ref(-1);
  const isShiftPressed = ref(false);
  const currentItem = computed(() => {
    return currentIndex.value >= 0 ? navigableItems.value[currentIndex.value] : null;
  });
  function registerItem(item) {
    const existingIndex = navigableItems.value.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      navigableItems.value[existingIndex] = item;
    } else {
      navigableItems.value.push(item);
    }
    navigableItems.value.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  function unregisterItem(id) {
    const index = navigableItems.value.findIndex((i) => i.id === id);
    if (index >= 0) {
      navigableItems.value.splice(index, 1);
      if (currentIndex.value >= navigableItems.value.length) {
        currentIndex.value = navigableItems.value.length - 1;
      }
    }
  }
  function navigate(direction) {
    if (navigableItems.value.length === 0) return;
    let newIndex = currentIndex.value;
    switch (direction) {
      case "next":
        newIndex = (newIndex + 1) % navigableItems.value.length;
        break;
      case "previous":
        newIndex = newIndex <= 0 ? navigableItems.value.length - 1 : newIndex - 1;
        break;
      case "up":
      case "down":
      case "left":
      case "right":
        newIndex = findClosestItemInDirection(direction);
        break;
    }
    if (newIndex !== currentIndex.value && newIndex >= 0) {
      currentIndex.value = newIndex;
      highlightItem(navigableItems.value[newIndex]);
    }
  }
  function findClosestItemInDirection(direction) {
    if (currentIndex.value < 0 || !currentItem.value || navigableItems.value.length === 0) {
      return 0;
    }
    const currentRect = currentItem.value.element.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;
    let bestIndex = currentIndex.value;
    let bestScore = Infinity;
    navigableItems.value.forEach((item, index) => {
      if (index === currentIndex.value) return;
      const rect = item.element.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const itemCenterY = rect.top + rect.height / 2;
      let isInDirection = false;
      let score = 0;
      switch (direction) {
        case "up":
          isInDirection = itemCenterY < currentCenterY;
          if (isInDirection) {
            const verticalDistance = currentCenterY - itemCenterY;
            const horizontalDistance = Math.abs(currentCenterX - itemCenterX);
            score = verticalDistance + horizontalDistance * 2;
          }
          break;
        case "down":
          isInDirection = itemCenterY > currentCenterY;
          if (isInDirection) {
            const verticalDistance = itemCenterY - currentCenterY;
            const horizontalDistance = Math.abs(currentCenterX - itemCenterX);
            score = verticalDistance + horizontalDistance * 2;
          }
          break;
        case "left":
          isInDirection = itemCenterX < currentCenterX;
          if (isInDirection) {
            const horizontalDistance = currentCenterX - itemCenterX;
            const verticalDistance = Math.abs(currentCenterY - itemCenterY);
            score = horizontalDistance + verticalDistance * 2;
          }
          break;
        case "right":
          isInDirection = itemCenterX > currentCenterX;
          if (isInDirection) {
            const horizontalDistance = itemCenterX - currentCenterX;
            const verticalDistance = Math.abs(currentCenterY - itemCenterY);
            score = horizontalDistance + verticalDistance * 2;
          }
          break;
      }
      if (isInDirection) {
        let edgePenalty = 0;
        if (rect.left < 0 || rect.right > (void 0).innerWidth) edgePenalty += 1e3;
        if (rect.top < 0 || rect.bottom > (void 0).innerHeight) edgePenalty += 1e3;
        score += edgePenalty;
      }
      if (isInDirection && score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    if (bestIndex === currentIndex.value) {
      let closestIndex = currentIndex.value;
      let closestDistance = Infinity;
      navigableItems.value.forEach((item, index) => {
        if (index === currentIndex.value) return;
        const rect = item.element.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const itemCenterY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(currentCenterX - itemCenterX, 2) + Math.pow(currentCenterY - itemCenterY, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      return closestIndex;
    }
    return bestIndex;
  }
  function highlightItem(item) {
    navigableItems.value.forEach((i) => {
      i.element.classList.remove("keyboard-nav-highlighted");
    });
    item.element.classList.add("keyboard-nav-highlighted");
    item.element.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest"
    });
  }
  function activateCurrent() {
    if (currentItem.value) {
      if (isShiftPressed.value) {
        currentItem.value.element.dispatchEvent(new MouseEvent("click", {
          shiftKey: true,
          bubbles: true,
          cancelable: true
        }));
      } else {
        if (currentItem.value.action) {
          currentItem.value.action();
        } else {
          currentItem.value.element.click();
        }
      }
    }
  }
  function clearFocus() {
    navigableItems.value.forEach((item) => {
      item.element.classList.remove("keyboard-nav-highlighted");
    });
    currentIndex.value = -1;
  }
  function startFromItem(itemId) {
    const index = navigableItems.value.findIndex((item) => item.id === itemId);
    if (index >= 0) {
      currentIndex.value = index;
      highlightItem(navigableItems.value[index]);
    }
  }
  return {
    navigableItems: computed(() => navigableItems.value),
    currentIndex: computed(() => currentIndex.value),
    currentItem,
    isShiftPressed: computed(() => isShiftPressed.value),
    registerItem,
    unregisterItem,
    navigate,
    activateCurrent,
    clearFocus,
    startFromItem
  };
}

export { __nuxt_component_0 as _, useMinimalNavigation as a, useTTS as u };
//# sourceMappingURL=useMinimalNavigation-BTlMHU14.mjs.map
