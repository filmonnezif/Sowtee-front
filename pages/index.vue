<script setup lang="ts">
/**
 * SOWTEE Home Page
 * Interactive modern landing with 3D cards, scroll animations, and hero logo.
 */
import { Globe, ArrowRight, Brain, Zap, Download } from 'lucide-vue-next'
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
const heroSubDescRef = ref<HTMLElement | null>(null)
const ctaSectionRef = ref<HTMLElement | null>(null)
const particlesRef = ref<HTMLElement | null>(null)
const whyPanelsRef: HTMLElement[] = []
const missionRef = ref<HTMLElement | null>(null)
const missionVisible = ref(false)
const activeWhyIndex = ref(0)
const isMobile = ref(false)
const isStandaloneApp = ref(false)
const isIosSafari = ref(false)
const canInstallApp = ref(false)
const prefersReducedMotion = ref(false)
const demoProgress = ref(0)
const demoPhraseIndex = ref(0)

let motionPreferenceQuery: MediaQueryList | null = null
let whyObserver: IntersectionObserver | null = null
let missionObserver: IntersectionObserver | null = null
let revealObserver: IntersectionObserver | null = null
let showcaseInterval: ReturnType<typeof setInterval> | null = null

const scrollProgress = ref(0)

const demoPhrases = [
  'Eye-tracking + context-aware phrase prediction stream',
  'Adaptive phrase ranking responds to live conversation context',
  'Low-effort communication flow with scene-aware suggestions',
]

const currentDemoPhrase = computed(() => demoPhrases[demoPhraseIndex.value] || demoPhrases[0])

const whyNarrative = [
  {
    pain: 'Sounds like a robot, not you',
    detail: 'Old AAC gives everyone the same flat, mechanical voice. It stops feeling like you and starts feeling like a machine.',
    solutionTitle: 'Your voice, cloned and kept alive',
    solution: 'Sowtee clones your real voice from recordings. When it speaks, it sounds like you. People hear you, not a computer.',
  },
  {
    pain: 'Too many buttons, too much effort',
    detail: 'Traditional AAC makes you tap through endless grids. It\'s slow, tiring, and the moment is gone before you finish.',
    solutionTitle: 'Just look. Sowtee gets it.',
    solution: 'Select words with your eyes. No hands needed. Sowtee also learns your patterns so the right words appear before you search.',
  },
  {
    pain: 'Suggestions that miss the point',
    detail: 'Most AAC apps ignore what\'s happening around you. They suggest "hello" at dinner and "goodbye" when you just sat down.',
    solutionTitle: 'Sees your world, says what matters',
    solution: 'Sowtee reads your environment and conversation to suggest words that actually fit the moment. Less searching, more talking.',
  },
]

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const deferredInstallPrompt = ref<BeforeInstallPromptEvent | null>(null)
const showInstallButton = computed(() => isMobile.value && !isStandaloneApp.value)
const installButtonLabel = computed(() => (canInstallApp.value ? 'Install App' : 'How to Install'))

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
  if (prefersReducedMotion.value) {
    if (heroLogoRef.value) gsap.set(heroLogoRef.value, { opacity: 1, y: 0, scale: 1 })
    if (heroTitleRef.value) gsap.set(heroTitleRef.value, { opacity: 1, y: 0 })
    if (heroDescRef.value) gsap.set(heroDescRef.value, { opacity: 1, y: 0 })
    if (heroSubDescRef.value) gsap.set(heroSubDescRef.value, { opacity: 1, y: 0 })
    if (ctaSectionRef.value) gsap.set(ctaSectionRef.value, { opacity: 1, y: 0 })
    return
  }

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

  if (heroSubDescRef.value) {
    heroTl.fromTo(heroSubDescRef.value,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 },
      '-=0.45'
    )
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

function setWhyPanelRef(el: any, index: number) {
  if (el) whyPanelsRef[index] = el as HTMLElement
}

function updateMotionPreference() {
  prefersReducedMotion.value = motionPreferenceQuery?.matches ?? false
}

function initInspiraLikeObservers() {
  if (whyObserver) whyObserver.disconnect()
  if (missionObserver) missionObserver.disconnect()

  whyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const panelIndex = whyPanelsRef.findIndex((panel) => panel === entry.target)
        if (panelIndex >= 0) activeWhyIndex.value = panelIndex
      })
    },
    {
      root: null,
      threshold: 0.65,
    }
  )

  whyPanelsRef.forEach((panel) => {
    if (panel) whyObserver?.observe(panel)
  })

  if (missionRef.value) {
    missionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          missionVisible.value = true
          missionObserver?.disconnect()
          missionObserver = null
        }
      },
      {
        threshold: 0.25,
      }
    )

    missionObserver.observe(missionRef.value)
  }
}

function initProgressiveReveal() {
  revealObserver?.disconnect()

  const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!revealElements.length) return

  if (prefersReducedMotion.value) {
    revealElements.forEach((el) => el.classList.add('is-visible'))
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      })
    },
    {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.18,
    }
  )

  revealElements.forEach((el) => revealObserver?.observe(el))
}

function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight
  if (maxScroll <= 0) {
    scrollProgress.value = 0
    return
  }
  scrollProgress.value = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100))
}

function handleReactiveClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return

  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  target.style.setProperty('--rx', `${x}px`)
  target.style.setProperty('--ry', `${y}px`)

  target.classList.remove('reactive-click')
  void target.offsetWidth
  target.classList.add('reactive-click')
}

function handleInteractiveSurfaceMove(event: Event) {
  if (prefersReducedMotion.value) return

  const mouseEvent = event as PointerEvent
  const target = event.currentTarget as HTMLElement | null
  if (!target) return

  const rect = target.getBoundingClientRect()
  const x = mouseEvent.clientX - rect.left
  const y = mouseEvent.clientY - rect.top
  const px = rect.width > 0 ? x / rect.width : 0.5
  const py = rect.height > 0 ? y / rect.height : 0.5
  const tiltX = (0.5 - py) * 8
  const tiltY = (px - 0.5) * 10

  target.style.setProperty('--mx', `${Math.round(px * 100)}%`)
  target.style.setProperty('--my', `${Math.round(py * 100)}%`)
  target.style.setProperty('--tiltX', `${tiltX.toFixed(2)}deg`)
  target.style.setProperty('--tiltY', `${tiltY.toFixed(2)}deg`)
  target.classList.add('interactive-surface--active')
}

function handleInteractiveSurfaceLeave(event: Event) {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return

  target.style.setProperty('--tiltX', '0deg')
  target.style.setProperty('--tiltY', '0deg')
  target.classList.remove('interactive-surface--active')
}

function setupInteractiveSurfaces() {
  const surfaces = Array.from(document.querySelectorAll<HTMLElement>('.interactive-surface'))

  surfaces.forEach((surface) => {
    surface.removeEventListener('pointermove', handleInteractiveSurfaceMove)
    surface.removeEventListener('pointerleave', handleInteractiveSurfaceLeave)
    surface.addEventListener('pointermove', handleInteractiveSurfaceMove)
    surface.addEventListener('pointerleave', handleInteractiveSurfaceLeave)
  })
}

function teardownInteractiveSurfaces() {
  const surfaces = Array.from(document.querySelectorAll<HTMLElement>('.interactive-surface'))
  surfaces.forEach((surface) => {
    surface.removeEventListener('pointermove', handleInteractiveSurfaceMove)
    surface.removeEventListener('pointerleave', handleInteractiveSurfaceLeave)
    surface.style.removeProperty('--tiltX')
    surface.style.removeProperty('--tiltY')
    surface.classList.remove('interactive-surface--active')
  })
}

function startShowcasePlayback() {
  if (showcaseInterval) {
    clearInterval(showcaseInterval)
    showcaseInterval = null
  }

  demoProgress.value = 0

  if (prefersReducedMotion.value) return

  showcaseInterval = setInterval(() => {
    demoProgress.value += 2
    if (demoProgress.value >= 100) {
      demoProgress.value = 0
      demoPhraseIndex.value = (demoPhraseIndex.value + 1) % demoPhrases.length
    }
  }, 90)
}

function stopShowcasePlayback() {
  if (!showcaseInterval) return
  clearInterval(showcaseInterval)
  showcaseInterval = null
}

function scrollToWhy() {
  const target = document.querySelector('.why-section') as HTMLElement | null
  if (!target) return

  target.scrollIntoView({
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
    block: 'start',
  })
}

onMounted(async () => {
  loginName.value = appStore.userName
  tts.initialize()
  updateViewportMode()
  detectMobilePlatform()
  detectStandaloneMode()

  motionPreferenceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  motionPreferenceQuery.addEventListener('change', updateMotionPreference)

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('resize', updateTargetBounds)
  window.addEventListener('resize', updateViewportMode)
  window.addEventListener('resize', updateScrollProgress)
  window.addEventListener('click', handleCalibrationClick)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  window.addEventListener('appinstalled', handleAppInstalled as EventListener)

  await nextTick()
  setupMinimalNavigation()
  setupInteractiveSurfaces()
  initInspiraLikeObservers()
  initProgressiveReveal()
  initGsapAnimations()
  startShowcasePlayback()
  updateScrollProgress()

  gazeController.onSelect((targetId) => {
    if (targetId === 'try-demo') {
      openSpeaking()
    } else if (targetId === 'done-calibration') {
      completeCalibration()
    }
  })

  // Eye gaze should not run on home page.
  disableEyeGazeExperience()
})

watch(speakingCardRef, () => {
  if (minimalNav.navigableItems.value.length === 0) {
    nextTick(() => setupMinimalNavigation())
  }

  if (speakingCardRef.value && appStore.interactionMode === 'eye_gaze' && gazeController.state.isActive) {
    nextTick(() => registerGazeTargets())
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('resize', updateTargetBounds)
  window.removeEventListener('resize', updateViewportMode)
  window.removeEventListener('resize', updateScrollProgress)
  window.removeEventListener('click', handleCalibrationClick)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('scroll', updateScrollProgress)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  window.removeEventListener('appinstalled', handleAppInstalled as EventListener)
  motionPreferenceQuery?.removeEventListener('change', updateMotionPreference)
  whyObserver?.disconnect()
  missionObserver?.disconnect()
  revealObserver?.disconnect()
  stopShowcasePlayback()
  teardownInteractiveSurfaces()
  gazeController.stop()
  gazeController.clearTargets()
  minimalNav.clearFocus()
  camera.stopCamera()
})

watch(prefersReducedMotion, () => {
  startShowcasePlayback()
  setupInteractiveSurfaces()
})

function updateViewportMode() {
  isMobile.value = window.innerWidth <= 768
}

function detectMobilePlatform() {
  const userAgent = window.navigator.userAgent
  const isIosDevice = /iPad|iPhone|iPod/i.test(userAgent)
  const isSafariBrowser = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)
  isIosSafari.value = isIosDevice && isSafariBrowser
}

function detectStandaloneMode() {
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  isStandaloneApp.value = isDisplayModeStandalone || isIosStandalone
}

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault()
  deferredInstallPrompt.value = event as BeforeInstallPromptEvent
  canInstallApp.value = true
}

function handleAppInstalled() {
  canInstallApp.value = false
  deferredInstallPrompt.value = null
  isStandaloneApp.value = true
}

async function handleInstallApp() {
  if (canInstallApp.value && deferredInstallPrompt.value) {
    await deferredInstallPrompt.value.prompt()
    await deferredInstallPrompt.value.userChoice
    canInstallApp.value = false
    deferredInstallPrompt.value = null
    return
  }

  if (isIosSafari.value) {
    window.alert('To install on iPhone: tap Share in Safari, then tap Add to Home Screen.')
    return
  }

  window.alert('To install this app: open your browser menu and tap Install app or Add to Home screen.')
}

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
  (mode) => {
    // Keep eye gaze disabled on index regardless of mode.
    if (mode !== 'eye_gaze') {
      disableEyeGazeExperience()
      return
    }

    disableEyeGazeExperience()
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
  const shouldShowOnboarding = !appStore.hasCompletedOnboarding && !appStore.hasSkippedOnboarding

  if (shouldShowOnboarding) {
    navigateTo('/onboarding')
    return
  }

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
    <div class="scroll-progress" aria-hidden="true">
      <span class="scroll-progress__fill" :style="{ width: `${scrollProgress}%` }" />
    </div>

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
      <section class="hero section-shell" data-reveal>
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
          <span class="hero__title-main">Bridging the</span>
          <span class="hero__title-accent">Silence</span>
        </h1>

        <p ref="heroDescRef" class="hero__tagline">
          <span class="hero__tagline-normal">Because every</span>
          <span class="hero__tagline-accent">voice matters.</span>
        </p>

        <p ref="heroSubDescRef" class="hero__subtagline">
          A self-learning AAC for
          <span class="hero__subtagline-accent">people with MS and ALS.</span>
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
            class="try-demo-btn navigable-item interactive-surface"
            :class="{
              'try-demo-btn--gaze-target': appStore.interactionMode === 'eye_gaze',
              'try-demo-btn--gaze-active': gazeController.state.currentTargetId === 'try-demo'
            }"
            @click="handleReactiveClick($event); openSpeaking()"
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

          <button
            v-if="showInstallButton"
            class="install-home-btn"
            @click="handleInstallApp"
          >
            <Download :size="20" />
            <span>{{ installButtonLabel }}</span>
          </button>

          <div
            class="scroll-indicator interactive-surface"
            role="button"
            tabindex="0"
            aria-label="Scroll to feature sections"
            @click="scrollToWhy"
            @keydown.enter.prevent="scrollToWhy"
            @keydown.space.prevent="scrollToWhy"
          >
            <span class="scroll-indicator__text">Scroll down to see features</span>
            <div class="scroll-indicator__chevron" aria-hidden="true">⌄</div>
          </div>

        </div>
      </section>

      <!-- ===== 1) WHY: STICKY SCROLL REVEAL ===== -->
      <section class="why-section section-shell" aria-labelledby="why-heading" data-reveal>
        <p class="section-eyebrow">Why Sowtee</p>
        <h2 id="why-heading" class="section-title">Old AAC makes you wait. Sowtee makes you heard.</h2>
        <p class="section-lead">Eye gaze. Voice cloning. Smart context. Speak fast, sound like yourself, and stay in control.</p>

        <div class="why-comparison-flow" aria-live="polite" aria-label="Problem and solution comparison">
          <div
            v-for="(item, index) in whyNarrative"
            :key="item.pain"
            :ref="(el) => setWhyPanelRef(el, index)"
            class="why-comparison-row"
            :class="{ 'why-comparison-row--active': activeWhyIndex === index }"
            data-reveal
          >
            <article class="why-card why-card--pain interactive-surface" tabindex="0" @click="handleReactiveClick">
              <p class="why-card__tag">Traditional AAC Pain</p>
              <div class="why-card__header">
                <span class="why-card__index">0{{ index + 1 }}</span>
                <h3>{{ item.pain }}</h3>
              </div>
              <p>{{ item.detail }}</p>
            </article>

            <article class="why-card why-card--solution interactive-surface" tabindex="0" @click="handleReactiveClick">
              <p class="why-card__tag">SOWTEE Solution</p>
              <h3>{{ item.solutionTitle }}</h3>
              <p>{{ item.solution }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- ===== 2) VISUAL PROOF / DEMO SHOWCASE ===== -->
      <section class="showcase-section section-shell" aria-labelledby="showcase-heading" data-reveal>
        <p class="section-eyebrow">Visual Proof</p>
        <h2 id="showcase-heading" class="section-title">See SOWTEE responding in real time</h2>

        <div class="showcase-frame interactive-surface" role="img" aria-label="Demo preview placeholder for eye tracking and AI word prediction" tabindex="0" @click="handleReactiveClick">
          <div class="showcase-frame__glow" aria-hidden="true" />
          <div class="showcase-frame__header">
            <span class="showcase-dot" />
            <span class="showcase-dot" />
            <span class="showcase-dot" />
          </div>
          <div class="showcase-frame__screen">
            <div class="showcase-frame__badge">Auto-play demo placeholder</div>
            <Transition name="demo-phrase" mode="out-in">
              <p :key="currentDemoPhrase">{{ currentDemoPhrase }}</p>
            </Transition>
            <div class="showcase-frame__timeline" aria-hidden="true">
              <span class="showcase-frame__timeline-fill" :style="{ width: `${demoProgress}%` }" />
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 3) KILLER FEATURES ===== -->
      <section class="underhood-section section-shell" aria-labelledby="underhood-heading" data-reveal>
        <p class="section-eyebrow">Killer Features</p>
        <h2 id="underhood-heading" class="section-title">What makes Sowtee different</h2>

        <div class="underhood-grid">
          <article class="underhood-card interactive-surface" tabindex="0" data-reveal @click="handleReactiveClick">
            <div class="underhood-card__icon"><Zap :size="22" /></div>
            <h3>Effortless Input</h3>
            <p>Use your eyes, a joystick, or simple arrow keys. Sowtee works with the input you have, not the input you lost.</p>
          </article>

          <article class="underhood-card interactive-surface" tabindex="0" data-reveal @click="handleReactiveClick">
            <div class="underhood-card__icon"><Brain :size="22" /></div>
            <h3>Sound Like Yourself</h3>
            <p>ALS and MS can take your voice. Sowtee clones it so when you speak, people still hear you, not a robot.</p>
          </article>

          <article class="underhood-card interactive-surface" tabindex="0" data-reveal @click="handleReactiveClick">
            <div class="underhood-card__icon"><Globe :size="22" /></div>
            <h3>3 Languages, One App</h3>
            <p>Switch between English, Arabic, and Urdu instantly. Speak in the language that feels like home.</p>
          </article>
        </div>
      </section>

      <!-- ===== 4) MISSION ===== -->
      <section ref="missionRef" class="mission-section section-shell" aria-labelledby="mission-heading" data-reveal>
        <p class="section-eyebrow">Our Mission</p>
        <h2 id="mission-heading" class="section-title">Built with empathy. Engineered for dignity.</h2>

        <div class="mission-content" :class="{ 'mission-content--visible': missionVisible }">
          <p>
            When someone loses the ability to speak, they don't lose what they want to say.
            Sowtee (صوتي) exists so no one has to feel invisible. We help people with MS and ALS
            communicate faster, with less fatigue, and with their own identity still intact.
          </p>
          <div class="maker-card interactive-surface" tabindex="0" @click="handleReactiveClick">
            <blockquote class="maker-card__quote">
              "For millions of years, mankind lived just like the animals.
              Then something happened which unleashed the power of our imagination.
              We learned to talk."
            </blockquote>
            <p class="maker-card__name">Stephen Hawking</p>
            <p class="maker-card__bio">Physicist, author, and the world's most recognized AAC user.</p>
          </div>
        </div>
      </section>

      <!-- ===== 5) FINAL CTA ===== -->
      <section class="final-cta section-shell" aria-labelledby="final-cta-heading" data-reveal>
        <h2 id="final-cta-heading">Ready to reclaim your voice?</h2>
        <button class="final-cta__button interactive-surface" @click="handleReactiveClick($event); openSpeaking()">
          <span class="final-cta__button-text">Try the Demo</span>
        </button>
      </section>
    </main>

    <footer class="home-footer" v-if="!appStore.settingsExpanded" data-reveal>
      <nav class="home-footer__links" aria-label="Footer links">
        <a href="#" class="home-footer__link">Privacy Policy</a>
        <a href="#" class="home-footer__link">Contact</a>
      </nav>
      <p class="keyboard-nav-hint">Press <kbd>Enter</kbd> to start</p>
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
  @apply flex flex-col items-center text-center gap-5 pt-4 md:pt-5;
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
  @apply flex flex-row items-center justify-center;
  @apply text-4xl sm:text-5xl md:text-7xl font-black text-aac-text leading-[1.16] tracking-[-0.02em] pb-2;
  white-space: nowrap;
  overflow: visible;
  animation: title-float 6s ease-in-out infinite;
}

.hero__title-main {
  @apply text-aac-text mr-2;
}

.hero__title-accent {
  @apply relative inline-block text-yellow-400;
  text-shadow: 0 0 22px rgb(var(--aac-highlight) / 0.35);
}

@keyframes title-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.hero__tagline {
  @apply mt-1 flex flex-wrap items-center justify-center gap-2;
  @apply text-lg md:text-2xl font-semibold;
}

.hero__tagline-normal {
  @apply text-aac-muted;
}

.hero__tagline-accent {
  @apply text-aac-highlight;
  animation: accent-pulse 3.2s ease-in-out infinite;
}

.hero__subtagline {
  @apply max-w-2xl px-2;
  @apply text-sm sm:text-base md:text-lg text-aac-muted/90 leading-relaxed font-medium;
  text-wrap: pretty;
}

.hero__subtagline-accent {
  @apply text-aac-text font-semibold;
}

@keyframes accent-pulse {
  0%, 100% {
    opacity: 0.85;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-1px);
  }
}

.scroll-indicator {
  @apply mt-2 flex flex-col items-center gap-1;
  @apply cursor-pointer rounded-xl px-4 py-2 transition-all duration-200;
}

.scroll-indicator:hover,
.scroll-indicator:focus-visible {
  background: rgb(250 204 21 / 0.08);
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

/* ======================== SHARED SECTION TYPOGRAPHY ======================== */
.section-eyebrow {
  @apply text-xs md:text-sm uppercase tracking-[0.2em] text-yellow-300/90 font-semibold;
}

.section-title {
  @apply text-2xl sm:text-3xl md:text-4xl font-bold text-aac-text leading-tight;
}

.section-lead {
  @apply text-sm md:text-base text-aac-muted/90 leading-relaxed max-w-4xl;
}

/* ======================== WHY SECTION ======================== */
.why-section {
  @apply pt-4 md:pt-8 flex flex-col gap-4;
}

.why-comparison-flow {
  @apply mt-2 flex flex-col gap-5;
}

.why-comparison-row {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5;
}

.why-card {
  @apply rounded-3xl border border-white/[0.12] p-6 md:p-7;
  @apply transition-all duration-300 h-full;
  background: linear-gradient(145deg, rgb(var(--aac-card) / 0.9), rgb(var(--aac-surface) / 0.74));
}

.why-card__tag {
  @apply text-xs uppercase tracking-[0.17em] text-yellow-300/95 font-semibold;
}

.why-card__header {
  @apply mt-3 flex items-center gap-3;
}

.why-card__index {
  @apply text-sm font-bold text-yellow-300;
}

.why-card h3 {
  @apply text-xl md:text-2xl font-bold text-aac-text;
}

.why-card p {
  @apply mt-3 text-sm md:text-base text-aac-muted leading-relaxed;
}

.why-card--pain {
  border-color: rgb(255 255 255 / 0.08);
  background: linear-gradient(145deg, rgb(9 9 9 / 0.96), rgb(21 21 21 / 0.88));
}

.why-card--pain .why-card__tag {
  @apply text-white/60;
}

.why-card--pain h3 {
  @apply text-white/90;
}

.why-card--pain p {
  @apply text-white/70;
}

.why-card--solution {
  border-color: rgb(250 204 21 / 0.7);
  background: linear-gradient(145deg, rgb(44 34 9 / 0.94), rgb(68 50 10 / 0.84));
  box-shadow:
    0 14px 34px -18px rgb(0 0 0 / 0.7),
    0 0 20px rgb(250 204 21 / 0.14);
}

.why-card--solution .why-card__tag {
  @apply text-yellow-200;
}

.why-card--solution h3 {
  @apply text-white;
}

.why-card--solution p {
  color: rgb(255 255 255 / 0.88);
}

.why-comparison-row--active .why-card {
  border-color: rgb(250 204 21 / 0.42);
}

.why-comparison-row--active .why-card--solution {
  border-color: rgb(250 204 21 / 0.92);
  background: linear-gradient(145deg, rgb(58 43 10 / 0.95), rgb(86 62 11 / 0.88));
  box-shadow:
    0 0 30px rgb(250 204 21 / 0.2),
    0 22px 50px -18px rgb(0 0 0 / 0.72);
  transform: translateY(-2px);
}

.why-comparison-row--active .why-card--pain {
  border-color: rgb(255 255 255 / 0.16);
  box-shadow: none;
}

/* ======================== SHOWCASE SECTION ======================== */
.showcase-section {
  @apply flex flex-col gap-4 pt-2;
}

.showcase-frame {
  @apply relative mt-2 rounded-3xl border border-yellow-300/45 overflow-hidden;
  background: rgb(7 7 7 / 0.92);
  box-shadow:
    0 0 60px rgb(250 204 21 / 0.16),
    0 20px 60px -20px rgba(0, 0, 0, 0.7);
}

.showcase-frame__glow {
  @apply absolute inset-0 pointer-events-none;
  background: radial-gradient(circle at 50% 50%, rgb(250 204 21 / 0.16), transparent 70%);
}

.showcase-frame__header {
  @apply relative z-10 flex items-center gap-2 px-5 py-3 border-b border-white/[0.08];
}

.showcase-dot {
  @apply w-2.5 h-2.5 rounded-full;
  background: rgb(250 204 21 / 0.8);
}

.showcase-frame__screen {
  @apply relative z-10 min-h-[320px] md:min-h-[420px] p-6 md:p-10;
  @apply flex flex-col justify-center items-center text-center;
}

.showcase-frame__badge {
  @apply mb-4 rounded-full border border-yellow-300/50 px-4 py-1.5;
  @apply text-xs uppercase tracking-[0.16em] text-yellow-300 font-semibold;
  background: rgb(250 204 21 / 0.12);
}

.showcase-frame__screen p {
  @apply text-lg md:text-2xl font-semibold text-white max-w-2xl;
}

.showcase-frame__timeline {
  @apply mt-7 w-full max-w-2xl h-2 rounded-full bg-white/10 overflow-hidden;
}

.showcase-frame__timeline-fill {
  @apply block h-full rounded-full;
  width: 0%;
  background: linear-gradient(90deg, rgb(250 204 21), rgb(255 241 161));
  transition: width 0.09s linear;
}

.demo-phrase-enter-active,
.demo-phrase-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.demo-phrase-enter-from,
.demo-phrase-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ======================== UNDER THE HOOD ======================== */
.underhood-section {
  @apply flex flex-col gap-4 pt-2;
}

.underhood-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-5 mt-2;
}

.underhood-card {
  @apply rounded-2xl border border-white/[0.1] p-6;
  @apply transition-all duration-300;
  background: linear-gradient(145deg, rgb(var(--aac-card) / 0.92), rgb(var(--aac-surface) / 0.7));
}

.underhood-card:hover,
.underhood-card:focus-visible {
  border-color: rgb(250 204 21 / 0.65);
  box-shadow: 0 0 30px rgb(250 204 21 / 0.15);
  transform: translateY(-3px);
}

.underhood-card__icon {
  @apply inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 text-yellow-300;
  background: rgb(250 204 21 / 0.14);
}

.underhood-card h3 {
  @apply text-xl font-bold text-white;
}

.underhood-card p {
  @apply mt-3 text-sm text-aac-muted leading-relaxed;
}

/* ======================== MISSION & MAKER ======================== */
.mission-section {
  @apply pt-2;
}

.mission-content {
  @apply mt-4 rounded-3xl border border-white/[0.1] p-6 md:p-8;
  @apply transition-all duration-700;
  background: linear-gradient(145deg, rgb(var(--aac-card) / 0.86), rgb(var(--aac-surface) / 0.68));
  opacity: 0;
  transform: translateY(18px);
}

.mission-content--visible {
  opacity: 1;
  transform: translateY(0);
}

.mission-content > p {
  @apply text-base md:text-lg text-white/95 leading-relaxed max-w-3xl;
}

.maker-card {
  @apply mt-6 rounded-2xl border border-yellow-300/30 p-6;
  background: rgb(250 204 21 / 0.08);
}

.maker-card__quote {
  @apply text-lg md:text-xl text-white/90 leading-relaxed italic font-light;
}

.maker-card__name {
  @apply mt-4 text-xl font-black text-white;
}

.maker-card__bio {
  @apply mt-1 text-sm md:text-base text-aac-muted leading-relaxed;
}

/* ======================== FINAL CTA ======================== */
.final-cta {
  @apply mt-1 mb-2 rounded-3xl border border-yellow-300/35 p-7 md:p-10;
  @apply flex flex-col items-center text-center gap-5;
  background: linear-gradient(145deg, rgb(10 10 10 / 0.92), rgb(20 20 20 / 0.78));
}

.final-cta h2 {
  @apply text-3xl md:text-4xl font-black text-white;
}

.final-cta__button {
  @apply relative rounded-xl px-8 py-3.5 text-base font-bold text-black;
  background: linear-gradient(90deg, #facc15, #fde68a, #facc15);
  background-size: 180% 180%;
  animation: pulse-gradient 2.4s ease-in-out infinite;
  box-shadow: 0 0 24px rgb(250 204 21 / 0.35);
}

.final-cta__button:hover {
  transform: translateY(-1px);
}

.final-cta__button-text {
  @apply relative z-10;
}

@keyframes pulse-gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
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

.install-home-btn {
  @apply inline-flex items-center justify-center gap-2;
  @apply rounded-xl px-5 py-3 text-sm font-semibold;
  @apply border border-emerald-400/60 text-emerald-300;
  @apply transition-all duration-200;
  background: rgb(16 185 129 / 0.12);
}

.install-home-btn:hover {
  background: rgb(16 185 129 / 0.2);
}

.keyboard-nav-hint {
  @apply text-sm text-aac-muted/70;
}

.keyboard-nav-hint kbd {
  @apply inline-block px-1.5 py-0.5 rounded text-xs font-mono;
  @apply bg-white/[0.06] border border-white/[0.1] text-aac-muted;
}

.home-footer {
  @apply relative z-10 pb-8 text-center;
}

.home-footer__links {
  @apply mb-2 flex items-center justify-center gap-5;
}

.home-footer__link {
  @apply text-sm text-aac-muted underline-offset-4;
}

.home-footer__link:hover {
  @apply text-white underline;
}

.home :is(button, a, input, [tabindex]):focus-visible {
  outline: 2px solid rgb(250 204 21 / 1);
  outline-offset: 3px;
  box-shadow: 0 0 0 3px rgb(250 204 21 / 0.24);
}

.interactive-surface {
  position: relative;
  transform: perspective(900px) rotateX(var(--tiltX, 0deg)) rotateY(var(--tiltY, 0deg));
  transform-style: preserve-3d;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
}

.interactive-surface::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    220px 140px at var(--mx, 50%) var(--my, 50%),
    rgb(255 255 255 / 0.12),
    transparent 65%
  );
  transition: opacity 0.2s ease;
}

.interactive-surface--active::after,
.interactive-surface:hover::after,
.interactive-surface:focus-visible::after {
  opacity: 1;
}

.reactive-click {
  animation: reactive-click-pulse 0.45s ease-out;
}

@keyframes reactive-click-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(250 204 21 / 0.35);
  }
  100% {
    box-shadow: 0 0 0 22px rgb(250 204 21 / 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
