<script setup lang="ts">
/**
 * SOWTEE Learning Dashboard
 * Visualizes the agent's self-improvement over time.
 * Shows metrics, strategy performance, vocabulary growth, and learning events.
 */

const api = useApi()
const appStore = useAppStore()

const userId = computed(() => appStore.userId || 'default-user')

// Reactive data
const metrics = ref<any>(null)
const timeline = ref<any[]>([])
const strategies = ref<any>({})
const events = ref<any[]>([])
const summary = ref<any>(null)
const isLoading = ref(true)
const lastRefresh = ref<Date>(new Date())
const userLabel = computed(() => appStore.userName || appStore.userId)

// Auto-refresh interval
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadAllData()
  // Auto-refresh every 10 seconds
  refreshInterval = setInterval(() => loadAllData(), 10000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

async function loadAllData() {
  try {
    const [metricsData, timelineData, strategyData, eventsData, summaryData] = await Promise.all([
      api.getLearningMetrics(userId.value),
      api.getLearningTimeline(userId.value),
      api.getStrategyStats(userId.value),
      api.getLearningEvents(userId.value, 30),
      api.getLearningImprovementSummary(userId.value),
    ])
    metrics.value = metricsData
    timeline.value = timelineData
    strategies.value = strategyData
    events.value = eventsData
    summary.value = summaryData
    lastRefresh.value = new Date()
  } catch (error) {
    console.error('Failed to load learning data:', error)
  } finally {
    isLoading.value = false
  }
}

// Computed
const accuracyPercent = computed(() => {
  if (!metrics.value) return 0
  return Math.round((metrics.value.prediction_accuracy || 0) * 100)
})

const acceptancePercent = computed(() => {
  if (!metrics.value) return 0
  return Math.round((metrics.value.suggestion_acceptance_rate || 0) * 100)
})

const sortedStrategies = computed(() => {
  if (!strategies.value) return []
  return Object.entries(strategies.value)
    .map(([id, stats]: [string, any]) => ({
      id,
      name: formatStrategyName(id),
      icon: strategyIcon(id),
      ...stats,
      success_rate_percent: Math.round((stats.success_rate || 0) * 100),
    }))
    .sort((a, b) => b.success_rate_percent - a.success_rate_percent)
})

const recentEvents = computed(() => {
  if (!events.value) return []
  return [...events.value].reverse().slice(0, 20)
})

const timelinePoints = computed(() => {
  if (!timeline.value || timeline.value.length === 0) return []
  return timeline.value.map((point: any, i: number) => ({
    ...point,
    accuracyPercent: Math.round((point.accuracy || 0) * 100),
    label: `#${point.interactions || i + 1}`,
  }))
})

const heroMessage = computed(() => {
  const message = summary.value?.message
  if (!message || typeof message !== 'string') {
    return 'Every interaction makes your agent smarter.'
  }
  if (/simulat(ed|ion)/i.test(message)) {
    return 'Every interaction makes your agent smarter.'
  }
  return message
})

// Best accuracy from timeline
const peakAccuracy = computed(() => {
  if (!timelinePoints.value.length) return 0
  return Math.max(...timelinePoints.value.map((t: any) => t.accuracyPercent))
})

function formatStrategyName(id: string): string {
  const names: Record<string, string> = {
    memory_first: 'Memory First',
    llm_reasoning: 'LLM Reasoning',
    hybrid_weighted: 'Hybrid Weighted',
    frequency_boost: 'Frequency Boost',
    context_heavy: 'Context Heavy',
    default: 'Default',
  }
  return names[id] || id
}

function strategyIcon(id: string): string {
  const icons: Record<string, string> = {
    memory_first: '🧠',
    llm_reasoning: '🤖',
    hybrid_weighted: '⚖️',
    frequency_boost: '📊',
    context_heavy: '👁️',
    default: '⚙️',
  }
  return icons[id] || '🔧'
}

function eventIcon(type: string): string {
  const icons: Record<string, string> = {
    prediction_recorded: '📝',
    vocabulary_growth: '📚',
    snapshot_taken: '📸',
    strategy_change: '🎯',
    conversation_signal: '🗣️',
    video_signal: '🎥',
    maps_signal: '🗺️',
  }
  return icons[type] || '💡'
}

function eventLabel(type: string): string {
  const labels: Record<string, string> = {
    prediction_recorded: 'Prediction',
    vocabulary_growth: 'New Phrase',
    snapshot_taken: 'Checkpoint',
    strategy_change: 'Strategy',
    conversation_signal: 'Conversation Context',
    video_signal: 'Scene Context',
    maps_signal: 'Location Context',
  }
  return labels[type] || type
}

function timeAgo(ts: string): string {
  const now = Date.now()
  const then = new Date(ts).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
</script>

<template>
  <div class="learning-dashboard">
    <!-- Back Button -->
    <NuxtLink to="/" class="back-btn" title="Back to Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m12 19-7-7 7-7"/>
        <path d="M19 12H5"/>
      </svg>
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="pulse-brain">🧠</div>
      <p>Loading learning data...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">

      <!-- Hero Section -->
      <header class="hero">
        <div class="hero__icon">
          <div class="brain-pulse">🧠</div>
        </div>
        <h1 class="hero__title">Your Agent is Learning</h1>
        <p class="hero__subtitle">
          {{ heroMessage }}
        </p>
        <p class="hero__subtitle">User: {{ userLabel }}</p>
        <div class="hero__live">
          <span class="live-dot" />
          <span>Auto-refreshing</span>
        </div>
      </header>

      <!-- Stats Grid -->
      <section class="stats-grid">
        <div class="stat-card stat-card--accent">
          <div class="stat-card__value">{{ accuracyPercent }}%</div>
          <div class="stat-card__label">Prediction Accuracy</div>
          <div class="stat-card__bar">
            <div class="stat-card__fill" :style="{ width: `${accuracyPercent}%` }" />
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__value">{{ metrics?.vocabulary_size || 0 }}</div>
          <div class="stat-card__label">Phrases Learned</div>
          <div class="stat-card__icon">📚</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__value">{{ metrics?.total_interactions || 0 }}</div>
          <div class="stat-card__label">Total Interactions</div>
          <div class="stat-card__icon">💬</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__value">{{ acceptancePercent }}%</div>
          <div class="stat-card__label">Acceptance Rate</div>
          <div class="stat-card__bar">
            <div class="stat-card__fill stat-card__fill--secondary" :style="{ width: `${acceptancePercent}%` }" />
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__value">{{ metrics?.strategies_tried || 0 }}</div>
          <div class="stat-card__label">Strategies Tried</div>
          <div class="stat-card__icon">🎯</div>
        </div>

        <div class="stat-card">
          <div class="stat-card__value">{{ Math.round(metrics?.avg_response_time_ms || 0) }}ms</div>
          <div class="stat-card__label">Avg Response Time</div>
          <div class="stat-card__icon">⚡</div>
        </div>
      </section>

      <!-- Improvement Timeline (ASCII-style chart) -->
      <section v-if="timelinePoints.length > 0" class="section">
        <h2 class="section__title">📈 Accuracy Over Time</h2>
        <div class="timeline-chart">
          <div class="timeline-chart__y-axis">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          <div class="timeline-chart__bars">
            <div
              v-for="(point, i) in timelinePoints"
              :key="i"
              class="timeline-bar"
              :title="`${point.accuracyPercent}% accuracy at ${point.interactions} interactions`"
            >
              <div
                class="timeline-bar__fill"
                :style="{ height: `${point.accuracyPercent}%` }"
                :class="{ 'timeline-bar__fill--peak': point.accuracyPercent === peakAccuracy && peakAccuracy > 0 }"
              />
              <span class="timeline-bar__label">{{ point.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Strategy Performance -->
      <section v-if="sortedStrategies.length > 0" class="section">
        <h2 class="section__title">🎯 Strategy Performance</h2>
        <div class="strategy-list">
          <div
            v-for="strategy in sortedStrategies"
            :key="strategy.id"
            class="strategy-card"
          >
            <div class="strategy-card__header">
              <span class="strategy-card__icon">{{ strategy.icon }}</span>
              <span class="strategy-card__name">{{ strategy.name }}</span>
              <span class="strategy-card__rate">{{ strategy.success_rate_percent }}%</span>
            </div>
            <div class="strategy-card__bar">
              <div
                class="strategy-card__fill"
                :style="{ width: `${strategy.success_rate_percent}%` }"
              />
            </div>
            <div class="strategy-card__meta">
              {{ strategy.attempts }} attempts · {{ strategy.successes }} successes
            </div>
          </div>
        </div>
      </section>

      <!-- Learning Events Feed -->
      <section class="section">
        <h2 class="section__title">📋 Learning Events</h2>
        <div v-if="recentEvents.length === 0" class="empty-state">
          <p>No learning events yet. Start using the app to see the agent learn!</p>
        </div>
        <div v-else class="events-feed">
          <div
            v-for="(event, i) in recentEvents"
            :key="i"
            class="event-item"
          >
            <span class="event-item__icon">{{ eventIcon(event.type) }}</span>
            <div class="event-item__content">
              <span class="event-item__type">{{ eventLabel(event.type) }}</span>
              <span v-if="event.new_phrase" class="event-item__detail">"{{ event.new_phrase }}"</span>
              <span v-else-if="event.match !== undefined" class="event-item__detail">
                {{ event.match ? '✅ Correct' : '❌ Missed' }}
                <span v-if="event.strategy"> · {{ formatStrategyName(event.strategy) }}</span>
              </span>
              <span v-else-if="event.accuracy !== undefined" class="event-item__detail">
                Accuracy: {{ Math.round(event.accuracy * 100) }}%
              </span>
              <span v-else-if="event.detail" class="event-item__detail">
                {{ event.detail }}
              </span>
            </div>
            <span class="event-item__time">{{ timeAgo(event.ts) }}</span>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.learning-dashboard {
  @apply min-h-screen bg-aac-bg text-aac-text;
  @apply pb-12;
}

/* Back Button */
.back-btn {
  @apply fixed top-6 left-6 z-50;
  @apply w-12 h-12 rounded-xl;
  @apply bg-aac-card text-aac-muted;
  @apply flex items-center justify-center;
  @apply transition-all duration-200;
  @apply hover:bg-aac-surface hover:text-aac-highlight;
  @apply border border-aac-surface;
  text-decoration: none;
}

/* Loading */
.loading-state {
  @apply flex flex-col items-center justify-center min-h-screen gap-4;
  @apply text-aac-muted text-lg;
}

.pulse-brain {
  font-size: 4rem;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* Dashboard Content */
.dashboard-content {
  @apply max-w-5xl mx-auto px-6 pt-8;
}

/* Hero Section */
.hero {
  @apply text-center py-12 mb-8;
  @apply relative;
}

.hero__icon {
  @apply mb-4;
}

.brain-pulse {
  font-size: 4rem;
  display: inline-block;
  animation: pulse-glow 3s ease-in-out infinite;
}

.hero__title {
  @apply text-4xl font-bold mb-3;
  background: linear-gradient(
    135deg,
    rgb(var(--aac-highlight)),
    rgb(var(--aac-highlight) / 0.6)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  @apply text-lg text-aac-muted max-w-2xl mx-auto leading-relaxed;
}

.hero__live {
  @apply flex items-center justify-center gap-2 mt-4;
  @apply text-sm text-aac-muted;
}

.live-dot {
  @apply w-2 h-2 rounded-full bg-green-500;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Stats Grid */
.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-3 gap-4 mb-10;
}

.stat-card {
  @apply bg-aac-card rounded-2xl p-5;
  @apply border border-aac-surface;
  @apply relative overflow-hidden;
  @apply transition-all duration-200;
}

.stat-card:hover {
  @apply border-aac-highlight;
  transform: translateY(-2px);
}

.stat-card--accent {
  border-color: rgb(var(--aac-highlight) / 0.5);
  background: linear-gradient(
    135deg,
    rgb(var(--aac-highlight) / 0.1),
    rgb(var(--aac-card))
  );
}

.stat-card__value {
  @apply text-3xl font-bold text-aac-text mb-1;
}

.stat-card--accent .stat-card__value {
  color: rgb(var(--aac-highlight));
}

.stat-card__label {
  @apply text-sm text-aac-muted;
}

.stat-card__icon {
  @apply absolute top-4 right-4 text-2xl opacity-30;
}

.stat-card__bar {
  @apply mt-3 h-1.5 rounded-full;
  background: rgb(var(--aac-surface));
}

.stat-card__fill {
  @apply h-full rounded-full;
  background: rgb(var(--aac-highlight));
  transition: width 0.6s ease;
}

.stat-card__fill--secondary {
  background: rgb(var(--aac-highlight) / 0.6);
}

/* Section */
.section {
  @apply mb-10;
}

.section__title {
  @apply text-xl font-bold mb-4 text-aac-text;
}

/* Timeline Chart */
.timeline-chart {
  @apply bg-aac-card rounded-2xl p-6 border border-aac-surface;
  @apply flex gap-4;
  min-height: 200px;
}

.timeline-chart__y-axis {
  @apply flex flex-col justify-between text-xs text-aac-muted;
  @apply w-10 flex-shrink-0;
}

.timeline-chart__bars {
  @apply flex items-end gap-1 flex-1;
  height: 180px;
}

.timeline-bar {
  @apply flex flex-col items-center flex-1;
  @apply min-w-0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.timeline-bar__fill {
  @apply w-full rounded-t;
  background: rgb(var(--aac-highlight) / 0.6);
  min-height: 2px;
  transition: height 0.6s ease;
}

.timeline-bar__fill--peak {
  background: rgb(var(--aac-highlight));
  box-shadow: 0 0 10px rgb(var(--aac-highlight) / 0.5);
}

.timeline-bar__label {
  @apply text-xs text-aac-muted mt-1;
  @apply truncate w-full text-center;
  font-size: 0.6rem;
}

/* Strategy Performance */
.strategy-list {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.strategy-card {
  @apply bg-aac-card rounded-xl p-4;
  @apply border border-aac-surface;
  @apply transition-all duration-200;
}

.strategy-card:hover {
  @apply border-aac-highlight;
}

.strategy-card__header {
  @apply flex items-center gap-2 mb-2;
}

.strategy-card__icon {
  font-size: 1.2rem;
}

.strategy-card__name {
  @apply font-semibold text-aac-text flex-1;
}

.strategy-card__rate {
  @apply text-lg font-bold;
  color: rgb(var(--aac-highlight));
}

.strategy-card__bar {
  @apply h-2 rounded-full mb-2;
  background: rgb(var(--aac-surface));
}

.strategy-card__fill {
  @apply h-full rounded-full;
  background: rgb(var(--aac-highlight));
  transition: width 0.6s ease;
}

.strategy-card__meta {
  @apply text-xs text-aac-muted;
}

/* Events Feed */
.events-feed {
  @apply bg-aac-card rounded-2xl border border-aac-surface;
  @apply divide-y divide-aac-surface;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  @apply bg-aac-card rounded-2xl p-8 text-center;
  @apply border border-aac-surface;
  @apply text-aac-muted;
}

.event-item {
  @apply flex items-center gap-3 px-4 py-3;
  @apply transition-all duration-150;
}

.event-item:hover {
  background: rgb(var(--aac-surface) / 0.5);
}

.event-item__icon {
  @apply text-lg flex-shrink-0;
}

.event-item__content {
  @apply flex-1 min-w-0;
}

.event-item__type {
  @apply font-medium text-sm text-aac-text;
}

.event-item__detail {
  @apply text-xs text-aac-muted ml-2;
}

.event-item__time {
  @apply text-xs text-aac-muted flex-shrink-0;
}

/* Scrollbar */
.events-feed::-webkit-scrollbar {
  width: 4px;
}
.events-feed::-webkit-scrollbar-track {
  background: transparent;
}
.events-feed::-webkit-scrollbar-thumb {
  background: rgb(var(--aac-surface));
  border-radius: 2px;
}
</style>
