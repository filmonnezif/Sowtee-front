<template>
  <div class="profile-page">
    <!-- Header -->
    <header class="profile-header">
      <button class="back-btn" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>{{ $t('profile.title') }}</h1>
      <div class="header-spacer" />
    </header>

    <!-- Content -->
    <main class="profile-content">
      <!-- Identity Login -->
      <section class="profile-section">
        <h2 class="section-title">Identity</h2>
        <div class="field-group">
          <div class="field">
            <label>Login with your name</label>
            <div class="identity-row">
              <input
                v-model="loginName"
                type="text"
                placeholder="Type your name"
                @keydown.enter.prevent="loginWithName"
              />
              <button class="identity-btn" @click="loginWithName">Login</button>
            </div>
          </div>
          <p class="identity-meta">Current user: {{ activeUserLabel }}</p>
        </div>
      </section>

      <!-- Success toast -->
      <Transition name="toast">
        <div v-if="showSaveSuccess" class="save-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {{ $t('profile.saved') }}
        </div>
      </Transition>

      <!-- Personal Info -->
      <section class="profile-section">
        <h2 class="section-title">{{ $t('profile.sections.personal') }}</h2>
        <div class="field-group">
          <div class="field">
            <label>{{ $t('profile.fields.displayName') }}</label>
            <input v-model="profile.display_name" type="text" :placeholder="$t('profile.placeholders.displayName')" />
          </div>
          <div class="field field-half">
            <label>{{ $t('profile.fields.age') }}</label>
            <input v-model.number="profile.age" type="number" min="1" max="120" placeholder="—" />
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.location') }}</label>
            <input v-model="profile.location" type="text" :placeholder="$t('profile.placeholders.location')" />
          </div>
        </div>
      </section>

      <!-- Medical -->
      <section class="profile-section">
        <h2 class="section-title">{{ $t('profile.sections.medical') }}</h2>
        <div class="field-group">
          <div class="field">
            <label>{{ $t('profile.fields.condition') }}</label>
            <select v-model="profile.condition">
              <option value="">{{ $t('profile.placeholders.selectCondition') }}</option>
              <option value="ALS">ALS</option>
              <option value="MS">MS</option>
              <option value="Cerebral Palsy">Cerebral Palsy</option>
              <option value="Stroke">Stroke</option>
              <option value="Parkinson's">Parkinson's</option>
              <option value="TBI">Traumatic Brain Injury</option>
              <option value="Other">{{ $t('profile.other') }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.conditionStage') }}</label>
            <select v-model="profile.condition_stage">
              <option value="">—</option>
              <option value="Early">{{ $t('profile.stages.early') }}</option>
              <option value="Moderate">{{ $t('profile.stages.moderate') }}</option>
              <option value="Advanced">{{ $t('profile.stages.advanced') }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Communication Preferences -->
      <section class="profile-section">
        <h2 class="section-title">{{ $t('profile.sections.communication') }}</h2>
        <div class="field-group">
          <div class="field">
            <label>{{ $t('profile.fields.primaryLanguage') }}</label>
            <select v-model="profile.primary_language">
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="ur">اردو</option>
            </select>
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.secondaryLanguage') }}</label>
            <select v-model="profile.secondary_language">
              <option value="">{{ $t('profile.none') }}</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="ur">اردو</option>
            </select>
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.communicationStyle') }}</label>
            <div class="style-chips">
              <button
                v-for="style in ['brief', 'casual', 'formal', 'detailed']"
                :key="style"
                class="style-chip"
                :class="{ active: profile.communication_style === style }"
                @click="profile.communication_style = style"
              >
                {{ $t(`profile.styles.${style}`) }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Daily Life -->
      <section class="profile-section">
        <h2 class="section-title">{{ $t('profile.sections.dailyLife') }}</h2>
        <div class="field-group">
          <div class="field">
            <label>{{ $t('profile.fields.livingSituation') }}</label>
            <select v-model="profile.living_situation">
              <option value="">—</option>
              <option value="With family">{{ $t('profile.living.withFamily') }}</option>
              <option value="Care home">{{ $t('profile.living.careHome') }}</option>
              <option value="Independent with aide">{{ $t('profile.living.independentAide') }}</option>
              <option value="Independent">{{ $t('profile.living.independent') }}</option>
            </select>
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.caregiverName') }}</label>
            <input v-model="profile.caregiver_name" type="text" :placeholder="$t('profile.placeholders.caregiverName')" />
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.interests') }}</label>
            <div class="tag-input-wrap">
              <div class="tags">
                <span v-for="(interest, idx) in profile.interests" :key="idx" class="tag">
                  {{ interest }}
                  <button class="tag-remove" @click="removeInterest(idx)">&times;</button>
                </span>
              </div>
              <input
                v-model="newInterest"
                type="text"
                :placeholder="$t('profile.placeholders.interests')"
                @keydown.enter.prevent="addInterest"
              />
            </div>
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.commonNeeds') }}</label>
            <div class="tag-input-wrap">
              <div class="tags">
                <span v-for="(need, idx) in profile.common_needs" :key="idx" class="tag">
                  {{ need }}
                  <button class="tag-remove" @click="removeNeed(idx)">&times;</button>
                </span>
              </div>
              <input
                v-model="newNeed"
                type="text"
                :placeholder="$t('profile.placeholders.commonNeeds')"
                @keydown.enter.prevent="addNeed"
              />
            </div>
          </div>
          <div class="field">
            <label>{{ $t('profile.fields.dailyRoutine') }}</label>
            <textarea
              v-model="profile.daily_routine"
              rows="3"
              :placeholder="$t('profile.placeholders.dailyRoutine')"
            />
          </div>
        </div>
      </section>

      <!-- Notes -->
      <section class="profile-section">
        <h2 class="section-title">{{ $t('profile.sections.notes') }}</h2>
        <div class="field-group">
          <div class="field">
            <textarea
              v-model="profile.notes"
              rows="3"
              :placeholder="$t('profile.placeholders.notes')"
            />
          </div>
        </div>
      </section>

      <!-- Save Button -->
      <div class="save-area">
        <button class="save-btn" :disabled="isSaving" @click="saveProfile">
          <span v-if="isSaving" class="spinner" />
          <span v-else>{{ $t('profile.save') }}</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '~/stores/app'
import { useApi } from '~/composables/useApi'

const router = useRouter()
const store = useAppStore()
const { getProfile, saveProfileApi } = useApi()

// Profile data
const profile = ref({
  display_name: '',
  age: null as number | null,
  condition: '',
  condition_stage: '',
  primary_language: 'en',
  secondary_language: '',
  location: '',
  living_situation: '',
  interests: [] as string[],
  daily_routine: '',
  communication_style: 'casual',
  common_needs: [] as string[],
  caregiver_name: '',
  notes: '',
})

const newInterest = ref('')
const newNeed = ref('')
const isSaving = ref(false)
const showSaveSuccess = ref(false)
const loginName = ref(store.userName || '')

const activeUserLabel = computed(() => {
  return store.userName ? `${store.userName} (${store.userId})` : store.userId
})

function goBack() {
  router.push('/')
}

function addInterest() {
  const val = newInterest.value.trim()
  if (val && !profile.value.interests.includes(val)) {
    profile.value.interests.push(val)
    newInterest.value = ''
  }
}

function removeInterest(idx: number) {
  profile.value.interests.splice(idx, 1)
}

function addNeed() {
  const val = newNeed.value.trim()
  if (val && !profile.value.common_needs.includes(val)) {
    profile.value.common_needs.push(val)
    newNeed.value = ''
  }
}

function removeNeed(idx: number) {
  profile.value.common_needs.splice(idx, 1)
}

async function saveProfile() {
  isSaving.value = true
  try {
    if (!profile.value.display_name && store.userName) {
      profile.value.display_name = store.userName
    }
    await saveProfileApi(store.userId, profile.value)
    showSaveSuccess.value = true
    setTimeout(() => { showSaveSuccess.value = false }, 2500)
  } catch (e) {
    console.error('Failed to save profile:', e)
  } finally {
    isSaving.value = false
  }
}

async function loadProfile() {
  try {
    const data = await getProfile(store.userId)
    if (data) {
      profile.value = { ...profile.value, ...data }
    }
  } catch (e) {
    console.error('Failed to load profile:', e)
  }
}

async function loginWithName() {
  const name = loginName.value.trim()
  if (!name) return

  store.loginWithName(name)
  await loadProfile()

  if (!profile.value.display_name) {
    profile.value.display_name = store.userName
  }
}

onMounted(async () => {
  loginName.value = store.userName
  await loadProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--aac-bg, #000);
  color: var(--aac-text, #f5f5f7);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Header */
.profile-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--aac-surface, #121212);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.profile-header h1 {
  flex: 1;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--aac-accent, #eab308);
}

.header-spacer {
  width: 40px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  border: none;
  color: var(--aac-text, #f5f5f7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255,255,255,0.12);
}

/* Content */
.profile-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 16px 100px;
}

/* Sections */
.profile-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--aac-accent, #eab308);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255,255,255,0.6);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--aac-card, #18181b);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: var(--aac-text, #f5f5f7);
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.identity-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.identity-btn {
  padding: 0 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.14);
  background: var(--aac-card, #18181b);
  color: var(--aac-text, #f5f5f7);
  font-weight: 600;
  cursor: pointer;
}

.identity-btn:hover {
  border-color: var(--aac-accent, #eab308);
}

.identity-meta {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.55);
  margin: 0;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--aac-accent, #eab308);
}

.field select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  cursor: pointer;
}

.field select option {
  background: #1e1e1e;
  color: #f5f5f7;
  padding: 8px 12px;
}

.field select option:checked {
  background: #2a2a2a;
}

.field select option:hover {
  background: #333;
}

.field textarea {
  resize: vertical;
  min-height: 80px;
}

/* Style Chips */
.style-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.style-chip {
  padding: 8px 16px;
  border-radius: 20px;
  background: var(--aac-card, #18181b);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--aac-text, #f5f5f7);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.style-chip:hover {
  border-color: rgba(255,255,255,0.25);
}

.style-chip.active {
  background: var(--aac-accent, #eab308);
  color: #000;
  border-color: var(--aac-accent, #eab308);
  font-weight: 600;
}

/* Tag Input */
.tag-input-wrap {
  background: var(--aac-card, #18181b);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-input-wrap:focus-within {
  border-color: var(--aac-accent, #eab308);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: 14px;
  font-size: 0.82rem;
  color: var(--aac-accent, #eab308);
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  padding: 0 2px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-input-wrap input {
  background: transparent;
  border: none;
  color: var(--aac-text, #f5f5f7);
  font-size: 0.9rem;
  padding: 4px 0;
  font-family: inherit;
}

.tag-input-wrap input:focus {
  outline: none;
}

/* Save */
.save-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, var(--aac-bg, #000) 30%);
  display: flex;
  justify-content: center;
}

.save-btn {
  width: 100%;
  max-width: 600px;
  padding: 14px;
  border-radius: 12px;
  background: var(--aac-accent, #eab308);
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.save-btn:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Toast */
.save-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #16a34a;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
