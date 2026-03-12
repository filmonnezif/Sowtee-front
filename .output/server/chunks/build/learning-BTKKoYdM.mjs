import { _ as __nuxt_component_0 } from './nuxt-link-bQNUgHdo.mjs';
import { defineComponent, computed, ref, mergeProps, withCtx, openBlock, createBlock, createVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderStyle, ssrRenderList, ssrRenderAttr, ssrRenderClass } from 'vue/server-renderer';
import { u as useApi } from './useApi-DXXljJZv.mjs';
import { a as useAppStore } from './server.mjs';
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
  __name: "learning",
  __ssrInlineRender: true,
  setup(__props) {
    useApi();
    const appStore = useAppStore();
    computed(() => appStore.userId || "default-user");
    const metrics = ref(null);
    const timeline = ref([]);
    const strategies = ref({});
    const events = ref([]);
    const summary = ref(null);
    const isLoading = ref(true);
    ref(/* @__PURE__ */ new Date());
    const userLabel = computed(() => appStore.userName || appStore.userId);
    const accuracyPercent = computed(() => {
      if (!metrics.value) return 0;
      return Math.round((metrics.value.prediction_accuracy || 0) * 100);
    });
    const acceptancePercent = computed(() => {
      if (!metrics.value) return 0;
      return Math.round((metrics.value.suggestion_acceptance_rate || 0) * 100);
    });
    const sortedStrategies = computed(() => {
      if (!strategies.value) return [];
      return Object.entries(strategies.value).map(([id, stats]) => ({
        id,
        name: formatStrategyName(id),
        icon: strategyIcon(id),
        ...stats,
        success_rate_percent: Math.round((stats.success_rate || 0) * 100)
      })).sort((a, b) => b.success_rate_percent - a.success_rate_percent);
    });
    const recentEvents = computed(() => {
      if (!events.value) return [];
      return [...events.value].reverse().slice(0, 20);
    });
    const timelinePoints = computed(() => {
      if (!timeline.value || timeline.value.length === 0) return [];
      return timeline.value.map((point, i) => ({
        ...point,
        accuracyPercent: Math.round((point.accuracy || 0) * 100),
        label: `#${point.interactions || i + 1}`
      }));
    });
    const heroMessage = computed(() => {
      var _a;
      const message = (_a = summary.value) == null ? void 0 : _a.message;
      if (!message || typeof message !== "string") {
        return "Every interaction makes your agent smarter.";
      }
      if (/simulat(ed|ion)/i.test(message)) {
        return "Every interaction makes your agent smarter.";
      }
      return message;
    });
    const peakAccuracy = computed(() => {
      if (!timelinePoints.value.length) return 0;
      return Math.max(...timelinePoints.value.map((t) => t.accuracyPercent));
    });
    function formatStrategyName(id) {
      const names = {
        memory_first: "Memory First",
        llm_reasoning: "LLM Reasoning",
        hybrid_weighted: "Hybrid Weighted",
        frequency_boost: "Frequency Boost",
        context_heavy: "Context Heavy",
        default: "Default"
      };
      return names[id] || id;
    }
    function strategyIcon(id) {
      const icons = {
        memory_first: "\u{1F9E0}",
        llm_reasoning: "\u{1F916}",
        hybrid_weighted: "\u2696\uFE0F",
        frequency_boost: "\u{1F4CA}",
        context_heavy: "\u{1F441}\uFE0F",
        default: "\u2699\uFE0F"
      };
      return icons[id] || "\u{1F527}";
    }
    function eventIcon(type) {
      const icons = {
        prediction_recorded: "\u{1F4DD}",
        vocabulary_growth: "\u{1F4DA}",
        snapshot_taken: "\u{1F4F8}",
        strategy_change: "\u{1F3AF}",
        conversation_signal: "\u{1F5E3}\uFE0F",
        video_signal: "\u{1F3A5}",
        maps_signal: "\u{1F5FA}\uFE0F"
      };
      return icons[type] || "\u{1F4A1}";
    }
    function eventLabel(type) {
      const labels = {
        prediction_recorded: "Prediction",
        vocabulary_growth: "New Phrase",
        snapshot_taken: "Checkpoint",
        strategy_change: "Strategy",
        conversation_signal: "Conversation Context",
        video_signal: "Scene Context",
        maps_signal: "Location Context"
      };
      return labels[type] || type;
    }
    function timeAgo(ts) {
      const now = Date.now();
      const then = new Date(ts).getTime();
      const diff = now - then;
      const mins = Math.floor(diff / 6e4);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "learning-dashboard" }, _attrs))} data-v-6313026e>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "back-btn",
        title: "Back to Home"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-v-6313026e${_scopeId}><path d="m12 19-7-7 7-7" data-v-6313026e${_scopeId}></path><path d="M19 12H5" data-v-6313026e${_scopeId}></path></svg>`);
          } else {
            return [
              (openBlock(), createBlock("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                width: "20",
                height: "20",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
              }, [
                createVNode("path", { d: "m12 19-7-7 7-7" }),
                createVNode("path", { d: "M19 12H5" })
              ]))
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(isLoading)) {
        _push(`<div class="loading-state" data-v-6313026e><div class="pulse-brain" data-v-6313026e>\u{1F9E0}</div><p data-v-6313026e>Loading learning data...</p></div>`);
      } else {
        _push(`<div class="dashboard-content" data-v-6313026e><header class="hero" data-v-6313026e><div class="hero__icon" data-v-6313026e><div class="brain-pulse" data-v-6313026e>\u{1F9E0}</div></div><h1 class="hero__title" data-v-6313026e>Your Agent is Learning</h1><p class="hero__subtitle" data-v-6313026e>${ssrInterpolate(unref(heroMessage))}</p><p class="hero__subtitle" data-v-6313026e>User: ${ssrInterpolate(unref(userLabel))}</p><div class="hero__live" data-v-6313026e><span class="live-dot" data-v-6313026e></span><span data-v-6313026e>Auto-refreshing</span></div></header><section class="stats-grid" data-v-6313026e><div class="stat-card stat-card--accent" data-v-6313026e><div class="stat-card__value" data-v-6313026e>${ssrInterpolate(unref(accuracyPercent))}%</div><div class="stat-card__label" data-v-6313026e>Prediction Accuracy</div><div class="stat-card__bar" data-v-6313026e><div class="stat-card__fill" style="${ssrRenderStyle({ width: `${unref(accuracyPercent)}%` })}" data-v-6313026e></div></div></div><div class="stat-card" data-v-6313026e><div class="stat-card__value" data-v-6313026e>${ssrInterpolate(((_a = unref(metrics)) == null ? void 0 : _a.vocabulary_size) || 0)}</div><div class="stat-card__label" data-v-6313026e>Phrases Learned</div><div class="stat-card__icon" data-v-6313026e>\u{1F4DA}</div></div><div class="stat-card" data-v-6313026e><div class="stat-card__value" data-v-6313026e>${ssrInterpolate(((_b = unref(metrics)) == null ? void 0 : _b.total_interactions) || 0)}</div><div class="stat-card__label" data-v-6313026e>Total Interactions</div><div class="stat-card__icon" data-v-6313026e>\u{1F4AC}</div></div><div class="stat-card" data-v-6313026e><div class="stat-card__value" data-v-6313026e>${ssrInterpolate(unref(acceptancePercent))}%</div><div class="stat-card__label" data-v-6313026e>Acceptance Rate</div><div class="stat-card__bar" data-v-6313026e><div class="stat-card__fill stat-card__fill--secondary" style="${ssrRenderStyle({ width: `${unref(acceptancePercent)}%` })}" data-v-6313026e></div></div></div><div class="stat-card" data-v-6313026e><div class="stat-card__value" data-v-6313026e>${ssrInterpolate(((_c = unref(metrics)) == null ? void 0 : _c.strategies_tried) || 0)}</div><div class="stat-card__label" data-v-6313026e>Strategies Tried</div><div class="stat-card__icon" data-v-6313026e>\u{1F3AF}</div></div><div class="stat-card" data-v-6313026e><div class="stat-card__value" data-v-6313026e>${ssrInterpolate(Math.round(((_d = unref(metrics)) == null ? void 0 : _d.avg_response_time_ms) || 0))}ms</div><div class="stat-card__label" data-v-6313026e>Avg Response Time</div><div class="stat-card__icon" data-v-6313026e>\u26A1</div></div></section>`);
        if (unref(timelinePoints).length > 0) {
          _push(`<section class="section" data-v-6313026e><h2 class="section__title" data-v-6313026e>\u{1F4C8} Accuracy Over Time</h2><div class="timeline-chart" data-v-6313026e><div class="timeline-chart__y-axis" data-v-6313026e><span data-v-6313026e>100%</span><span data-v-6313026e>50%</span><span data-v-6313026e>0%</span></div><div class="timeline-chart__bars" data-v-6313026e><!--[-->`);
          ssrRenderList(unref(timelinePoints), (point, i) => {
            _push(`<div class="timeline-bar"${ssrRenderAttr("title", `${point.accuracyPercent}% accuracy at ${point.interactions} interactions`)} data-v-6313026e><div style="${ssrRenderStyle({ height: `${point.accuracyPercent}%` })}" class="${ssrRenderClass([{ "timeline-bar__fill--peak": point.accuracyPercent === unref(peakAccuracy) && unref(peakAccuracy) > 0 }, "timeline-bar__fill"])}" data-v-6313026e></div><span class="timeline-bar__label" data-v-6313026e>${ssrInterpolate(point.label)}</span></div>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(sortedStrategies).length > 0) {
          _push(`<section class="section" data-v-6313026e><h2 class="section__title" data-v-6313026e>\u{1F3AF} Strategy Performance</h2><div class="strategy-list" data-v-6313026e><!--[-->`);
          ssrRenderList(unref(sortedStrategies), (strategy) => {
            _push(`<div class="strategy-card" data-v-6313026e><div class="strategy-card__header" data-v-6313026e><span class="strategy-card__icon" data-v-6313026e>${ssrInterpolate(strategy.icon)}</span><span class="strategy-card__name" data-v-6313026e>${ssrInterpolate(strategy.name)}</span><span class="strategy-card__rate" data-v-6313026e>${ssrInterpolate(strategy.success_rate_percent)}%</span></div><div class="strategy-card__bar" data-v-6313026e><div class="strategy-card__fill" style="${ssrRenderStyle({ width: `${strategy.success_rate_percent}%` })}" data-v-6313026e></div></div><div class="strategy-card__meta" data-v-6313026e>${ssrInterpolate(strategy.attempts)} attempts \xB7 ${ssrInterpolate(strategy.successes)} successes </div></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="section" data-v-6313026e><h2 class="section__title" data-v-6313026e>\u{1F4CB} Learning Events</h2>`);
        if (unref(recentEvents).length === 0) {
          _push(`<div class="empty-state" data-v-6313026e><p data-v-6313026e>No learning events yet. Start using the app to see the agent learn!</p></div>`);
        } else {
          _push(`<div class="events-feed" data-v-6313026e><!--[-->`);
          ssrRenderList(unref(recentEvents), (event, i) => {
            _push(`<div class="event-item" data-v-6313026e><span class="event-item__icon" data-v-6313026e>${ssrInterpolate(eventIcon(event.type))}</span><div class="event-item__content" data-v-6313026e><span class="event-item__type" data-v-6313026e>${ssrInterpolate(eventLabel(event.type))}</span>`);
            if (event.new_phrase) {
              _push(`<span class="event-item__detail" data-v-6313026e>&quot;${ssrInterpolate(event.new_phrase)}&quot;</span>`);
            } else if (event.match !== void 0) {
              _push(`<span class="event-item__detail" data-v-6313026e>${ssrInterpolate(event.match ? "\u2705 Correct" : "\u274C Missed")} `);
              if (event.strategy) {
                _push(`<span data-v-6313026e> \xB7 ${ssrInterpolate(formatStrategyName(event.strategy))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</span>`);
            } else if (event.accuracy !== void 0) {
              _push(`<span class="event-item__detail" data-v-6313026e> Accuracy: ${ssrInterpolate(Math.round(event.accuracy * 100))}% </span>`);
            } else if (event.detail) {
              _push(`<span class="event-item__detail" data-v-6313026e>${ssrInterpolate(event.detail)}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><span class="event-item__time" data-v-6313026e>${ssrInterpolate(timeAgo(event.ts))}</span></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</section></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/learning.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const learning = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-6313026e"]]);

export { learning as default };
//# sourceMappingURL=learning-BTKKoYdM.mjs.map
