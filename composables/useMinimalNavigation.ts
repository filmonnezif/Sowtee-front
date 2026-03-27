/**
 * Composable for minimal keyboard input navigation
 * Provides arrow key navigation and shift+click functionality
 * for cards/buttons with gaze behavior
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface NavigableItem {
  id: string
  element: HTMLElement
  action?: () => void
  priority?: number
}

const navigableItems = ref<NavigableItem[]>([])
const currentIndex = ref<number>(-1)
const isShiftPressed = ref(false)
let listenerRefCount = 0

export function useMinimalNavigation() {
  // Get current focused item
  const currentItem = computed(() => {
    return currentIndex.value >= 0 ? navigableItems.value[currentIndex.value] : null
  })

  // Register a navigable item
  function registerItem(item: NavigableItem) {
    const existingIndex = navigableItems.value.findIndex(i => i.id === item.id)
    if (existingIndex >= 0) {
      navigableItems.value[existingIndex] = item
    } else {
      navigableItems.value.push(item)
    }
    // Sort by priority (higher priority = comes first)
    navigableItems.value.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  // Unregister a navigable item
  function unregisterItem(id: string) {
    const index = navigableItems.value.findIndex(i => i.id === id)
    if (index >= 0) {
      navigableItems.value.splice(index, 1)
      if (currentIndex.value >= navigableItems.value.length) {
        currentIndex.value = navigableItems.value.length - 1
      }
    }
  }

  // Clear all registered items and navigation state
  function clearItems() {
    clearFocus()
    navigableItems.value = []
  }

  /**
   * Detect if the current layout is RTL by checking the DOM.
   */
  function isRtlLayout(): boolean {
    // Check the closest [dir] ancestor of the current element, or the document
    const el = currentItem.value?.element
    if (el) {
      const dirEl = el.closest('[dir]') as HTMLElement | null
      if (dirEl) return dirEl.dir === 'rtl'
    }
    return document.documentElement.dir === 'rtl'
  }

  /**
   * Normalize direction for RTL: swap left ↔ right so arrow keys
   * match the visual layout direction.
   */
  function resolveDirection(dir: 'up' | 'down' | 'left' | 'right'): 'up' | 'down' | 'left' | 'right' {
    if (!isRtlLayout()) return dir
    if (dir === 'left') return 'right'
    if (dir === 'right') return 'left'
    return dir
  }

  // Navigate to next/previous item
  function navigate(direction: 'next' | 'previous' | 'up' | 'down' | 'left' | 'right') {
    if (navigableItems.value.length === 0) return

    // Resolve RTL swap for horizontal directions
    const resolved = (direction === 'left' || direction === 'right')
      ? resolveDirection(direction)
      : direction

    if ((resolved === 'up' || resolved === 'down' || resolved === 'left' || resolved === 'right') && currentIndex.value < 0) {
      const startIndex = getDefaultDirectionalStartIndex()
      if (startIndex >= 0) {
        currentIndex.value = startIndex
        highlightItem(navigableItems.value[startIndex])
      }
      return
    }

    let newIndex = currentIndex.value

    switch (resolved) {
      case 'next':
        newIndex = (newIndex + 1) % navigableItems.value.length
        break
      case 'previous':
        newIndex = newIndex <= 0 ? navigableItems.value.length - 1 : newIndex - 1
        break
      case 'up':
      case 'down':
      case 'left':
      case 'right':
        // First try explicit directional mapping for known layouts
        newIndex = findExplicitItemInDirection(resolved)
        if (newIndex < 0) {
          // Fall back to geometric directional logic only
          newIndex = findClosestItemInDirection(resolved)
        }
        break
    }

    if (newIndex !== currentIndex.value && newIndex >= 0) {
      currentIndex.value = newIndex
      highlightItem(navigableItems.value[newIndex])
    }
  }

  function getDefaultDirectionalStartIndex(): number {
    const preferredOrder = [
      'card-1',
      'suggestion-chip-1',
      'card-0',
      'suggestion-chip-0',
      'speak-btn',
    ]

    for (const id of preferredOrder) {
      const index = navigableItems.value.findIndex(item => item.id === id)
      if (index >= 0) return index
    }

    return navigableItems.value.length > 0 ? 0 : -1
  }

  /**
   * Dynamic directional map for the speaking page grid layout.
   * Builds navigation edges on the fly based on which items are registered.
   *
   * Visual grid (English):
   *   [chip-0] [chip-1] [chip-2]  [speak-btn]
   *   [card-0]  [card-1]  [card-2]
   *   [backspace] [card-3] [card-4] [card-5?] [space-key]
   *
   * Visual grid (Arabic cards — up to 8 cards):
   *   [chip-0] [chip-1] [chip-2]  [speak-btn]
   *   [card-0] [card-1] [card-2] [card-3]
   *   [space] [card-4] [card-5] [card-6] [card-7] [backspace]
   */
  function findExplicitItemInDirection(direction: 'up' | 'down' | 'left' | 'right'): number {
    if (!currentItem.value) return -1

    const currentId = currentItem.value.id
    const exists = (id: string) => navigableItems.value.findIndex(i => i.id === id) >= 0
    const indexOf = (id: string) => navigableItems.value.findIndex(i => i.id === id)

    // Helper: find first existing item from a list of candidates
    const firstOf = (...ids: string[]): string | null => {
      for (const id of ids) {
        if (exists(id)) return id
      }
      return null
    }

    // Detect which cards exist
    const cardIds: string[] = []
    for (let i = 0; i < 10; i++) {
      if (exists(`card-${i}`)) cardIds.push(`card-${i}`)
    }

    // Detect which chips exist
    const chipIds: string[] = []
    for (let i = 0; i < 3; i++) {
      if (exists(`suggestion-chip-${i}`)) chipIds.push(`suggestion-chip-${i}`)
    }

    const hasSpeakBtn = exists('speak-btn')
    const hasBackspace = exists('backspace-key')
    const hasSpace = exists('space-key')

    // Determine layout: separate cards into rows based on count
    // English: top row = cards 0-2, bottom row = cards 3+
    // Arabic cards mode (8 cards): top row = 0-3, bottom row = 4-7
    const isArabicGrid = cardIds.length > 5
    const topRowCards = isArabicGrid ? cardIds.slice(0, 4) : cardIds.slice(0, 3)
    const bottomRowCards = isArabicGrid ? cardIds.slice(4) : cardIds.slice(3)

    // Build the top action row: [chip-0] [chip-1] [chip-2] [speak-btn]
    const topActionRow = [...chipIds, ...(hasSpeakBtn ? ['speak-btn'] : [])]

    // Build the bottom row: [backspace/space] [bottom cards...] [space/backspace]
    // Arabic: space on left, backspace on right
    // English: backspace on left, space on right
    let bottomRow: string[]
    if (isArabicGrid) {
      bottomRow = [
        ...(hasSpace ? ['space-key'] : []),
        ...bottomRowCards,
        ...(hasBackspace ? ['backspace-key'] : []),
      ]
    } else {
      bottomRow = [
        ...(hasBackspace ? ['backspace-key'] : []),
        ...bottomRowCards,
        ...(hasSpace ? ['space-key'] : []),
      ]
    }

    // Build directional map dynamically
    const map: Record<string, string> = {}

    // --- LEFT / RIGHT within each row ---
    const addHorizontalEdges = (row: string[]) => {
      for (let i = 0; i < row.length - 1; i++) {
        map[`right:${row[i]}`] = row[i + 1]
        map[`left:${row[i + 1]}`] = row[i]
      }
    }

    addHorizontalEdges(topActionRow)
    addHorizontalEdges(topRowCards)
    addHorizontalEdges(bottomRow)

    // --- UP / DOWN between rows ---
    // Column alignment: map each top-row card to the chip/action above and bottom item below

    // Top action row ↔ top card row
    // Align by position: chip-0 ↔ card-0, chip-1 ↔ card-1, chip-2 ↔ card-2, speak-btn ↔ last top card
    for (let i = 0; i < topRowCards.length; i++) {
      const cardId = topRowCards[i]
      // Find the best action item above this card column
      let aboveId: string | null = null
      if (i < chipIds.length) {
        aboveId = chipIds[i]
      } else if (hasSpeakBtn) {
        aboveId = 'speak-btn'
      } else if (chipIds.length > 0) {
        aboveId = chipIds[chipIds.length - 1]
      }

      if (aboveId) {
        map[`up:${cardId}`] = aboveId
        map[`down:${aboveId}`] = cardId
      }
    }

    // If speak-btn doesn't have a down mapping yet, map it to the rightmost top card
    if (hasSpeakBtn && !map[`down:speak-btn`] && topRowCards.length > 0) {
      map[`down:speak-btn`] = topRowCards[topRowCards.length - 1]
      // Also ensure that card can go up to speak-btn
      const lastTopCard = topRowCards[topRowCards.length - 1]
      if (!map[`up:${lastTopCard}`]) {
        map[`up:${lastTopCard}`] = 'speak-btn'
      }
    }

    // Top card row ↔ bottom row
    // Align by position index within each row
    for (let i = 0; i < topRowCards.length; i++) {
      const topCard = topRowCards[i]
      // Find the best bottom item at the same column position
      if (i < bottomRow.length) {
        const bottomId = bottomRow[i]
        map[`down:${topCard}`] = bottomId
        if (!map[`up:${bottomId}`]) {
          map[`up:${bottomId}`] = topCard
        }
      } else if (bottomRow.length > 0) {
        // More top cards than bottom items — map to last bottom item
        map[`down:${topCard}`] = bottomRow[bottomRow.length - 1]
      }
    }

    // Ensure remaining bottom-row items without an up-mapping get one
    for (let i = 0; i < bottomRow.length; i++) {
      const bottomId = bottomRow[i]
      if (!map[`up:${bottomId}`]) {
        // Map to the nearest top-row card by column index
        const targetIdx = Math.min(i, topRowCards.length - 1)
        if (targetIdx >= 0) {
          map[`up:${bottomId}`] = topRowCards[targetIdx]
        }
      }
    }

    const targetId = map[`${direction}:${currentId}`]
    if (!targetId) return -1

    return indexOf(targetId)
  }

  // Find closest item in specific direction based on relative position
  function findClosestItemInDirection(direction: string): number {
    if (currentIndex.value < 0 || !currentItem.value || navigableItems.value.length === 0) {
      return -1
    }

    const currentRect = currentItem.value.element.getBoundingClientRect()
    const currentCenterX = currentRect.left + currentRect.width / 2
    const currentCenterY = currentRect.top + currentRect.height / 2

    let bestIndex = currentIndex.value
    let bestScore = Infinity

    navigableItems.value.forEach((item, index) => {
      if (index === currentIndex.value) return

      const rect = item.element.getBoundingClientRect()
      const itemCenterX = rect.left + rect.width / 2
      const itemCenterY = rect.top + rect.height / 2

      let isInDirection = false
      let score = 0

      switch (direction) {
        case 'up':
          isInDirection = itemCenterY < currentCenterY
          if (isInDirection) {
            const verticalDistance = currentCenterY - itemCenterY
            const horizontalDistance = Math.abs(currentCenterX - itemCenterX)
            // Prefer items that are more directly above (less horizontal offset)
            score = verticalDistance + (horizontalDistance * 2)
          }
          break
        case 'down':
          isInDirection = itemCenterY > currentCenterY
          if (isInDirection) {
            const verticalDistance = itemCenterY - currentCenterY
            const horizontalDistance = Math.abs(currentCenterX - itemCenterX)
            // Prefer items that are more directly below (less horizontal offset)
            score = verticalDistance + (horizontalDistance * 2)
          }
          break
        case 'left':
          isInDirection = itemCenterX < currentCenterX
          if (isInDirection) {
            const horizontalDistance = currentCenterX - itemCenterX
            const verticalDistance = Math.abs(currentCenterY - itemCenterY)
            // Prefer items that are more directly left (less vertical offset)
            score = horizontalDistance + (verticalDistance * 2)
          }
          break
        case 'right':
          isInDirection = itemCenterX > currentCenterX
          if (isInDirection) {
            const horizontalDistance = itemCenterX - currentCenterX
            const verticalDistance = Math.abs(currentCenterY - itemCenterY)
            // Prefer items that are more directly right (less vertical offset)
            score = horizontalDistance + (verticalDistance * 2)
          }
          break
      }

      // Also consider screen edges - prefer items that stay within viewport
      if (isInDirection) {
        let edgePenalty = 0
        if (rect.left < 0 || rect.right > window.innerWidth) edgePenalty += 1000
        if (rect.top < 0 || rect.bottom > window.innerHeight) edgePenalty += 1000
        score += edgePenalty
      }

      if (isInDirection && score < bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    // If no item exists in that direction, stay on current item
    return bestIndex === currentIndex.value ? -1 : bestIndex
  }

  // Highlight an item visually
  function highlightItem(item: NavigableItem) {
    // Remove previous highlights
    navigableItems.value.forEach(i => {
      i.element.classList.remove('keyboard-nav-highlighted')
    })

    // Add highlight to current item
    item.element.classList.add('keyboard-nav-highlighted')

    // Scroll into view if needed
    item.element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    })
  }

  // Activate current item (click it)
  function activateCurrent() {
    if (currentItem.value) {
      if (isShiftPressed.value) {
        // Shift+click behavior
        currentItem.value.element.dispatchEvent(new MouseEvent('click', {
          shiftKey: true,
          bubbles: true,
          cancelable: true
        }))
      } else {
        // Normal click
        if (currentItem.value.action) {
          currentItem.value.action()
        } else {
          currentItem.value.element.click()
        }
      }
    }
  }

  // Handle keyboard events
  function handleKeyDown(e: KeyboardEvent) {
    // Don't interfere with input fields
    const activeElement = document.activeElement
    if (activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement)?.contentEditable === 'true') {
      return
    }

    // Track shift key state and trigger click on Shift press
    if (e.key === 'Shift') {
      e.preventDefault()
      isShiftPressed.value = true
      // Immediately click current item when Shift is pressed
      if (currentItem.value) {
        if (currentItem.value.action) {
          currentItem.value.action()
        } else {
          currentItem.value.element.click()
        }
      }
      return
    }

    // Arrow navigation
    if (e.key.startsWith('Arrow')) {
      e.preventDefault()
      const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right'
      navigate(direction)
      return
    }

    // Tab navigation
    if (e.key === 'Tab') {
      e.preventDefault()
      navigate(e.shiftKey ? 'previous' : 'next')
      return
    }

    // Enter / Space to activate current item
    if (e.key === 'Enter' || (e.code === 'Space' && !e.shiftKey)) {
      e.preventDefault()
      activateCurrent()
      return
    }

    // Escape to clear focus
    if (e.key === 'Escape') {
      e.preventDefault()
      clearFocus()
      return
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      isShiftPressed.value = false
    }
  }

  function attachGlobalListeners() {
    if (listenerRefCount === 0) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }
    listenerRefCount += 1
  }

  function detachGlobalListeners() {
    listenerRefCount = Math.max(0, listenerRefCount - 1)
    if (listenerRefCount === 0) {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      isShiftPressed.value = false
    }
  }

  // Clear all highlights and focus
  function clearFocus() {
    navigableItems.value.forEach(item => {
      item.element.classList.remove('keyboard-nav-highlighted')
    })
    currentIndex.value = -1
  }

  // Start navigation from a specific item
  function startFromItem(itemId: string) {
    const index = navigableItems.value.findIndex(item => item.id === itemId)
    if (index >= 0) {
      currentIndex.value = index
      highlightItem(navigableItems.value[index])
    }
  }

  onMounted(() => {
    attachGlobalListeners()
  })

  onUnmounted(() => {
    detachGlobalListeners()
    clearFocus()
  })

  return {
    navigableItems: computed(() => navigableItems.value),
    currentIndex: computed(() => currentIndex.value),
    currentItem,
    isShiftPressed: computed(() => isShiftPressed.value),
    registerItem,
    unregisterItem,
    clearItems,
    navigate,
    activateCurrent,
    clearFocus,
    startFromItem
  }
}
