import { c as useRuntimeConfig } from "../server.mjs";
function useApi() {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
  async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }
  async function checkHealth() {
    return request("/health");
  }
  async function predictPhrases(userId, imageBase64, interactionMode = "touch", mode = "full", sessionId, additionalContext) {
    const payload = {
      user_id: userId,
      image_base64: imageBase64,
      interaction_mode: interactionMode,
      mode,
      session_id: sessionId,
      additional_context: additionalContext
    };
    return request("/api/v1/predict", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
  async function submitFeedback(feedback) {
    await request("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(feedback)
    });
  }
  async function getUserPhrases(userId, limit = 20) {
    return request(
      `/api/v1/users/${userId}/phrases?limit=${limit}`
    );
  }
  async function clearSession(sessionId) {
    await request(`/api/v1/session/${sessionId}`, {
      method: "DELETE"
    });
  }
  async function getWordSuggestions(userId, currentSentence, imageBase64, sceneContext, interactionMode = "touch", conversationContext) {
    const payload = {
      user_id: userId,
      image_base64: imageBase64,
      current_sentence: currentSentence,
      scene_context: sceneContext,
      conversation_context: conversationContext,
      interaction_mode: interactionMode
    };
    return request("/api/v1/suggest-words", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
  async function getAvailableSkills() {
    return request("/api/v1/skills");
  }
  async function speakingAction(params) {
    return request("/api/v1/skills/speaking/action", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async function expandAbbreviation(params) {
    return request("/api/v1/skills/speaking/expand", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async function getModelStatus() {
    return request("/api/v1/models/status");
  }
  async function getRecentErrors(limit = 20) {
    return request(`/api/v1/errors/recent?limit=${limit}`);
  }
  async function predictText(params) {
    return request("/api/v1/predict-text", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async function acceptSuggestion(userId, acceptedText, sceneDescription, conversationContext) {
    await request("/api/v1/accept-suggestion", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        accepted_text: acceptedText,
        scene_description: sceneDescription,
        conversation_context: conversationContext
      })
    });
  }
  async function formatText(text) {
    return request("/api/v1/format-text", {
      method: "POST",
      body: JSON.stringify({ text })
    });
  }
  async function cloneVoice(file) {
    const url = `${baseUrl}/api/v1/voice/clone`;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(url, {
      method: "POST",
      body: formData
      // Don't set Content-Type — browser sets it with boundary for multipart
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voice clone failed: ${response.status} - ${error}`);
    }
    return response.json();
  }
  async function getVoiceCloneStatus() {
    return request("/api/v1/voice/clone");
  }
  async function removeClonedVoice() {
    return request("/api/v1/voice/clone", {
      method: "DELETE"
    });
  }
  async function getProfile(userId) {
    return request(`/api/v1/profile/${userId}`);
  }
  async function saveProfileApi(userId, profile) {
    return request(`/api/v1/profile/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });
  }
  async function getLearningMetrics(userId) {
    return request(`/api/v1/learning/${userId}/metrics?simulate=true`);
  }
  async function getLearningTimeline(userId) {
    return request(`/api/v1/learning/${userId}/timeline?simulate=true`);
  }
  async function getStrategyStats(userId) {
    return request(`/api/v1/learning/${userId}/strategies?simulate=true`);
  }
  async function getLearningEvents(userId, limit = 50) {
    return request(`/api/v1/learning/${userId}/events?limit=${limit}&simulate=true`);
  }
  async function getLearningImprovementSummary(userId) {
    return request(`/api/v1/learning/${userId}/summary?simulate=true`);
  }
  return {
    checkHealth,
    predictPhrases,
    submitFeedback,
    getUserPhrases,
    clearSession,
    getWordSuggestions,
    // Skills API
    getAvailableSkills,
    speakingAction,
    expandAbbreviation,
    getModelStatus,
    getRecentErrors,
    // Predictive Text
    predictText,
    acceptSuggestion,
    formatText,
    // Voice Cloning
    cloneVoice,
    getVoiceCloneStatus,
    removeClonedVoice,
    // User Profile
    getProfile,
    saveProfileApi,
    // Learning Dashboard
    getLearningMetrics,
    getLearningTimeline,
    getStrategyStats,
    getLearningEvents,
    getLearningImprovementSummary
  };
}
export {
  useApi as u
};
//# sourceMappingURL=useApi-DXXljJZv.js.map
