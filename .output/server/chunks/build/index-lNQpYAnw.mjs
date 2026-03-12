import { u as useTTS, a as useMinimalNavigation, _ as __nuxt_component_0 } from './useMinimalNavigation-BTlMHU14.mjs';
import { defineComponent, ref, watch, nextTick, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderStyle, ssrRenderComponent, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';
import { _ as _imports_0 } from './sowteeLogo-Drhy_eyy.mjs';
import { ArrowRight, Eye, Mic, Globe, Sparkles, Brain, Zap } from 'lucide-vue-next';
import { a as useAppStore, n as navigateTo } from './server.mjs';
import { u as useCamera, a as useEyeGaze, b as useGazeController } from './useGazeController-CqZ3gTDn.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue-router';
import 'node:url';
import 'framesync';
import 'popmotion';
import 'style-value-types';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const appStore = useAppStore();
    const camera = useCamera();
    useTTS();
    const eyeGaze = useEyeGaze();
    const gazeController = useGazeController();
    const minimalNav = useMinimalNavigation();
    const speakingCardRef = ref(null);
    const videoRef = ref(null);
    const canvasRef = ref(null);
    const loginName = ref("");
    ref(null);
    ref(null);
    ref(null);
    ref(null);
    ref([]);
    ref(null);
    ref(null);
    const mouseX = ref(0);
    const mouseY = ref(0);
    watch(videoRef, (el) => camera.setVideoRef(el));
    watch(canvasRef, (el) => camera.setCanvasRef(el));
    watch(
      () => appStore.webgazerCameraId,
      async (newCameraId) => {
        if (appStore.interactionMode === "eye_gaze" && camera.state.isActive && newCameraId !== camera.state.selectedDeviceId) {
          await camera.selectCamera(newCameraId || "");
        }
      }
    );
    watch(speakingCardRef, () => {
      if (minimalNav.navigableItems.value.length === 0) {
        nextTick(() => setupMinimalNavigation());
      }
    });
    function setupMinimalNavigation() {
      if (speakingCardRef.value) {
        minimalNav.registerItem({
          id: "try-demo",
          element: speakingCardRef.value,
          action: openSpeaking,
          priority: 10
        });
      }
    }
    function registerGazeTargets() {
      if (speakingCardRef.value) {
        gazeController.registerTarget("try-demo", speakingCardRef.value, 100, {
          hitBounds: {
            top: 0,
            left: 0,
            width: (void 0).innerWidth,
            height: (void 0).innerHeight
          }
        });
      }
    }
    async function enableEyeGazeExperience() {
      await eyeGaze.initialize();
      if (!camera.state.isActive) {
        const webgazerCameraId = appStore.getCameraForPurpose("webgazer");
        await camera.startCamera("environment", webgazerCameraId || void 0);
      }
      if (!appStore.eyeGazeCalibrated && !eyeGaze.state.useMouseFallback) {
        await startCalibration();
      } else {
        await eyeGaze.startTracking();
        gazeController.start();
        await nextTick();
        registerGazeTargets();
      }
    }
    function disableEyeGazeExperience() {
      eyeGaze.stopTracking();
      eyeGaze.stopImplicitCalibration();
      gazeController.stop();
      camera.stopCamera();
    }
    watch(
      () => appStore.interactionMode,
      async (mode) => {
        if (mode === "eye_gaze") {
          await enableEyeGazeExperience();
        } else {
          disableEyeGazeExperience();
        }
      }
    );
    async function startCalibration() {
      appStore.eyeGazeCalibrated = false;
      gazeController.stop();
      await eyeGaze.startTracking();
      eyeGaze.startImplicitCalibration();
    }
    function openSpeaking() {
      navigateTo("/speaking");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_GazeCursor = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "home" }, _attrs))} data-v-cf767411><video class="hidden" autoplay playsinline muted data-v-cf767411></video><canvas class="hidden" data-v-cf767411></canvas><div class="particles-container" aria-hidden="true" data-v-cf767411><!--[-->`);
      ssrRenderList(20, (i) => {
        _push(`<div class="${ssrRenderClass([`particle--${i % 4}`, "particle"])}" data-v-cf767411></div>`);
      });
      _push(`<!--]--></div><div class="gradient-orbs" aria-hidden="true" data-v-cf767411><div class="orb orb--1" style="${ssrRenderStyle({
        transform: `translate(${unref(mouseX) * 15}px, ${unref(mouseY) * 15}px)`
      })}" data-v-cf767411></div><div class="orb orb--2" style="${ssrRenderStyle({
        transform: `translate(${unref(mouseX) * -10}px, ${unref(mouseY) * -10}px)`
      })}" data-v-cf767411></div><div class="orb orb--3" style="${ssrRenderStyle({
        transform: `translate(${unref(mouseX) * 8}px, ${unref(mouseY) * 8}px)`
      })}" data-v-cf767411></div></div>`);
      if (unref(eyeGaze).state.isImplicitCalibration) {
        _push(`<div class="fixed bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 pointer-events-none" data-v-cf767411><div class="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md text-lg font-medium border border-white/10 shadow-xl pointer-events-auto" data-v-cf767411> Keep looking at what you want to select. </div><button class="bg-aac-highlight hover:bg-aac-highlight/80 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg transition-transform active:scale-95 pointer-events-auto" data-v-cf767411> Done </button></div>`);
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
        visible: unref(appStore).interactionMode === "eye_gaze" && (unref(gazeController).state.isActive || unref(eyeGaze).state.isImplicitCalibration)
      }, null, _parent));
      _push(`<main class="home__content" data-v-cf767411><section class="hero" data-v-cf767411><div class="hero__logo-wrapper" data-v-cf767411><img${ssrRenderAttr("src", _imports_0)} alt="Sowtee" class="hero__logo" data-v-cf767411><div class="hero__logo-glow" data-v-cf767411></div></div><h1 class="hero__title" data-v-cf767411> Communicate <span class="hero__title-accent" data-v-cf767411>effortlessly</span></h1><p class="hero__tagline" data-v-cf767411> The AAC voice that learns you. </p><div class="demo-cta" data-v-cf767411>`);
      if (!unref(appStore).userName) {
        _push(`<div class="identity-login" data-v-cf767411><input${ssrRenderAttr("value", unref(loginName))} type="text" placeholder="Enter your name" data-v-cf767411><button class="identity-login__btn" data-v-cf767411> Continue </button></div>`);
      } else {
        _push(`<div class="identity-active" data-v-cf767411><span class="identity-active__dot" data-v-cf767411></span> Signed in as <strong data-v-cf767411>${ssrInterpolate(unref(appStore).userName)}</strong></div>`);
      }
      _push(`<button class="${ssrRenderClass([{
        "try-demo-btn--gaze-target": unref(appStore).interactionMode === "eye_gaze",
        "try-demo-btn--gaze-active": unref(gazeController).state.currentTargetId === "try-demo"
      }, "try-demo-btn navigable-item"])}" data-v-cf767411><span class="try-demo-btn__content" data-v-cf767411><span class="try-demo-btn__label" data-v-cf767411>Try Demo</span><span class="try-demo-btn__sub" data-v-cf767411>Open AAC speaking page</span></span>`);
      _push(ssrRenderComponent(unref(ArrowRight), {
        size: 24,
        class: "try-demo-btn__arrow"
      }, null, _parent));
      _push(`<div class="try-demo-btn__shimmer" data-v-cf767411></div>`);
      if (unref(gazeController).state.currentTargetId === "try-demo") {
        _push(`<div class="try-demo-btn__progress" data-v-cf767411><div class="try-demo-btn__progress-fill" style="${ssrRenderStyle({ width: `${unref(gazeController).state.dwellProgress * 100}%` })}" data-v-cf767411></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button><div class="scroll-indicator" data-v-cf767411><span class="scroll-indicator__text" data-v-cf767411>Scroll down to see features</span><div class="scroll-indicator__chevron" aria-hidden="true" data-v-cf767411>\u2304</div></div></div></section><section class="feature-grid" aria-label="Main features" data-v-cf767411><article class="feature-card" data-v-cf767411><div class="feature-card__icon-wrap feature-card__icon-wrap--blue" data-v-cf767411>`);
      _push(ssrRenderComponent(unref(Eye), { size: 28 }, null, _parent));
      _push(`</div><h2 data-v-cf767411>Low-effort input</h2><p data-v-cf767411>Eye gaze, joystick, arrow keys, plus natural keyboard and mouse input.</p><div class="feature-card__shine" data-v-cf767411></div></article><article class="feature-card feature-card--elevated" data-v-cf767411><div class="feature-card__icon-wrap feature-card__icon-wrap--purple" data-v-cf767411>`);
      _push(ssrRenderComponent(unref(Mic), { size: 28 }, null, _parent));
      _push(`</div><h2 data-v-cf767411>Voice clone support</h2><p data-v-cf767411>Speak with a personalized voice that sounds closer to you.</p><div class="feature-card__shine" data-v-cf767411></div></article><article class="feature-card" data-v-cf767411><div class="feature-card__icon-wrap feature-card__icon-wrap--teal" data-v-cf767411>`);
      _push(ssrRenderComponent(unref(Globe), { size: 28 }, null, _parent));
      _push(`</div><h2 data-v-cf767411>3-language support</h2><p data-v-cf767411>Use English, Arabic, and Urdu in one adaptive communication experience.</p><div class="feature-card__shine" data-v-cf767411></div></article></section><section class="stats-section" data-v-cf767411><div class="stat-item" data-v-cf767411><div class="stat-item__icon" data-v-cf767411>`);
      _push(ssrRenderComponent(unref(Sparkles), { size: 20 }, null, _parent));
      _push(`</div><div class="stat-item__value" data-v-cf767411>Self-learning</div><div class="stat-item__label" data-v-cf767411>Adapts to your patterns</div></div><div class="stats-divider" data-v-cf767411></div><div class="stat-item" data-v-cf767411><div class="stat-item__icon" data-v-cf767411>`);
      _push(ssrRenderComponent(unref(Brain), { size: 20 }, null, _parent));
      _push(`</div><div class="stat-item__value" data-v-cf767411>Context-aware</div><div class="stat-item__label" data-v-cf767411>Scene &amp; conversation context</div></div><div class="stats-divider" data-v-cf767411></div><div class="stat-item" data-v-cf767411><div class="stat-item__icon" data-v-cf767411>`);
      _push(ssrRenderComponent(unref(Zap), { size: 20 }, null, _parent));
      _push(`</div><div class="stat-item__value" data-v-cf767411>Low latency</div><div class="stat-item__label" data-v-cf767411>Fast predictions for real talk</div></div></section>`);
      if (unref(appStore).sentenceHistory.length > 0) {
        _push(`<section class="recent-sentences" data-v-cf767411><p class="recent-sentences__label" data-v-cf767411>Recent phrases</p><div class="recent-sentences__items" data-v-cf767411><!--[-->`);
        ssrRenderList(unref(appStore).sentenceHistory.slice(0, 3), (sentence) => {
          _push(`<button class="recent-sentence" data-v-cf767411>${ssrInterpolate(sentence)}</button>`);
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main>`);
      if (!unref(appStore).settingsExpanded) {
        _push(`<footer class="home-footer" data-v-cf767411><p class="keyboard-nav-hint" data-v-cf767411> Press <kbd data-v-cf767411>Enter</kbd> to start \u2022 Arrow keys and Tab also work </p></footer>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-cf767411"]]);

export { index as default };
//# sourceMappingURL=index-lNQpYAnw.mjs.map
