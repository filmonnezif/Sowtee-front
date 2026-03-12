<script setup lang="ts">
/**
 * SOWTEE Main Application Layout
 * Provides base layout for all pages.
 * Eye gaze tracking is controlled by individual pages, not the layout.
 */

import { Settings, UserRound } from 'lucide-vue-next'

const appStore = useAppStore()

const userLabel = computed(() => appStore.userName || 'Guest')

function toggleSettings() {
  appStore.toggleSettings()
}
</script>

<template>
  <div class="min-h-screen bg-aac-bg text-aac-text">
    <header class="app-topbar">
      <NuxtLink to="/" class="app-topbar__brand" title="Sowtee Home">
        <img
          src="~/assets/css/logo/sowteeLogo.png"
          alt="SOWTEE"
          class="app-topbar__logo"
        >
      </NuxtLink>

      <div class="app-topbar__actions">
        <NuxtLink to="/profile" class="app-topbar__name" :title="$t('profile.title')">
          {{ userLabel }}
        </NuxtLink>

        <NuxtLink to="/profile" class="app-topbar__icon" :title="$t('profile.title')">
          <UserRound :size="18" />
        </NuxtLink>

        <button
          class="app-topbar__icon"
          :class="{ 'app-topbar__icon--active': appStore.settingsExpanded }"
          :title="$t('settings.title')"
          @click="toggleSettings"
        >
          <Settings :size="18" />
        </button>
      </div>
    </header>

    <Transition name="slide-settings">
      <SettingsSidebar v-if="appStore.settingsExpanded" />
    </Transition>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-topbar {
  @apply fixed top-0 left-0 right-0 z-50;
  @apply h-16 px-4 md:px-6;
  @apply bg-aac-bg/95 backdrop-blur-md border-b border-aac-surface;
  @apply flex items-center justify-between;
}

.app-topbar__brand {
  @apply inline-flex items-center;
}

.app-topbar__logo {
  @apply h-12 w-auto;
}

.app-topbar__actions {
  @apply flex items-center gap-2;
}

.app-topbar__name {
  @apply h-9 px-3 rounded-lg;
  @apply border border-aac-surface bg-aac-card;
  @apply text-sm font-semibold text-aac-text;
  @apply inline-flex items-center;
  text-decoration: none;
}

.app-topbar__icon {
  @apply w-9 h-9 rounded-lg;
  @apply border border-aac-surface bg-aac-card text-aac-muted;
  @apply inline-flex items-center justify-center;
  @apply transition-all duration-200;
  @apply hover:bg-aac-surface hover:text-aac-highlight;
  text-decoration: none;
}

.app-topbar__icon--active {
  @apply text-white border-aac-highlight;
  background-color: rgb(var(--aac-highlight) / 0.8);
}

.app-main {
  @apply pt-16;
}

.slide-settings-enter-active,
.slide-settings-leave-active {
  @apply transition-all duration-300;
}

.slide-settings-enter-from,
.slide-settings-leave-to {
  @apply opacity-0 translate-x-full;
}
</style>
