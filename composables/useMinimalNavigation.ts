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

export function useMinimalNavigation() {
  const navigableItems = ref<NavigableItem[]>([])
  const currentIndex = ref<number>(-1)
  const isShiftPressed = ref(false)

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

  // Navigate to next/previous item
  function navigate(direction: 'next' | 'previous' | 'up' | 'down' | 'left' | 'right') {
    if (navigableItems.value.length === 0) return

    if ((direction === 'up' || direction === 'down' || direction === 'left' || direction === 'right') && currentIndex.value < 0) {
      const startIndex = getDefaultDirectionalStartIndex()
      if (startIndex >= 0) {
        currentIndex.value = startIndex
        highlightItem(navigableItems.value[startIndex])
      }
      return
    }

    let newIndex = currentIndex.value

    switch (direction) {
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
        newIndex = findExplicitItemInDirection(direction)
        if (newIndex < 0) {
          // Fall back to geometric directional logic only
          newIndex = findClosestItemInDirection(direction)
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

  // Explicit directional map for known UI layouts (speaking page)
  function findExplicitItemInDirection(direction: 'up' | 'down' | 'left' | 'right'): number {
    if (!currentItem.value) return -1

    const currentId = currentItem.value.id
    const has = (id: string) => navigableItems.value.findIndex(i => i.id === id)
    const firstChip = has('suggestion-chip-0') >= 0 ? 'suggestion-chip-0' : null
    const secondChip = has('suggestion-chip-1') >= 0 ? 'suggestion-chip-1' : null
    const thirdChip = has('suggestion-chip-2') >= 0 ? 'suggestion-chip-2' : null

    const mapByDirection: Record<'up' | 'down' | 'left' | 'right', Record<string, string>> = {
      up: {
        'backspace-key': 'card-0',
        'card-3': 'card-1',
        'card-4': 'card-2',
        'space-key': 'card-4',
        'card-0': firstChip || 'speak-btn',
        'card-1': secondChip || firstChip || 'speak-btn',
        'card-2': thirdChip || secondChip || firstChip || 'speak-btn',
        'suggestion-chip-0': 'speak-btn',
        'suggestion-chip-1': 'speak-btn',
        'suggestion-chip-2': 'speak-btn',
      },
      down: {
        'speak-btn': 'card-1',
        'suggestion-chip-0': 'card-0',
        'suggestion-chip-1': 'card-1',
        'suggestion-chip-2': 'card-2',
        'card-0': 'backspace-key',
        'card-1': 'card-3',
        'card-2': 'card-4',
      },
      left: {
        'card-1': 'card-0',
        'card-2': 'card-1',
        'card-3': 'backspace-key',
        'card-4': 'card-3',
        'space-key': 'card-4',
        'suggestion-chip-1': 'suggestion-chip-0',
        'suggestion-chip-2': 'suggestion-chip-1',
      },
      right: {
        'card-0': 'card-1',
        'card-1': 'card-2',
        'backspace-key': 'card-3',
        'card-3': 'card-4',
        'card-4': 'space-key',
        'suggestion-chip-0': 'suggestion-chip-1',
        'suggestion-chip-1': 'suggestion-chip-2',
      },
    }

    const targetId = mapByDirection[direction][currentId]
    if (!targetId) return -1

    return has(targetId)
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
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
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
