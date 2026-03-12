import { defineComponent, ref, computed, mergeProps, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderClass } from "vue/server-renderer";
import { useRouter } from "vue-router";
import { a as useAppStore } from "../server.mjs";
import { u as useApi } from "./useApi-DXXljJZv.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
import "/home/filmon/Sowtee/frontend/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/filmon/Sowtee/frontend/node_modules/hookable/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/unctx/dist/index.mjs";
import "/home/filmon/Sowtee/frontend/node_modules/h3/dist/index.mjs";
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "profile",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    const store = useAppStore();
    useApi();
    const profile2 = ref({
      display_name: "",
      age: null,
      condition: "",
      condition_stage: "",
      primary_language: "en",
      secondary_language: "",
      location: "",
      living_situation: "",
      interests: [],
      daily_routine: "",
      communication_style: "casual",
      common_needs: [],
      caregiver_name: "",
      notes: ""
    });
    const newInterest = ref("");
    const newNeed = ref("");
    const isSaving = ref(false);
    const showSaveSuccess = ref(false);
    const loginName = ref(store.userName || "");
    const activeUserLabel = computed(() => {
      return store.userName ? `${store.userName} (${store.userId})` : store.userId;
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "profile-page" }, _attrs))} data-v-000d5c18><header class="profile-header" data-v-000d5c18><button class="back-btn" data-v-000d5c18><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-000d5c18><path d="M19 12H5M12 19l-7-7 7-7" data-v-000d5c18></path></svg></button><h1 data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.title"))}</h1><div class="header-spacer" data-v-000d5c18></div></header><main class="profile-content" data-v-000d5c18><section class="profile-section" data-v-000d5c18><h2 class="section-title" data-v-000d5c18>Identity</h2><div class="field-group" data-v-000d5c18><div class="field" data-v-000d5c18><label data-v-000d5c18>Login with your name</label><div class="identity-row" data-v-000d5c18><input${ssrRenderAttr("value", loginName.value)} type="text" placeholder="Type your name" data-v-000d5c18><button class="identity-btn" data-v-000d5c18>Login</button></div></div><p class="identity-meta" data-v-000d5c18>Current user: ${ssrInterpolate(activeUserLabel.value)}</p></div></section>`);
      if (showSaveSuccess.value) {
        _push(`<div class="save-toast" data-v-000d5c18><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-v-000d5c18><path d="M20 6L9 17l-5-5" data-v-000d5c18></path></svg> ${ssrInterpolate(_ctx.$t("profile.saved"))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<section class="profile-section" data-v-000d5c18><h2 class="section-title" data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.sections.personal"))}</h2><div class="field-group" data-v-000d5c18><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.displayName"))}</label><input${ssrRenderAttr("value", profile2.value.display_name)} type="text"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.displayName"))} data-v-000d5c18></div><div class="field field-half" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.age"))}</label><input${ssrRenderAttr("value", profile2.value.age)} type="number" min="1" max="120" placeholder="—" data-v-000d5c18></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.location"))}</label><input${ssrRenderAttr("value", profile2.value.location)} type="text"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.location"))} data-v-000d5c18></div></div></section><section class="profile-section" data-v-000d5c18><h2 class="section-title" data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.sections.medical"))}</h2><div class="field-group" data-v-000d5c18><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.condition"))}</label><select data-v-000d5c18><option value="" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "") : ssrLooseEqual(profile2.value.condition, "")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.placeholders.selectCondition"))}</option><option value="ALS" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "ALS") : ssrLooseEqual(profile2.value.condition, "ALS")) ? " selected" : ""}>ALS</option><option value="MS" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "MS") : ssrLooseEqual(profile2.value.condition, "MS")) ? " selected" : ""}>MS</option><option value="Cerebral Palsy" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "Cerebral Palsy") : ssrLooseEqual(profile2.value.condition, "Cerebral Palsy")) ? " selected" : ""}>Cerebral Palsy</option><option value="Stroke" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "Stroke") : ssrLooseEqual(profile2.value.condition, "Stroke")) ? " selected" : ""}>Stroke</option><option value="Parkinson&#39;s" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "Parkinson's") : ssrLooseEqual(profile2.value.condition, "Parkinson's")) ? " selected" : ""}>Parkinson&#39;s</option><option value="TBI" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "TBI") : ssrLooseEqual(profile2.value.condition, "TBI")) ? " selected" : ""}>Traumatic Brain Injury</option><option value="Other" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition) ? ssrLooseContain(profile2.value.condition, "Other") : ssrLooseEqual(profile2.value.condition, "Other")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.other"))}</option></select></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.conditionStage"))}</label><select data-v-000d5c18><option value="" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition_stage) ? ssrLooseContain(profile2.value.condition_stage, "") : ssrLooseEqual(profile2.value.condition_stage, "")) ? " selected" : ""}>—</option><option value="Early" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition_stage) ? ssrLooseContain(profile2.value.condition_stage, "Early") : ssrLooseEqual(profile2.value.condition_stage, "Early")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.stages.early"))}</option><option value="Moderate" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition_stage) ? ssrLooseContain(profile2.value.condition_stage, "Moderate") : ssrLooseEqual(profile2.value.condition_stage, "Moderate")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.stages.moderate"))}</option><option value="Advanced" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.condition_stage) ? ssrLooseContain(profile2.value.condition_stage, "Advanced") : ssrLooseEqual(profile2.value.condition_stage, "Advanced")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.stages.advanced"))}</option></select></div></div></section><section class="profile-section" data-v-000d5c18><h2 class="section-title" data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.sections.communication"))}</h2><div class="field-group" data-v-000d5c18><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.primaryLanguage"))}</label><select data-v-000d5c18><option value="en" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.primary_language) ? ssrLooseContain(profile2.value.primary_language, "en") : ssrLooseEqual(profile2.value.primary_language, "en")) ? " selected" : ""}>English</option><option value="ar" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.primary_language) ? ssrLooseContain(profile2.value.primary_language, "ar") : ssrLooseEqual(profile2.value.primary_language, "ar")) ? " selected" : ""}>العربية</option><option value="ur" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.primary_language) ? ssrLooseContain(profile2.value.primary_language, "ur") : ssrLooseEqual(profile2.value.primary_language, "ur")) ? " selected" : ""}>اردو</option></select></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.secondaryLanguage"))}</label><select data-v-000d5c18><option value="" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.secondary_language) ? ssrLooseContain(profile2.value.secondary_language, "") : ssrLooseEqual(profile2.value.secondary_language, "")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.none"))}</option><option value="en" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.secondary_language) ? ssrLooseContain(profile2.value.secondary_language, "en") : ssrLooseEqual(profile2.value.secondary_language, "en")) ? " selected" : ""}>English</option><option value="ar" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.secondary_language) ? ssrLooseContain(profile2.value.secondary_language, "ar") : ssrLooseEqual(profile2.value.secondary_language, "ar")) ? " selected" : ""}>العربية</option><option value="ur" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.secondary_language) ? ssrLooseContain(profile2.value.secondary_language, "ur") : ssrLooseEqual(profile2.value.secondary_language, "ur")) ? " selected" : ""}>اردو</option></select></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.communicationStyle"))}</label><div class="style-chips" data-v-000d5c18><!--[-->`);
      ssrRenderList(["brief", "casual", "formal", "detailed"], (style) => {
        _push(`<button class="${ssrRenderClass([{ active: profile2.value.communication_style === style }, "style-chip"])}" data-v-000d5c18>${ssrInterpolate(_ctx.$t(`profile.styles.${style}`))}</button>`);
      });
      _push(`<!--]--></div></div></div></section><section class="profile-section" data-v-000d5c18><h2 class="section-title" data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.sections.dailyLife"))}</h2><div class="field-group" data-v-000d5c18><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.livingSituation"))}</label><select data-v-000d5c18><option value="" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.living_situation) ? ssrLooseContain(profile2.value.living_situation, "") : ssrLooseEqual(profile2.value.living_situation, "")) ? " selected" : ""}>—</option><option value="With family" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.living_situation) ? ssrLooseContain(profile2.value.living_situation, "With family") : ssrLooseEqual(profile2.value.living_situation, "With family")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.living.withFamily"))}</option><option value="Care home" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.living_situation) ? ssrLooseContain(profile2.value.living_situation, "Care home") : ssrLooseEqual(profile2.value.living_situation, "Care home")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.living.careHome"))}</option><option value="Independent with aide" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.living_situation) ? ssrLooseContain(profile2.value.living_situation, "Independent with aide") : ssrLooseEqual(profile2.value.living_situation, "Independent with aide")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.living.independentAide"))}</option><option value="Independent" data-v-000d5c18${ssrIncludeBooleanAttr(Array.isArray(profile2.value.living_situation) ? ssrLooseContain(profile2.value.living_situation, "Independent") : ssrLooseEqual(profile2.value.living_situation, "Independent")) ? " selected" : ""}>${ssrInterpolate(_ctx.$t("profile.living.independent"))}</option></select></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.caregiverName"))}</label><input${ssrRenderAttr("value", profile2.value.caregiver_name)} type="text"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.caregiverName"))} data-v-000d5c18></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.interests"))}</label><div class="tag-input-wrap" data-v-000d5c18><div class="tags" data-v-000d5c18><!--[-->`);
      ssrRenderList(profile2.value.interests, (interest, idx) => {
        _push(`<span class="tag" data-v-000d5c18>${ssrInterpolate(interest)} <button class="tag-remove" data-v-000d5c18>×</button></span>`);
      });
      _push(`<!--]--></div><input${ssrRenderAttr("value", newInterest.value)} type="text"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.interests"))} data-v-000d5c18></div></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.commonNeeds"))}</label><div class="tag-input-wrap" data-v-000d5c18><div class="tags" data-v-000d5c18><!--[-->`);
      ssrRenderList(profile2.value.common_needs, (need, idx) => {
        _push(`<span class="tag" data-v-000d5c18>${ssrInterpolate(need)} <button class="tag-remove" data-v-000d5c18>×</button></span>`);
      });
      _push(`<!--]--></div><input${ssrRenderAttr("value", newNeed.value)} type="text"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.commonNeeds"))} data-v-000d5c18></div></div><div class="field" data-v-000d5c18><label data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.fields.dailyRoutine"))}</label><textarea rows="3"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.dailyRoutine"))} data-v-000d5c18>${ssrInterpolate(profile2.value.daily_routine)}</textarea></div></div></section><section class="profile-section" data-v-000d5c18><h2 class="section-title" data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.sections.notes"))}</h2><div class="field-group" data-v-000d5c18><div class="field" data-v-000d5c18><textarea rows="3"${ssrRenderAttr("placeholder", _ctx.$t("profile.placeholders.notes"))} data-v-000d5c18>${ssrInterpolate(profile2.value.notes)}</textarea></div></div></section><div class="save-area" data-v-000d5c18><button class="save-btn"${ssrIncludeBooleanAttr(isSaving.value) ? " disabled" : ""} data-v-000d5c18>`);
      if (isSaving.value) {
        _push(`<span class="spinner" data-v-000d5c18></span>`);
      } else {
        _push(`<span data-v-000d5c18>${ssrInterpolate(_ctx.$t("profile.save"))}</span>`);
      }
      _push(`</button></div></main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/profile.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const profile = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-000d5c18"]]);
export {
  profile as default
};
//# sourceMappingURL=profile-DeIQp1hb.js.map
