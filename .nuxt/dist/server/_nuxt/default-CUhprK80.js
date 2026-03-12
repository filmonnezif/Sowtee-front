import { _ as __nuxt_component_0 } from "./nuxt-link-bQNUgHdo.js";
import { _ as __nuxt_component_1 } from "./SettingsSidebar-Dc35XKMD.js";
import { defineComponent, computed, mergeProps, withCtx, createVNode, unref, createTextVNode, toDisplayString, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderClass, ssrRenderSlot } from "vue/server-renderer";
import { _ as _imports_0 } from "./sowteeLogo-Drhy_eyy.js";
import { UserRound, Settings } from "lucide-vue-next";
import { a as useAppStore } from "../server.mjs";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "/home/filmon/Sowtee/frontend/node_modules/ufo/dist/index.mjs";
import "./useGazeController-CqZ3gTDn.js";
import "/home/filmon/Sowtee/frontend/node_modules/hookable/dist/index.mjs";
import "./useApi-DXXljJZv.js";
import "/home/filmon/Sowtee/frontend/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/filmon/Sowtee/frontend/node_modules/unctx/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/home/filmon/Sowtee/frontend/node_modules/defu/dist/defu.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/klona/dist/index.mjs";
import "framesync";
import "popmotion";
import "style-value-types";
import "/home/filmon/Sowtee/frontend/node_modules/nuxt/node_modules/cookie-es/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/destr/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/nuxt/node_modules/ohash/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/@unhead/vue/dist/index.mjs";
import "@vue/devtools-api";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const appStore = useAppStore();
    const userLabel = computed(() => appStore.userName || "Guest");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_SettingsSidebar = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-aac-bg text-aac-text" }, _attrs))} data-v-2736a774><header class="app-topbar" data-v-2736a774>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "app-topbar__brand",
        title: "Sowtee Home"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img${ssrRenderAttr("src", _imports_0)} alt="SOWTEE" class="app-topbar__logo" data-v-2736a774${_scopeId}>`);
          } else {
            return [
              createVNode("img", {
                src: _imports_0,
                alt: "SOWTEE",
                class: "app-topbar__logo"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="app-topbar__actions" data-v-2736a774>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/profile",
        class: "app-topbar__name",
        title: _ctx.$t("profile.title")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(userLabel))}`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(userLabel)), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/profile",
        class: "app-topbar__icon",
        title: _ctx.$t("profile.title")
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(unref(UserRound), { size: 18 }, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(unref(UserRound), { size: 18 })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<button class="${ssrRenderClass([{ "app-topbar__icon--active": unref(appStore).settingsExpanded }, "app-topbar__icon"])}"${ssrRenderAttr("title", _ctx.$t("settings.title"))} data-v-2736a774>`);
      _push(ssrRenderComponent(unref(Settings), { size: 18 }, null, _parent));
      _push(`</button></div></header>`);
      if (unref(appStore).settingsExpanded) {
        _push(ssrRenderComponent(_component_SettingsSidebar, null, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<main class="app-main" data-v-2736a774>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2736a774"]]);
export {
  _default as default
};
//# sourceMappingURL=default-CUhprK80.js.map
