<script setup lang="ts">
/**
 * SOWTEE Home Page
 * Interactive modern landing with 3D cards, scroll animations, and hero logo.
 */
import { Eye, Mic, Globe, ArrowRight, Sparkles, Brain, Zap } from 'lucide-vue-next'
import gsap from 'gsap'

const appStore = useAppStore()
const camera = useCamera()
const tts = useTTS()
const eyeGaze = useEyeGaze()
const gazeController = useGazeController()
const minimalNav = useMinimalNavigation()

const speakingCardRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const loginName = ref('')

// Refs for GSAP animations
const heroLogoRef = ref<HTMLElement | null>(null)
const heroTitleRef = ref<HTMLElement | null>(null)
const heroDescRef = ref<HTMLElement | null>(null)
const featureGridRef = ref<HTMLElement | null>(null)
const featureCardsRef = ref<HTMLElement[]>([])
const ctaSectionRef = ref<HTMLElement | null>(null)
const particlesRef = ref<HTMLElement | null>(null)

// Mouse position for parallax
const mouseX = ref(0)
const mouseY = ref(0)

watch(videoRef, (el) => camera.setVideoRef(el))
watch(canvasRef, (el) => camera.setCanvasRef(el))

watch(
  () => appStore.webgazerCameraId,
  async (newCameraId) => {
    if (
      appStore.interactionMode === 'eye_gaze' &&
      camera.state.isActive &&
      newCameraId !== camera.state.selectedDeviceId
    ) {
      await camera.selectCamera(newCameraId || '')
    }
  }
)

function handleMouseMove(e: MouseEvent) {
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 2
}

function initGsapAnimations() {
  // Hero entrance timeline
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  if (heroLogoRef.value) {
    heroTl.fromTo(heroLogoRef.value,
      { y: -60, opacity: 0, scale: 0.8, rotateY: -30 },
      { y: 0, opacity: 1, scale: 1, rotateY: 0, duration: 1.2 }
    )
  }
  if (heroTitleRef.value) {
    heroTl.fromTo(heroTitleRef.value,
      { y: 40, opacity: 0, clipPath: 'inset(100% 0 0 0)' },
      { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: 1 },
      '-=0.6'
    )
  }
  if (heroDescRef.value) {
    heroTl.fromTo(heroDescRef.value,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      '-=0.5'
    )
  }

  // Feature cards stagger entrance
  if (featureCardsRef.value.length > 0) {
    featureCardsRef.value.forEach((card, i) => {
      gsap.fromTo(card,
        {
          y: 40,
          opacity: 0,
          rotateX: 10,
          rotateY: i === 0 ? -8 : i === 2 ? 8 : 0,
          scale: 0.92,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.8,
          delay: 1.2 + i * 0.15,
          ease: 'back.out(1.5)',
        }
      )
    })
  }

  // CTA entrance
  if (ctaSectionRef.value) {
    gsap.fromTo(ctaSectionRef.value,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 1.6, ease: 'power3.out' }
    )
  }

  // Floating particles continuous animation
  if (particlesRef.value) {
    const particles = particlesRef.value.querySelectorAll('.particle')
    particles.forEach((p, i) => {
      gsap.to(p, {
        y: `random(-40, 40)`,
        x: `random(-30, 30)`,
        opacity: `random(0.2, 0.7)`,
        duration: `random(3, 6)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.3,
      })
    })
  }
}

// 3D tilt effect for feature cards
function handleCardMouseMove(e: MouseEvent, cardEl: HTMLElement) {
  const rect = cardEl.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / centerY) * -8
  const rotateY = ((x - centerX) / centerX) * 8

  gsap.to(cardEl, {
    rotateX,
    rotateY,
    transformPerspective: 800,
    duration: 0.4,
    ease: 'power2.out',
  })
}

function handleCardMouseLeave(cardEl: HTMLElement) {
  gsap.to(cardEl, {
    rotateX: 0,
    rotateY: 0,
    duration: 0.6,
    ease: 'elastic.out(1, 0.5)',
  })
}

function setFeatureCardRef(el: any, index: number) {
  if (el) featureCardsRef.value[index] = el as HTMLElement
}

onMounted(async () => {
  loginName.value = appStore.userName
  tts.initialize()

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', updateTargetBounds)
  window.addEventListener('click', handleCalibrationClick)
  window.addEventListener('mousemove', handleMouseMove)

  await nextTick()
  setupMinimalNavigation()
  initGsapAnimations()

  gazeController.onSelect((targetId) => {
    if (targetId === 'try-demo') {
      openSpeaking()
    } else if (targetId === 'done-calibration') {
      completeCalibration()
    }
  })

  if (appStore.interactionMode === 'eye_gaze') {
    await enableEyeGazeExperience()
  }
})

watch(speakingCardRef, () => {
  if (minimalNav.navigableItems.value.length === 0) {
    nextTick(() => setupMinimalNavigation())
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', updateTargetBounds)
  window.removeEventListener('click', handleCalibrationClick)
  window.removeEventListener('mousemove', handleMouseMove)
  gazeController.stop()
  gazeController.clearTargets()
  minimalNav.clearFocus()
  camera.stopCamera()
})

function setupMinimalNavigation() {
  if (speakingCardRef.value) {
    minimalNav.registerItem({
      id: 'try-demo',
      element: speakingCardRef.value,
      action: openSpeaking,
      priority: 10,
    })
  }
}

function setSpeakingCardRef(el: any) {
  speakingCardRef.value = el as HTMLElement
  if (el && appStore.interactionMode === 'eye_gaze') {
    registerGazeTargets()
  }
}

function registerGazeTargets() {
  if (speakingCardRef.value) {
    gazeController.registerTarget('try-demo', speakingCardRef.value, 100, {
      hitBounds: {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      },
    })
  }
}

function updateTargetBounds() {
  if (speakingCardRef.value && appStore.interactionMode === 'eye_gaze') {
    registerGazeTargets()
  }
}

async function enableEyeGazeExperience() {
  await eyeGaze.initialize()

  if (!camera.state.isActive) {
    const webgazerCameraId = appStore.getCameraForPurpose('webgazer')
    await camera.startCamera('environment', webgazerCameraId || undefined)
  }

  if (!appStore.eyeGazeCalibrated && !eyeGaze.state.useMouseFallback) {
    await startCalibration()
  } else {
    await eyeGaze.startTracking()
    gazeController.start()
    await nextTick()
    registerGazeTargets()
  }
}

function disableEyeGazeExperience() {
  eyeGaze.stopTracking()
  eyeGaze.stopImplicitCalibration()
  gazeController.stop()
  camera.stopCamera()
}

watch(
  () => appStore.interactionMode,
  async (mode) => {
    if (mode === 'eye_gaze') {
      await enableEyeGazeExperience()
    } else {
      disableEyeGazeExperience()
    }
  }
)

async function startCalibration() {
  appStore.eyeGazeCalibrated = false
  gazeController.stop()

  await eyeGaze.startTracking()
  eyeGaze.startImplicitCalibration()
}

function handleCalibrationClick(e: MouseEvent) {
  if (eyeGaze.state.isImplicitCalibration) {
    eyeGaze.recordCalibrationClick(e.clientX, e.clientY)
  }
}

function completeCalibration() {
  eyeGaze.stopImplicitCalibration()
  appStore.eyeGazeCalibrated = true
  gazeController.start()
  nextTick(() => registerGazeTargets())
}

function openSpeaking() {
  navigateTo('/speaking')
}

function handleKeyDown(e: KeyboardEvent) {
  if (appStore.settingsExpanded) return
  if (document.activeElement?.tagName === 'INPUT') return

  if (e.code.startsWith('Arrow') || e.key === 'Tab' || e.key === 'Shift') {
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    openSpeaking()
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    minimalNav.clearFocus()
  }
}

function loginWithName() {
  const name = loginName.value.trim()
  if (!name) return
  appStore.loginWithName(name)
}
</script>

<template>
  <div class="home" @mousemove="handleMouseMove">
    <video ref="videoRef" class="hidden" autoplay playsinline muted />
    <canvas ref="canvasRef" class="hidden" />

    <!-- Floating ambient particles -->
    <div ref="particlesRef" class="particles-container" aria-hidden="true">
      <div v-for="i in 20" :key="i" class="particle" :class="`particle--${i % 4}`" />
    </div>

    <!-- Gradient orbs background -->
    <div class="gradient-orbs" aria-hidden="true">
      <div
        class="orb orb--1"
        :style="{
          transform: `translate(${mouseX * 15}px, ${mouseY * 15}px)`,
        }"
      />
      <div
        class="orb orb--2"
        :style="{
          transform: `translate(${mouseX * -10}px, ${mouseY * -10}px)`,
        }"
      />
      <div
        class="orb orb--3"
        :style="{
          transform: `translate(${mouseX * 8}px, ${mouseY * 8}px)`,
        }"
      />
    </div>

    <!-- Eye-gaze calibration overlay -->
    <div v-if="eyeGaze.state.isImplicitCalibration" class="fixed bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-4 pointer-events-none">
      <div class="bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md text-lg font-medium border border-white/10 shadow-xl pointer-events-auto">
        Keep looking at what you want to select.
      </div>
      <button
        class="bg-aac-highlight hover:bg-aac-highlight/80 text-white px-8 py-3 rounded-full text-xl font-bold shadow-lg transition-transform active:scale-95 pointer-events-auto"
        @click="completeCalibration"
      >
        Done
      </button>
    </div>

    <GazeCursor
      :position="gazeController.state.snappedPosition || eyeGaze.state.gazePosition"
      :dwell-progress="gazeController.state.dwellProgress"
      :is-on-target="gazeController.state.currentTargetId !== null"
      :is-selecting="gazeController.state.isSelecting"
      :is-locked="gazeController.state.isLocked"
      :target-bounds="gazeController.state.currentTargetBounds"
      :visible="appStore.interactionMode === 'eye_gaze' && (gazeController.state.isActive || eyeGaze.state.isImplicitCalibration)"
    />

    <main class="home__content">
      <!-- ===== HERO SECTION ===== -->
      <section class="hero">
        <!-- Centered hero logo -->
        <div ref="heroLogoRef" class="hero__logo-wrapper">
          <img
            src="~/assets/css/logo/sowteeLogo.png"
            alt="Sowtee"
            class="hero__logo"
          >
          <div class="hero__logo-glow" />
        </div>

        <h1 ref="heroTitleRef" class="hero__title">
          Communicate
          <span class="hero__title-accent">effortlessly</span>
        </h1>

        <p ref="heroDescRef" class="hero__tagline">
          The AAC voice that learns you.
        </p>

        <!-- ===== CTA INLINE ===== -->
        <div ref="ctaSectionRef" class="demo-cta">
          <div class="identity-login" v-if="!appStore.userName">
            <input
              v-model="loginName"
              type="text"
              placeholder="Enter your name"
              @keydown.enter.prevent="loginWithName"
            >
            <button @click="loginWithName" class="identity-login__btn">
              Continue
            </button>
          </div>

          <div class="identity-active" v-else>
            <span class="identity-active__dot" />
            Signed in as <strong>{{ appStore.userName }}</strong>
          </div>

          <button
            :ref="setSpeakingCardRef"
            class="try-demo-btn navigable-item"
            :class="{
              'try-demo-btn--gaze-target': appStore.interactionMode === 'eye_gaze',
              'try-demo-btn--gaze-active': gazeController.state.currentTargetId === 'try-demo'
            }"
            @click="openSpeaking"
          >
            <span class="try-demo-btn__content">
              <span class="try-demo-btn__label">Try Demo</span>
              <span class="try-demo-btn__sub">Open AAC speaking page</span>
            </span>
            <ArrowRight :size="24" class="try-demo-btn__arrow" />

            <div class="try-demo-btn__shimmer" />

            <div
              v-if="gazeController.state.currentTargetId === 'try-demo'"
              class="try-demo-btn__progress"
            >
              <div
                class="try-demo-btn__progress-fill"
                :style="{ width: `${gazeController.state.dwellProgress * 100}%` }"
              />
            </div>
          </button>

          <div class="scroll-indicator">
            <span class="scroll-indicator__text">Scroll down to see features</span>
            <div class="scroll-indicator__chevron" aria-hidden="true">⌄</div>
          </div>

        </div>
      </section>

      <!-- ===== FEATURE CARDS (3D) ===== -->
      <section ref="featureGridRef" class="feature-grid" aria-label="Main features">
        <article
          :ref="(el) => setFeatureCardRef(el, 0)"
          class="feature-card"
          @mousemove="(e) => featureCardsRef[0] && handleCardMouseMove(e, featureCardsRef[0])"
          @mouseleave="featureCardsRef[0] && handleCardMouseLeave(featureCardsRef[0])"
        >
          <div class="feature-card__icon-wrap feature-card__icon-wrap--blue">
            <Eye :size="28" />
          </div>
          <h2>Low-effort input</h2>
          <p>Eye gaze, joystick, arrow keys, plus natural keyboard and mouse input.</p>
          <div class="feature-card__shine" />
        </article>

        <article
          :ref="(el) => setFeatureCardRef(el, 1)"
          class="feature-card feature-card--elevated"
          @mousemove="(e) => featureCardsRef[1] && handleCardMouseMove(e, featureCardsRef[1])"
          @mouseleave="featureCardsRef[1] && handleCardMouseLeave(featureCardsRef[1])"
        >
          <div class="feature-card__icon-wrap feature-card__icon-wrap--purple">
            <Mic :size="28" />
          </div>
          <h2>Voice clone support</h2>
          <p>Speak with a personalized voice that sounds closer to you.</p>
          <div class="feature-card__shine" />
        </article>

        <article
          :ref="(el) => setFeatureCardRef(el, 2)"
          class="feature-card"
          @mousemove="(e) => featureCardsRef[2] && handleCardMouseMove(e, featureCardsRef[2])"
          @mouseleave="featureCardsRef[2] && handleCardMouseLeave(featureCardsRef[2])"
        >
          <div class="feature-card__icon-wrap feature-card__icon-wrap--teal">
            <Globe :size="28" />
          </div>
          <h2>3-language support</h2>
          <p>Use English, Arabic, and Urdu in one adaptive communication experience.</p>
          <div class="feature-card__shine" />
        </article>
      </section>

      <!-- ===== STATS ROW ===== -->
      <section class="stats-section">
        <div class="stat-item">
          <div class="stat-item__icon"><Sparkles :size="20" /></div>
          <div class="stat-item__value">Self-learning</div>
          <div class="stat-item__label">Adapts to your patterns</div>
        </div>
        <div class="stats-divider" />
        <div class="stat-item">
          <div class="stat-item__icon"><Brain :size="20" /></div>
          <div class="stat-item__value">Context-aware</div>
          <div class="stat-item__label">Scene & conversation context</div>
        </div>
        <div class="stats-divider" />
        <div class="stat-item">
          <div class="stat-item__icon"><Zap :size="20" /></div>
          <div class="stat-item__value">Low latency</div>
          <div class="stat-item__label">Fast predictions for real talk</div>
        </div>
      </section>

      <!-- ===== RECENT PHRASES ===== -->
      <section v-if="appStore.sentenceHistory.length > 0" class="recent-sentences">
        <p class="recent-sentences__label">Recent phrases</p>
        <div class="recent-sentences__items">
          <button
            v-for="sentence in appStore.sentenceHistory.slice(0, 3)"
            :key="sentence"
            class="recent-sentence"
            @click="tts.speak(sentence)"
          >
            {{ sentence }}
          </button>
        </div>
      </section>
    </main>

    <footer class="home-footer" v-if="!appStore.settingsExpanded">
      <p class="keyboard-nav-hint">
        Press <kbd>Enter</kbd> to start &bull; Arrow keys and Tab also work
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* ======================== LAYOUT ======================== */
.home {
  @apply relative min-h-screen bg-aac-bg overflow-x-hidden;
}

.home__content {
  @apply relative z-10 w-full max-w-6xl mx-auto px-5 md:px-8;
  @apply flex flex-col gap-12 py-2;
}

/* ======================== BACKGROUND EFFECTS ======================== */
.particles-container {
  @apply fixed inset-0 pointer-events-none z-0 overflow-hidden;
}

.particle {
  @apply absolute rounded-full;
  background: rgb(var(--aac-highlight) / 0.15);
}

.particle--0 { @apply w-1.5 h-1.5; top: 15%; left: 20%; }
.particle--1 { @apply w-2 h-2; top: 30%; left: 70%; }
.particle--2 { @apply w-1 h-1; top: 60%; left: 40%; }
.particle--3 { @apply w-2.5 h-2.5; top: 80%; left: 85%; }

.particle:nth-child(5) { top: 10%; left: 50%; @apply w-1 h-1; }
.particle:nth-child(6) { top: 45%; left: 15%; @apply w-2 h-2; }
.particle:nth-child(7) { top: 70%; left: 60%; @apply w-1.5 h-1.5; }
.particle:nth-child(8) { top: 25%; left: 90%; @apply w-1 h-1; }
.particle:nth-child(9) { top: 55%; left: 30%; @apply w-2 h-2; }
.particle:nth-child(10) { top: 85%; left: 45%; @apply w-1.5 h-1.5; }
.particle:nth-child(11) { top: 5%; left: 75%; @apply w-1 h-1; }
.particle:nth-child(12) { top: 40%; left: 55%; @apply w-2.5 h-2.5; }
.particle:nth-child(13) { top: 65%; left: 10%; @apply w-1 h-1; }
.particle:nth-child(14) { top: 90%; left: 25%; @apply w-2 h-2; }
.particle:nth-child(15) { top: 20%; left: 35%; @apply w-1.5 h-1.5; }
.particle:nth-child(16) { top: 50%; left: 80%; @apply w-1 h-1; }
.particle:nth-child(17) { top: 75%; left: 50%; @apply w-2 h-2; }
.particle:nth-child(18) { top: 35%; left: 5%; @apply w-1.5 h-1.5; }
.particle:nth-child(19) { top: 95%; left: 65%; @apply w-1 h-1; }
.particle:nth-child(20) { top: 12%; left: 42%; @apply w-2 h-2; }

.gradient-orbs {
  @apply fixed inset-0 pointer-events-none z-0 overflow-hidden;
}

.orb {
  @apply absolute rounded-full blur-3xl;
  transition: transform 0.3s ease-out;
}

.orb--1 {
  @apply w-[500px] h-[500px] -top-40 -left-40;
  background: radial-gradient(circle, rgb(var(--aac-highlight) / 0.12) 0%, transparent 70%);
}

.orb--2 {
  @apply w-[400px] h-[400px] top-1/3 -right-32;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
}

.orb--3 {
  @apply w-[350px] h-[350px] -bottom-20 left-1/4;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.08) 0%, transparent 70%);
}

/* ======================== HERO ======================== */
.hero {
  @apply flex flex-col items-center text-center gap-5 pt-2 md:pt-4;
  min-height: calc(100vh - 4.5rem);
  justify-content: flex-start;
}

.hero__logo-wrapper {
  @apply relative mb-2;
  perspective: 1000px;
}

.hero__logo {
  @apply h-48 w-auto drop-shadow-2xl;
  @media (min-width: 768px) { height: 16rem; }
  filter: drop-shadow(0 0 30px rgb(var(--aac-highlight) / 0.3));
}

.hero__logo-glow {
  @apply absolute inset-0 -z-10;
  background: radial-gradient(circle, rgb(var(--aac-highlight) / 0.2) 0%, transparent 60%);
  filter: blur(40px);
  transform: scale(2);
}

.hero__title {
  @apply text-3xl sm:text-4xl md:text-6xl font-bold text-aac-text leading-tight tracking-tight;
}

.hero__title-accent {
  @apply relative inline-block text-yellow-400;
}

.hero__tagline {
  @apply text-lg md:text-xl text-aac-muted font-medium;
}

.scroll-indicator {
  @apply mt-2 flex flex-col items-center gap-1;
}

.scroll-indicator__text {
  @apply text-xs uppercase tracking-widest text-aac-muted/70;
}

.scroll-indicator__chevron {
  @apply text-yellow-400 text-xl leading-none;
  animation: bounce-down 1.6s ease-in-out infinite;
}

@keyframes bounce-down {
  0%, 100% { transform: translateY(0); opacity: 0.65; }
  50% { transform: translateY(8px); opacity: 1; }
}

/* ======================== FEATURE CARDS (3D) ======================== */
.feature-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8;
  perspective: 1200px;
}

.feature-card {
  @apply relative rounded-3xl p-6 md:p-8 flex flex-col gap-4;
  @apply border border-white/[0.06] cursor-default;
  background: linear-gradient(
    145deg,
    rgb(var(--aac-card) / 0.9) 0%,
    rgb(var(--aac-surface) / 0.6) 100%
  );
  backdrop-filter: blur(20px);
  transform-style: preserve-3d;
  transition: box-shadow 0.4s ease, border-color 0.4s ease;
  will-change: transform;
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.feature-card:hover {
  border-color: rgb(var(--aac-highlight) / 0.3);
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
    0 0 40px -10px rgb(var(--aac-highlight) / 0.15);
}

.feature-card--elevated {
  @apply md:-mt-4 md:mb-4;
}

.feature-card__icon-wrap {
  @apply w-14 h-14 rounded-2xl flex items-center justify-center;
  transform: translateZ(30px);
}

.feature-card__icon-wrap--blue {
  @apply text-blue-400;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05));
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
}

.feature-card__icon-wrap--purple {
  @apply text-purple-400;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05));
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
}

.feature-card__icon-wrap--teal {
  @apply text-teal-400;
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(20, 184, 166, 0.05));
  box-shadow: 0 0 20px rgba(20, 184, 166, 0.15);
}

.feature-card h2 {
  @apply text-xl font-bold text-aac-text;
  transform: translateZ(20px);
}

.feature-card p {
  @apply text-sm text-aac-muted leading-relaxed;
  transform: translateZ(10px);
}

.feature-card__shine {
  @apply absolute inset-0 rounded-3xl pointer-events-none opacity-0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.03) 45%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.03) 55%,
    transparent 60%
  );
  transition: opacity 0.4s ease;
}

.feature-card:hover .feature-card__shine {
  opacity: 1;
}

/* ======================== STATS ======================== */
.stats-section {
  @apply flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10;
  @apply rounded-3xl border border-white/[0.06] px-8 py-6;
  background: linear-gradient(
    135deg,
    rgb(var(--aac-card) / 0.5) 0%,
    rgb(var(--aac-surface) / 0.3) 100%
  );
  backdrop-filter: blur(16px);
}

.stat-item {
  @apply flex flex-col items-center gap-1.5 text-center;
}

.stat-item__icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center mb-1;
  @apply text-aac-highlight;
  background: rgb(var(--aac-highlight) / 0.12);
}

.stat-item__value {
  @apply text-lg font-bold text-aac-text;
}

.stat-item__label {
  @apply text-xs text-aac-muted;
}

.stats-divider {
  @apply hidden md:block w-px h-16 bg-white/[0.06];
}

/* ======================== CTA ======================== */
.demo-cta {
  @apply flex flex-col items-center gap-4 mt-2;
}

.identity-login {
  @apply flex items-center gap-2;
  @apply p-2 rounded-2xl border border-white/[0.06];
  background: rgb(var(--aac-card) / 0.7);
  backdrop-filter: blur(12px);
}

.identity-login input {
  @apply bg-transparent border border-white/[0.08] rounded-xl;
  @apply px-4 py-2.5 text-aac-text min-w-[220px] placeholder-aac-muted/50;
  @apply focus:border-aac-highlight/50 transition-colors duration-200;
}

.identity-login__btn {
  @apply rounded-xl px-5 py-2.5 font-semibold;
  @apply text-black transition-all duration-200;
  background: #facc15;
}

.identity-login__btn:hover {
  @apply scale-105;
  box-shadow: 0 0 20px rgb(250 204 21 / 0.45);
}

.identity-active {
  @apply px-5 py-2.5 rounded-full flex items-center gap-2;
  @apply border border-aac-highlight/30 text-aac-highlight text-sm;
  background: rgb(var(--aac-highlight) / 0.08);
}

.identity-active__dot {
  @apply w-2 h-2 rounded-full bg-green-400;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
}

.try-demo-btn {
  @apply relative overflow-hidden;
  @apply w-full max-w-lg rounded-2xl border border-yellow-400/60;
  @apply px-8 py-6;
  @apply flex items-center justify-between;
  @apply text-aac-text;
  @apply transition-all duration-300;
  background: rgb(var(--aac-card) / 0.85);
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.try-demo-btn:hover {
  border-color: rgb(250 204 21 / 0.9);
  @apply scale-[1.02];
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.5),
    0 0 40px -10px rgb(250 204 21 / 0.25);
}

.try-demo-btn__content {
  @apply flex flex-col items-start gap-1;
}

.try-demo-btn__label {
  @apply text-2xl font-bold;
}

.try-demo-btn__sub {
  @apply text-sm font-medium text-aac-muted;
}

.try-demo-btn__arrow {
  @apply text-yellow-400 transition-transform duration-300;
}

.try-demo-btn:hover .try-demo-btn__arrow {
  @apply translate-x-1;
}

.try-demo-btn__shimmer {
  @apply absolute inset-0 pointer-events-none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.04) 50%,
    transparent 100%
  );
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.try-demo-btn--gaze-target {
  @apply overflow-visible;
}

.try-demo-btn--gaze-active {
  background: rgb(250 204 21 / 0.16);
  box-shadow: 0 0 60px rgb(250 204 21 / 0.35);
  @apply scale-105;
}

.try-demo-btn__progress {
  @apply absolute bottom-0 left-0 right-0 h-1.5 bg-white/10;
}

.try-demo-btn__progress-fill {
  @apply h-full bg-aac-highlight;
  transition: width 0.05s linear;
}

.keyboard-nav-hint {
  @apply text-sm text-aac-muted/70;
}

.keyboard-nav-hint kbd {
  @apply inline-block px-1.5 py-0.5 rounded text-xs font-mono;
  @apply bg-white/[0.06] border border-white/[0.1] text-aac-muted;
}

.home-footer {
  @apply relative z-10 pb-4 text-center;
}

/* ======================== RECENT SENTENCES ======================== */
.recent-sentences {
  @apply pt-2 pb-10;
}

.recent-sentences__label {
  @apply text-sm text-aac-muted/60 text-center mb-3 uppercase tracking-widest;
}

.recent-sentences__items {
  @apply flex flex-wrap justify-center gap-3;
}

.recent-sentence {
  @apply px-5 py-2.5 rounded-full border border-white/[0.06];
  @apply text-sm text-aac-muted transition-all duration-300;
  background: rgb(var(--aac-card) / 0.5);
  backdrop-filter: blur(8px);
}

.recent-sentence:hover {
  @apply text-white border-aac-highlight/40;
  background: rgb(var(--aac-highlight) / 0.2);
  box-shadow: 0 0 20px rgb(var(--aac-highlight) / 0.15);
  @apply scale-105;
}
</style>
