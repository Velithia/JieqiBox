<template>
  <!-- Custom draggable dialog overlay -->
  <div
    v-if="isDialogVisible"
    class="custom-dialog-overlay"
    @click="handleOverlayClick"
  >
    <div
      v-if="gameState.pendingFlip.value"
      class="custom-draggable-dialog"
      :style="dialogStyle"
      @click.stop
    >
      <div
        class="dialog-title-bar"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <span class="text-h5">{{ $t('flipPrompt.title') }}</span>
        <div class="drag-handle">⋮⋮</div>
      </div>
      <div class="dialog-content">
        <div class="pieces-grid">
          <div
            v-for="item in availablePieces"
            :key="item.name"
            class="piece-item"
            @click="selectPiece(item.name)"
          >
            <div class="piece-option">
              <img
                :src="getPieceImageUrl(item.name)"
                :alt="item.name"
                class="piece-image"
              />
              <div>{{ item.count }}</div>
            </div>
          </div>
        </div>
        <div v-if="availablePieces.length === 0" class="error-message">
          <p>{{ $t('flipPrompt.message') }}</p>
        </div>
      </div>
      <div class="dialog-actions">
        <div class="spacer"></div>
        <button class="cancel-btn" @click="cancelFlip">
          {{ $t('flipPrompt.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
  import MersenneTwister from 'mersenne-twister'

  // Create a global instance of Mersenne Twister for this component
  const mt = new MersenneTwister()

  // Set seed based on current date and time for better randomness
  mt.init_seed(new Date().getTime())

  // Custom random function using Mersenne Twister
  const mtRandom = (): number => {
    return mt.random()
  }

  const gameState: any = inject('game-state')

  // Drag state management
  const isDragging = ref(false)
  const dragOffset = ref({ x: 0, y: 0 })
  const dialogPosition = ref({ x: 0, y: 0 })

  const isDialogVisible = computed(() => gameState.pendingFlip.value !== null)

  // Calculate dialog position for dragging
  const dialogStyle = computed(() => ({
    position: 'fixed' as const,
    top: `${dialogPosition.value.y}px`,
    left: `${dialogPosition.value.x}px`,
    transform: 'none',
    margin: '0',
    zIndex: 9999,
  }))

  const availablePieces = computed(() => {
    if (!gameState.pendingFlip.value) return []
    const requiredSide = gameState.pendingFlip.value.side

    return Object.entries(gameState.unrevealedPieceCounts.value)
      .map(([char, count]) => {
        const name = gameState.getPieceNameFromChar(char)
        return { name, char, count }
      })
      .filter(item => {
        const pieceSide = item.name.startsWith('red') ? 'red' : 'black'
        return pieceSide === requiredSide && (item.count as number) > 0
      })
  })

  // Initialize dialog position to center of screen
  onMounted(() => {
    centerDialog()
  })

  // Center the dialog on screen
  function centerDialog() {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const dialogWidth = 500 // max-width from v-dialog
    const dialogHeight = 400 // estimated height

    dialogPosition.value = {
      x: Math.max(0, (windowWidth - dialogWidth) / 2),
      y: Math.max(0, (windowHeight - dialogHeight) / 2),
    }
  }

  // Start dragging when mouse down on title bar
  function startDrag(event: MouseEvent | TouchEvent) {
    isDragging.value = true

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY

    dragOffset.value = {
      x: clientX - dialogPosition.value.x,
      y: clientY - dialogPosition.value.y,
    }

    // Add event listeners for dragging
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('touchmove', handleDrag, { passive: false })
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchend', stopDrag)

    // Prevent default to avoid text selection
    event.preventDefault()
  }

  // Handle dragging movement
  function handleDrag(event: MouseEvent | TouchEvent) {
    if (!isDragging.value) return

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY

    // Calculate new position
    const newX = clientX - dragOffset.value.x
    const newY = clientY - dragOffset.value.y

    // Allow dragging across the entire window without constraints
    // Only prevent the dialog from being completely outside the viewport
    const minX = -480 // Allow dialog to be almost completely outside left edge
    const maxX = window.innerWidth - 20 // Allow dialog to be almost completely outside right edge
    const minY = -380 // Allow dialog to be almost completely outside top edge
    const maxY = window.innerHeight - 20 // Allow dialog to be almost completely outside bottom edge

    dialogPosition.value = {
      x: Math.max(minX, Math.min(newX, maxX)),
      y: Math.max(minY, Math.min(newY, maxY)),
    }

    // Prevent default for touch events
    if ('touches' in event) {
      event.preventDefault()
    }
  }

  // Stop dragging
  function stopDrag() {
    isDragging.value = false

    // Remove event listeners
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('touchmove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchend', stopDrag)
  }

  // Clean up event listeners on component unmount
  onUnmounted(() => {
    stopDrag()
  })

  // Handle overlay click to prevent dialog closing when clicking outside
  function handleOverlayClick(event: Event) {
    // Only close if clicking directly on the overlay, not on the dialog
    if (event.target === event.currentTarget) {
      cancelFlip()
    }
  }

  function selectPiece(pieceName: string) {
    if (gameState.pendingFlip.value) {
      gameState.pendingFlip.value.callback(pieceName)
    }
  }

  function cancelFlip() {
    if (gameState.pendingFlip.value) {
      // When the dialog is closed directly, flip a piece randomly based on probability
      const requiredSide = gameState.pendingFlip.value.side
      const pool = Object.entries(gameState.unrevealedPieceCounts.value)
        .filter(([, count]) => (count as number) > 0)
        .flatMap(([char, count]) => {
          const name = gameState.getPieceNameFromChar(char)
          return name.startsWith(requiredSide)
            ? Array(count as number).fill(name)
            : []
        })

      if (pool.length > 0) {
        // Randomly select a piece
        const randomIndex = Math.floor(mtRandom() * pool.length)
        const chosenName = pool[randomIndex]
        gameState.pendingFlip.value.callback(chosenName)
      } else {
        // If no pieces are available, just cancel
        const uciMove = gameState.pendingFlip.value.uciMove
        // Check if this was an AI move before clearing pendingFlip
        const isAiMove = (window as any).__LAST_AI_MOVE__ === uciMove
        gameState.pendingFlip.value = null

        // If this was an AI move, ponder should be started now that the flip dialog is closed
        if (isAiMove) {
          console.log(
            `[DEBUG] cancelFlip: AI move completed after flip dialog cancellation. Checking if ponder should start.`
          )
          const ponderState = (window as any).__PONDER_STATE__
          if (ponderState && ponderState.handlePonderAfterMove) {
            console.log(
              `[DEBUG] cancelFlip: Triggering ponder for AI move: ${uciMove}`
            )
            ponderState.handlePonderAfterMove(uciMove, true)
          }
        }
      }
    }
  }

  function getPieceImageUrl(pieceName: string): string {
    const imageName = pieceName || 'dark_piece'
    return new URL(`../assets/${imageName}.svg`, import.meta.url).href
  }
</script>

<style scoped>
  /* Custom dialog overlay */
  .custom-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Custom draggable dialog */
  .custom-draggable-dialog {
    background-color: rgba(var(--v-theme-surface), 0.75);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 100%;
    user-select: none;
    overflow: hidden;
  }

  /* Dialog title bar */
  .dialog-title-bar {
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(var(--v-theme-surface), 0.75);
    border-bottom: 1px solid
      rgba(var(--v-border-color), var(--v-border-opacity));
    padding: 16px 20px;
    font-size: 18px;
    font-weight: 500;
  }

  .drag-handle {
    font-size: 16px;
    color: rgb(var(--v-theme-on-surface));
    cursor: move;
    user-select: none;
  }

  /* Dialog content */
  .dialog-content {
    padding: 20px;
    background-color: rgba(var(--v-theme-surface), 0.75);
  }

  /* Pieces grid */
  .pieces-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 8px;
    margin-bottom: 20px;
  }

  .piece-item {
    text-align: center;
  }

  .piece-option {
    cursor: pointer;
    padding: 10px;
    border-radius: 8px;
    transition: background-color 0.2s;
    border: 1px solid transparent;
    background-color: rgba(var(--v-theme-surface), 0.75);
  }

  .piece-option:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .piece-image {
    width: 40px;
    height: 40px;
    display: block;
    margin: 0 auto 5px;
  }

  /* Error message */
  .error-message {
    text-align: center;
    color: rgb(var(--v-theme-error));
    padding: 10px;
  }

  /* Dialog actions */
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgba(var(--v-theme-surface), 0.75);
  }

  .spacer {
    flex: 1;
  }

  .cancel-btn {
    background-color: rgba(var(--v-theme-surface), 0.75);
    color: rgb(var(--v-theme-on-surface));
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .cancel-btn:hover {
    background-color: rgba(var(--v-theme-primary), 0.1);
  }
</style>
