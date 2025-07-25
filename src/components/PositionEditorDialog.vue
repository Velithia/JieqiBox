<template>
  <v-dialog
    v-model="isVisible"
    persistent
    max-width="700px"
    :fullscreen="$vuetify.display.smAndDown"
  >
    <v-card>
      <v-card-title class="pb-2">
        <span class="text-h6">{{ $t('positionEditor.title') }}</span>
      </v-card-title>

      <v-card-text class="pt-0">
        <v-container class="pa-0">
          <!-- Action Buttons -->
          <v-row class="mb-2">
            <v-col cols="12">
              <div class="d-flex gap-1 flex-wrap">
                <v-btn
                  @click="flipBoard"
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  {{ $t('positionEditor.flipBoard') }}
                </v-btn>
                <v-btn
                  @click="switchSide"
                  color="secondary"
                  variant="outlined"
                  size="small"
                >
                  {{ $t('positionEditor.switchSide') }}
                </v-btn>
                <v-btn
                  @click="resetPosition"
                  color="warning"
                  variant="outlined"
                  size="small"
                >
                  {{ $t('positionEditor.resetPosition') }}
                </v-btn>
              </div>
            </v-col>
          </v-row>

          <!-- Board Editing Area - Responsive Layout -->
          <v-row class="g-0">
            <!-- Board area - 8 columns on desktop, 12 columns on mobile -->
            <v-col cols="12" md="8" class="pa-1">
              <div class="position-editor-board">
                <div class="board-grid">
                  <div
                    v-for="row in 10"
                    :key="`row-${row - 1}`"
                    class="board-row"
                  >
                    <div
                      v-for="col in 9"
                      :key="`col-${col - 1}`"
                      class="board-cell"
                      :class="{
                        selected:
                          selectedCell.row === row - 1 &&
                          selectedCell.col === col - 1,
                        'has-piece': getPieceAt(row - 1, col - 1),
                      }"
                      @click="selectCell(row - 1, col - 1)"
                    >
                      <div
                        v-if="getPieceAt(row - 1, col - 1)"
                        class="piece-display"
                      >
                        <img
                          :src="
                            getPieceImageUrl(getPieceAt(row - 1, col - 1)!.name)
                          "
                          :alt="getPieceAt(row - 1, col - 1)!.name"
                          class="piece-img"
                        />
                        <v-btn
                          icon="mdi-minus"
                          size="x-small"
                          color="error"
                          class="remove-btn"
                          @click.stop="removePiece(row - 1, col - 1)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Piece selector panel - 4 columns on desktop, 12 columns on mobile -->
            <v-col cols="12" md="4" class="pa-1">
              <div class="piece-selector">
                <h5 class="mb-2">{{ $t('positionEditor.addPieces') }}</h5>

                <!-- Known Piece Selection -->
                <div class="piece-category">
                  <h6 class="mb-1">{{ $t('positionEditor.brightPieces') }}</h6>
                  <div class="piece-grid">
                    <div
                      v-for="piece in knownPieces"
                      :key="piece.name"
                      class="piece-option"
                      @click="addPiece(piece.name, true)"
                    >
                      <img
                        :src="getPieceImageUrl(piece.name)"
                        :alt="piece.name"
                        class="piece-img"
                      />
                      <span class="piece-name">{{ piece.displayName }}</span>
                    </div>
                  </div>
                </div>

                <!-- Unknown Piece Selection -->
                <div class="piece-category">
                  <h6 class="mb-1">{{ $t('positionEditor.darkPieces') }}</h6>
                  <div class="piece-grid">
                    <div
                      v-for="piece in unknownPieces"
                      :key="piece.name"
                      class="piece-option"
                      @click="addPiece(piece.name, false)"
                    >
                      <img
                        :src="getPieceImageUrl('dark_piece')"
                        :alt="piece.name"
                        class="piece-img"
                      />
                      <span class="piece-name">{{ piece.displayName }}</span>
                    </div>
                  </div>
                </div>

                <!-- Current Selection Info -->
                <div v-if="selectedCell.row !== -1" class="selected-info">
                  <p class="mb-1">
                    {{ $t('positionEditor.selectedPosition') }}:
                    {{ String.fromCharCode(97 + selectedCell.col)
                    }}{{ 9 - selectedCell.row }}
                  </p>
                  <p
                    v-if="getPieceAt(selectedCell.row, selectedCell.col)"
                    class="mb-0"
                  >
                    {{ $t('positionEditor.piece') }}:
                    {{
                      getPieceDisplayName(
                        getPieceAt(selectedCell.row, selectedCell.col)!.name
                      )
                    }}
                  </p>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Validation Status -->
          <v-row class="mt-2">
            <v-col cols="12">
              <v-alert
                :type="validationStatus === 'normal' ? 'success' : 'error'"
                :title="
                  $t('positionEditor.validationStatus.' + validationStatus)
                "
                variant="tonal"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" size="small" @click="cancelEdit">
          {{ $t('positionEditor.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          @click="applyChanges"
          :disabled="validationStatus !== 'normal'"
        >
          {{ $t('positionEditor.applyChanges') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, inject, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { Piece } from '@/composables/useChessGame'
  import { START_FEN } from '@/utils/constants'

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'position-changed', pieces: Piece[], sideToMove: 'red' | 'black'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { t } = useI18n()
  const gameState: any = inject('game-state')

  // Dialog visibility
  const isVisible = computed({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value),
  })

  // Editing state
  const editingPieces = ref<Piece[]>([])
  const editingSideToMove = ref<'red' | 'black'>('red')
  const selectedCell = ref({ row: -1, col: -1 })

  // Piece options
  const knownPieces = computed(() => [
    {
      name: 'red_chariot',
      displayName: t('positionEditor.pieces.red_chariot'),
    },
    { name: 'red_horse', displayName: t('positionEditor.pieces.red_horse') },
    {
      name: 'red_elephant',
      displayName: t('positionEditor.pieces.red_elephant'),
    },
    {
      name: 'red_advisor',
      displayName: t('positionEditor.pieces.red_advisor'),
    },
    { name: 'red_king', displayName: t('positionEditor.pieces.red_king') },
    { name: 'red_cannon', displayName: t('positionEditor.pieces.red_cannon') },
    { name: 'red_pawn', displayName: t('positionEditor.pieces.red_pawn') },
    {
      name: 'black_chariot',
      displayName: t('positionEditor.pieces.black_chariot'),
    },
    {
      name: 'black_horse',
      displayName: t('positionEditor.pieces.black_horse'),
    },
    {
      name: 'black_elephant',
      displayName: t('positionEditor.pieces.black_elephant'),
    },
    {
      name: 'black_advisor',
      displayName: t('positionEditor.pieces.black_advisor'),
    },
    { name: 'black_king', displayName: t('positionEditor.pieces.black_king') },
    {
      name: 'black_cannon',
      displayName: t('positionEditor.pieces.black_cannon'),
    },
    { name: 'black_pawn', displayName: t('positionEditor.pieces.black_pawn') },
  ])

  const unknownPieces = computed(() => [
    { name: 'unknown', displayName: t('positionEditor.pieces.unknown') },
  ])

  // Initialize editing state
  watch(isVisible, visible => {
    if (visible) {
      // Deep copy the current board state, but keep the unknown state of unknown pieces
      editingPieces.value = gameState.pieces.value.map((piece: any) => ({
        ...piece,
        id: piece.id, // Keep the original ID
        // If it's an unknown piece, ensure it remains unknown
        isKnown: piece.isKnown,
        name: piece.isKnown
          ? piece.name
          : gameState.isBoardFlipped
            ? piece.row >= 5
              ? 'red_unknown'
              : 'black_unknown'
            : piece.row < 5
              ? 'red_unknown'
              : 'black_unknown',
      }))
      editingSideToMove.value = gameState.sideToMove.value
      selectedCell.value = { row: -1, col: -1 }
    }
  })

  // Get the piece at a specific position
  const getPieceAt = (row: number, col: number): Piece | null => {
    return editingPieces.value.find(p => p.row === row && p.col === col) || null
  }

  // Select a cell
  const selectCell = (row: number, col: number) => {
    selectedCell.value = { row, col }
  }

  // Add a piece
  const addPiece = (pieceName: string, isKnown: boolean) => {
    if (selectedCell.value.row === -1) return

    const existingPiece = getPieceAt(
      selectedCell.value.row,
      selectedCell.value.col
    )
    if (existingPiece) {
      // Remove the existing piece
      editingPieces.value = editingPieces.value.filter(
        p => p.id !== existingPiece.id
      )
    }

    // For unknown pieces, determine red/black based on position
    let finalPieceName = pieceName
    if (pieceName === 'unknown') {
      // Need to consider if the board is flipped
      const isRedSide = gameState.isBoardFlipped
        ? selectedCell.value.row >= 5
        : selectedCell.value.row < 5
      finalPieceName = isRedSide ? 'red_unknown' : 'black_unknown'
    }

    const newPiece: Piece = {
      id: Date.now() + Math.random(), // Generate a unique ID
      name: finalPieceName,
      row: selectedCell.value.row,
      col: selectedCell.value.col,
      isKnown,
      initialRole: gameState.getRoleByPosition
        ? gameState.getRoleByPosition(
            selectedCell.value.row,
            selectedCell.value.col
          )
        : '',
      initialRow: selectedCell.value.row,
      initialCol: selectedCell.value.col,
    }

    editingPieces.value.push(newPiece)
  }

  // Remove a piece
  const removePiece = (row: number, col: number) => {
    editingPieces.value = editingPieces.value.filter(
      p => !(p.row === row && p.col === col)
    )
  }

  // Flip the board both vertically and horizontally (visual flip, also affects main interface display)
  const flipBoard = () => {
    editingPieces.value = editingPieces.value.map(piece => ({
      ...piece,
      row: 9 - piece.row, // Vertical flip (up-down)
      col: 8 - piece.col, // Horizontal mirror flip (left-right)
      initialRow: 9 - piece.initialRow, // Vertical flip for initial position
      initialCol: 8 - piece.initialCol, // Horizontal mirror flip for initial position
    }))

    // Use the game state's flip function
    if (gameState.toggleBoardFlip) {
      gameState.toggleBoardFlip()
    }
  }

  // Switch side to move
  const switchSide = () => {
    editingSideToMove.value =
      editingSideToMove.value === 'red' ? 'black' : 'red'
  }

  // Reset position
  const resetPosition = () => {
    if (gameState.loadFen) {
      gameState.loadFen(START_FEN, false)

      setTimeout(() => {
        const originalPieces = gameState.pieces.value.map((piece: any) => ({
          ...piece,
          id: piece.id,
          isKnown: piece.isKnown,
          name: piece.isKnown
            ? piece.name
            : piece.row >= 5
              ? 'red_unknown'
              : 'black_unknown',
        }))

        editingPieces.value = originalPieces
        editingSideToMove.value = 'red'
      }, 0)
    }
  }

  // Validation status
  const validationStatus = computed(() => {
    // Check for duplicate piece positions
    const positions = editingPieces.value.map(p => `${p.row},${p.col}`)
    const uniquePositions = new Set(positions)
    if (positions.length !== uniquePositions.size) {
      return 'error'
    }

    return 'normal'
  })

  // Get piece image URL
  const getPieceImageUrl = (pieceName: string): string => {
    const imageName =
      pieceName === 'red_unknown' ||
      pieceName === 'black_unknown' ||
      pieceName === 'unknown'
        ? 'dark_piece'
        : pieceName
    return new URL(`../assets/${imageName}.svg`, import.meta.url).href
  }

  // Get piece display name
  const getPieceDisplayName = (pieceName: string): string => {
    const knownPiece = knownPieces.value.find((p: any) => p.name === pieceName)
    if (knownPiece) return knownPiece.displayName

    if (pieceName === 'red_unknown')
      return t('positionEditor.pieces.red_unknown')
    if (pieceName === 'black_unknown')
      return t('positionEditor.pieces.black_unknown')
    if (pieceName === 'unknown') return t('positionEditor.pieces.unknown')

    return pieceName
  }

  // Cancel edit
  const cancelEdit = () => {
    isVisible.value = false
  }

  // Apply changes
  const applyChanges = () => {
    if (validationStatus.value !== 'normal') return

    // Directly apply the edited piece positions
    // If the board was flipped, the main interface will also remain flipped
    gameState.pieces.value = editingPieces.value
    gameState.sideToMove.value = editingSideToMove.value

    // Record the edit operation in history
    const editData = `position_edit:${editingPieces.value.length}_pieces`
    if (gameState.recordAndFinalize) {
      gameState.recordAndFinalize('adjust', editData)
    }

    // Reset the zIndex of all pieces during position editing
    gameState.pieces.value.forEach((p: any) => (p.zIndex = undefined))
    // Update zIndex for all pieces based on new positions
    if (gameState.updateAllPieceZIndexes) {
      gameState.updateAllPieceZIndexes()
    }

    // Trigger the arrow clear event
    if (gameState.triggerArrowClear) {
      gameState.triggerArrowClear()
    }

    // Force stop engine analysis and AI to ensure applying position edit when engine doesn't continue thinking
    window.dispatchEvent(
      new CustomEvent('force-stop-ai', {
        detail: { reason: 'position-edit' },
      })
    )

    emit('position-changed', editingPieces.value, editingSideToMove.value)
    isVisible.value = false
  }
</script>

<style lang="scss" scoped>
  .position-editor-board {
    border: 2px solid #333;
    border-radius: 6px;
    overflow: hidden;
    background: #f5f5dc;
    // Ensure board has appropriate max-width on mobile
    max-width: 100%;
    margin: 0 auto;
  }

  .board-grid {
    display: grid;
    grid-template-rows: repeat(10, 1fr);
    aspect-ratio: 9/10;
    // Adjust board size on mobile
    @media (max-width: 768px) {
      aspect-ratio: 9/10;
      max-width: 100%;
    }
  }

  .board-row {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
  }

  .board-cell {
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    min-height: 32px;

    &:hover {
      background-color: #e3f2fd;
    }

    &.selected {
      background-color: #bbdefb;
      border-color: #1976d2;
    }

    &.has-piece {
      background-color: #f0f8ff;
    }

    // Adjust piece size on mobile
    @media (max-width: 768px) {
      min-height: 24px;
    }
  }

  .piece-display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .piece-img {
    width: 24px;
    height: 24px;

    // Adjust piece image size on mobile
    @media (max-width: 768px) {
      width: 18px;
      height: 18px;
    }
  }

  .remove-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    z-index: 10;
    width: 14px !important;
    height: 14px !important;
    min-width: 14px !important;
    min-height: 14px !important;

    // Adjust remove button size on mobile
    @media (max-width: 768px) {
      width: 12px !important;
      height: 12px !important;
      min-width: 12px !important;
      min-height: 12px !important;
      top: -3px;
      right: -3px;
    }
  }

  .piece-selector {
    padding: 12px;
    background-color: rgb(var(--v-theme-surface));
    border-radius: 6px;
    height: 100%;
    overflow-y: auto;

    // Adjust selector style on mobile
    @media (max-width: 768px) {
      height: auto;
      margin-top: 12px;
      max-height: 300px;
    }
  }

  .piece-category {
    margin-bottom: 12px;

    h6 {
      margin: 0 0 6px 0;
      color: rgb(var(--v-theme-on-surface));
      font-size: 12px;
    }
  }

  .piece-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;

    // Increase columns on mobile to show more pieces
    @media (max-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }
  }

  .piece-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
    cursor: pointer;
    background-color: rgb(var(--v-theme-surface));

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.1);
      border-color: #1976d2;
    }

    .piece-img {
      width: 20px;
      height: 20px;
      margin-bottom: 2px;

      // Adjust piece image size in selector on mobile
      @media (max-width: 768px) {
        width: 16px;
        height: 16px;
      }
    }

    .piece-name {
      font-size: 9px;
      text-align: center;
      color: rgb(var(--v-theme-on-surface));

      // Adjust text size on mobile
      @media (max-width: 768px) {
        font-size: 7px;
      }
    }
  }

  .selected-info {
    margin-top: 12px;
    padding: 8px;
    background-color: rgb(var(--v-theme-surface));
    border-radius: 4px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

    p {
      margin: 2px 0;
      font-size: 11px;
      color: rgb(var(--v-theme-on-surface));
    }
  }

  .gap-1 {
    gap: 4px;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }
</style>
