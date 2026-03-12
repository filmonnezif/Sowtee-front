<script setup lang="ts">
/**
 * SOWTEE Application Entry
 */
const appStore = useAppStore()

onMounted(() => {
  appStore.initializeUserIdentity()
})

// Helper to convert hex to space-separated rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0'
}

// Apply theme settings
watch(() => appStore.themeSettings, (settings) => {
  if (import.meta.client) {
    const root = document.documentElement
    root.style.setProperty('--aac-bg', hexToRgb(settings.background))
    root.style.setProperty('--aac-surface', hexToRgb(settings.surface))
    root.style.setProperty('--aac-card', hexToRgb(settings.card))
    root.style.setProperty('--aac-highlight', hexToRgb(settings.accent))
    root.style.setProperty('--aac-text', hexToRgb(settings.text))
  }
}, { deep: true, immediate: true })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
