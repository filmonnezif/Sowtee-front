# SOWTEE Frontend

The Nuxt 3 frontend for SOWTEE - providing the accessible AAC interface with hybrid input support.

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Run development server
pnpm dev
```

## Features

### Accessibility-First Design

- Large touch targets (48px minimum)
- High contrast color scheme
- Reduced motion support
- Screen reader compatible
- Bilingual support (English/Arabic)

### Hybrid Input System

#### Touch Mode
Standard touch interaction for users with early-stage motor impairment.

#### Eye-Gaze Mode
WebGazer.js integration with dwell-based selection:
- Gaze position tracking
- Dwell time indicator
- Auto-select on dwell threshold

### Components

- `PhraseCard.vue`: Displays predicted phrases with confidence
- `CameraPreview.vue`: Camera feed with status indicators
- `GazeIndicator.vue`: Visual feedback for gaze position
- `ControlPanel.vue`: Settings and mode controls
- `DebugPanel.vue`: Agent reasoning trace display

### Composables

- `useApi()`: Backend API communication
- `useCamera()`: Camera access and frame capture
- `useEyeGaze()`: WebGazer.js integration
- `useTTS()`: Text-to-speech synthesis

## Development

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Styling

Using Tailwind CSS with custom AAC-focused utilities:

```css
/* Large, accessible buttons */
.aac-button { @apply min-h-touch min-w-touch ... }

/* High-contrast phrase cards */
.phrase-card { @apply bg-aac-surface border-aac-card ... }

/* Gaze focus indicator */
.aac-button--gaze-focus { @apply ring-4 ring-accent-400 ... }
```
# Sowtee-front
